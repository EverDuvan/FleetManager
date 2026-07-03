/**
 * docStorage.js
 * CRUD wrapper que consume APIs del backend para almacenar y gestionar
 * documentos de registro vehicular asociados a cada vehículo (por VIN).
 */

/**
 * Guarda un archivo asociado a un vehículo en el servidor.
 * @param {string} vin
 * @param {string} unitNo
 * @param {File}   file    — objeto File del input
 * @returns {Promise<Object>} — el registro guardado (sin el blob data)
 */
export async function saveDocument(vin, unitNo, file) {
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-vin': vin,
      'x-unit-no': unitNo,
      'x-filename': encodeURIComponent(file.name),
      'x-filetype': file.type,
      'x-size': file.size.toString()
    },
    body: file
  });

  if (!response.ok) {
    throw new Error('Error al subir el documento al servidor');
  }

  return await response.json();
}

/**
 * Obtiene los metadatos de todos los documentos de un vehículo de la base de datos.
 * @param {string} vin
 * @returns {Promise<Array>}
 */
export async function getDocumentsByVin(vin) {
  const response = await fetch(`/api/documents/vin/${encodeURIComponent(vin)}`);
  if (!response.ok) {
    throw new Error('Error al obtener documentos del servidor');
  }
  return await response.json();
}

/**
 * Carga el Blob de un documento específico y su registro desde el servidor.
 * @param {string} id  — el id compuesto `vin::filename`
 * @returns {Promise<{blob: Blob, record: Object}>}
 */
export async function loadDocumentBlob(id) {
  // Cargar el archivo como blob
  const fileRes = await fetch(`/api/documents/file/${encodeURIComponent(id)}`);
  if (!fileRes.ok) {
    throw new Error('Error al cargar el archivo desde el servidor');
  }
  const blob = await fileRes.blob();

  // Cargar los metadatos del archivo
  const metaRes = await fetch(`/api/documents/meta/${encodeURIComponent(id)}`);
  if (!metaRes.ok) {
    throw new Error('Error al cargar los metadatos del documento');
  }
  const record = await metaRes.json();

  return { blob, record };
}

/**
 * Elimina un documento en el servidor.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteDocument(id) {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Error al eliminar el documento del servidor');
  }
}

/**
 * Retorna estadísticas de documentos para un array de VINs consultando al servidor.
 * @param {string[]} vins
 * @returns {Promise<Map<string, number>>}  vin → cantidad de docs
 */
export async function getDocCountsByVin(vins) {
  const response = await fetch('/api/documents/counts');
  if (!response.ok) {
    throw new Error('Error al obtener los conteos de documentos');
  }
  const countsMap = await response.json();
  const map = new Map();
  vins.forEach((vin) => {
    map.set(vin, countsMap[vin] || 0);
  });
  return map;
}

/**
 * Descarga un documento redirigiendo la petición al endpoint de descarga del backend.
 * @param {string} id       — id del documento
 * @param {string} unitNo   — número de unidad del vehículo (para nombrar descargas)
 */
export async function downloadDocument(id, unitNo) {
  // Creamos un elemento <a> oculto y disparamos el clic para descargar desde el endpoint del backend.
  const link = document.createElement('a');
  link.href = `/api/documents/download/${encodeURIComponent(id)}`;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
