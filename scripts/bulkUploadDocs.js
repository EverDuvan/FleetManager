import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para subir documentos en bloque a FleetManager desplegado en Railway (o local).
 * 
 * USO:
 *   node scripts/bulkUploadDocs.js <URL_RAILWAY> <CARPETA_DOCUMENTOS>
 * 
 * EJEMPLO:
 *   node scripts/bulkUploadDocs.js https://fleetmanager-production.up.railway.app ./mis_documentos
 */

async function bulkUpload() {
  const args = process.argv.slice(2);
  const targetUrl = args[0]?.replace(/\/$/, '');
  const docsFolderArg = args[1];

  if (!targetUrl || !docsFolderArg) {
    console.error('❌ Uso incorrecto.');
    console.log('\nModo de uso:');
    console.log('  node scripts/bulkUploadDocs.js <URL_RAILWAY> <CARPETA_DOCUMENTOS>');
    console.log('\nEjemplo:');
    console.log('  node scripts/bulkUploadDocs.js https://tu-app.up.railway.app ./registrations\n');
    process.exit(1);
  }

  const docsFolder = path.resolve(docsFolderArg);

  if (!fs.existsSync(docsFolder)) {
    console.error(`❌ La carpeta "${docsFolder}" no existe.`);
    process.exit(1);
  }

  console.log(`🌐 Conectando a la aplicación en: ${targetUrl}`);
  
  // 1. Obtener vehículos desde la API REST
  let vehicles = [];
  try {
    const res = await fetch(`${targetUrl}/api/data`);
    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const data = await res.json();
    vehicles = data.vehiclesRaw || [];
    console.log(`✅ Conectado exitosamente. Se encontraron ${vehicles.length} vehículos en la base de datos.`);
  } catch (err) {
    console.error(`❌ Error al conectar a ${targetUrl}/api/data:`, err.message);
    process.exit(1);
  }

  // 2. Leer archivos de la carpeta
  const files = fs.readdirSync(docsFolder);
  const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const docFiles = files.filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

  console.log(`📁 Se encontraron ${docFiles.length} archivos válidos en "${docsFolder}".\n`);

  if (docFiles.length === 0) {
    console.log('⚠️ No hay archivos PDF o imágenes en la carpeta especificada.');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Mapa rápido de búsqueda por UnitNo y por VIN
  const unitNoMap = new Map();
  const vinMap = new Map();

  vehicles.forEach(v => {
    if (v.unitNo) unitNoMap.set(v.unitNo.toString().toLowerCase().trim(), v);
    if (v.vin) vinMap.set(v.vin.toString().toLowerCase().trim(), v);
  });

  for (const file of docFiles) {
    const filePath = path.join(docsFolder, file);
    const fileNameWithoutExt = path.basename(file, path.extname(file)).toLowerCase().trim();
    const stats = fs.statSync(filePath);

    // Intentar emparejar por UnitNo o por VIN en el nombre del archivo
    let vehicle = unitNoMap.get(fileNameWithoutExt) || vinMap.get(fileNameWithoutExt);

    // Si el nombre del archivo contiene patrones como "101.pdf" o "101_matricula.pdf"
    if (!vehicle) {
      for (const [unitNo, v] of unitNoMap.entries()) {
        if (fileNameWithoutExt === unitNo || fileNameWithoutExt.startsWith(`${unitNo}_`) || fileNameWithoutExt.startsWith(`${unitNo}-`)) {
          vehicle = v;
          break;
        }
      }
    }

    if (!vehicle) {
      console.warn(`⚠️ No se encontró vehículo para el archivo: "${file}" (no se pudo asociar por UnitNo ni VIN).`);
      skippedCount++;
      continue;
    }

    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream';

    try {
      const fileBuffer = fs.readFileSync(filePath);

      const uploadRes = await fetch(`${targetUrl}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-vin': vehicle.vin,
          'x-unit-no': vehicle.unitNo,
          'x-filename': encodeURIComponent(file),
          'x-filetype': mimeType,
          'x-size': stats.size.toString()
        },
        body: fileBuffer
      });

      if (uploadRes.ok) {
        console.log(`✅ Subido: "${file}" ➔ Unidad #${vehicle.unitNo} (VIN: ${vehicle.vin})`);
        successCount++;
      } else {
        const errorText = await uploadRes.text();
        console.error(`❌ Error al subir "${file}": ${uploadRes.status} - ${errorText}`);
        failCount++;
      }
    } catch (err) {
      console.error(`❌ Falló la subida de "${file}":`, err.message);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log(`📊 RESUMEN DE LA CARGA MASIVA:`);
  console.log(`  - Exitosos:  ${successCount}`);
  console.log(`  - Fallidos:  ${failCount}`);
  console.log(`  - Omitidos:  ${skippedCount}`);
  console.log('========================================\n');
}

bulkUpload();
