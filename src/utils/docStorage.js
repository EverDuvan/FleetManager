/**
 * docStorage.js
 * CRUD wrapper sobre IndexedDB para almacenar documentos
 * de registro vehicular asociados a cada vehículo (por VIN).
 *
 * Esquema:
 *   id         : string  — `${vin}::${filename}` (clave primaria)
 *   vin        : string  — VIN del vehículo asociado
 *   unitNo     : string  — Número de unidad (para nombrar descargas)
 *   name       : string  — Nombre original del archivo
 *   type       : string  — MIME type (application/pdf, image/jpeg, etc.)
 *   size       : number  — Tamaño en bytes
 *   uploadedAt : string  — ISO timestamp
 *   data       : Blob    — Contenido binario del archivo
 */

const DB_NAME    = 'fleetmanager_docs';
const DB_VERSION = 1;
const STORE      = 'vehicle_documents';

// ── Abrir / crear la base de datos ───────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        // Índice para buscar todos los documentos de un VIN
        store.createIndex('vin', 'vin', { unique: false });
      }
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

// ── Helpers internos ──────────────────────────────────────────────────────────
function makeId(vin, filename) {
  return `${vin}::${filename}`;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Guarda un archivo asociado a un vehículo.
 * @param {string} vin
 * @param {string} unitNo
 * @param {File}   file    — objeto File del input
 * @returns {Promise<Object>} — el registro guardado (sin el blob data)
 */
export async function saveDocument(vin, unitNo, file) {
  const db = await openDB();
  const record = {
    id:         makeId(vin, file.name),
    vin,
    unitNo,
    name:       file.name,
    type:       file.type,
    size:       file.size,
    uploadedAt: new Date().toISOString(),
    data:       file,           // IndexedDB almacena Blobs nativamente
  };

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.put(record);
    req.onsuccess = () => resolve({ ...record, data: undefined });
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Obtiene los metadatos de todos los documentos de un vehículo (sin el blob).
 * @param {string} vin
 * @returns {Promise<Array>}
 */
export async function getDocumentsByVin(vin) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE, 'readonly');
    const store   = tx.objectStore(STORE);
    const index   = store.index('vin');
    const req     = index.getAll(vin);

    req.onsuccess = (e) => {
      // Devolver registros sin el blob para evitar serialización pesada
      const docs = (e.target.result || []).map(({ data, ...meta }) => meta);
      resolve(docs);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Carga el Blob de un documento específico para previsualización/descarga.
 * @param {string} id  — el id compuesto `vin::filename`
 * @returns {Promise<{blob: Blob, record: Object}>}
 */
export async function loadDocumentBlob(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);

    req.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) return reject(new Error('Documento no encontrado'));
      resolve({ blob: record.data, record: { ...record, data: undefined } });
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Elimina un documento de la base de datos.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteDocument(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

/**
 * Retorna estadísticas de documentos para un array de VINs.
 * Útil para el dashboard (cuántos vehículos tienen documentos).
 * @param {string[]} vins
 * @returns {Promise<Map<string, number>>}  vin → cantidad de docs
 */
export async function getDocCountsByVin(vins) {
  const db  = await openDB();
  const map = new Map();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const index = store.index('vin');

    const promises = vins.map(
      (vin) =>
        new Promise((res) => {
          const req = index.count(vin);
          req.onsuccess = (e) => res({ vin, count: e.target.result });
          req.onerror   = () => res({ vin, count: 0 });
        })
    );

    Promise.all(promises).then((results) => {
      results.forEach(({ vin, count }) => map.set(vin, count));
      resolve(map);
    });
  });
}

// ── Utilidades de descarga ────────────────────────────────────────────────────

/**
 * Descarga un documento con el nombre basado en el número de unidad.
 * @param {string} id       — id del documento
 * @param {string} unitNo   — número de unidad del vehículo
 */
export async function downloadDocument(id, unitNo) {
  const { blob, record } = await loadDocumentBlob(id);

  // Extraer extensión del archivo original (pdf, jpg, png, etc.)
  const ext = record.name.includes('.')
    ? record.name.split('.').pop().toLowerCase()
    : 'pdf';

  // Nombre final: 13957_registration.pdf
  const downloadName = `${unitNo}_registration.${ext}`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/**
 * Crea una URL temporal de objeto para previsualizar un archivo en el navegador.
 * Debe revocarse cuando ya no se use.
 * @param {string} id
 * @returns {Promise<{url: string, type: string, record: Object}>}
 */
export async function createPreviewUrl(id) {
  const { blob, record } = await loadDocumentBlob(id);
  const url = URL.createObjectURL(blob);
  return { url, type: record.type, record };
}
