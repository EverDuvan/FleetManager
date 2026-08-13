#!/usr/bin/env node
/**
 * syncToProduction.js
 * -------------------
 * Envía los datos locales (contratos, vehículos, movimientos, documentos) a la base de datos de producción (Railway).
 *
 * Uso:
 *   node scripts/syncToProduction.js
 *
 * Variables de entorno opcionales:
 *   PROD_URL   - URL del servidor de producción (default: https://fleetmanager-production-01da.up.railway.app)
 *   LOCAL_URL  - URL del servidor local          (default: http://localhost:3001)
 */

const PROD_URL  = process.env.PROD_URL  || 'https://fleetmanager-production-01da.up.railway.app';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3001';

async function main() {
  console.log('🚀 FleetManager — Sincronización de local a producción (Railway)');
  console.log('─'.repeat(60));
  console.log(`💻 Servidor Local      : ${LOCAL_URL}`);
  console.log(`📡 Servidor Producción : ${PROD_URL}`);
  console.log('');

  // ── 1. Exportar datos locales ──────────────────────────────────
  console.log('⏳ Exportando datos desde el servidor local...');
  let exportData;
  try {
    const res = await fetch(`${LOCAL_URL}/api/export`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    exportData = await res.json();
  } catch (err) {
    console.error('❌ Error al conectar con el servidor local:');
    console.error('  ', err.message);
    console.error('   Asegúrate de que el servidor local está corriendo (`npm run dev`).');
    process.exit(1);
  }

  const { contracts = [], vehicles = [], movements = [], documents = [], exportedAt } = exportData;
  console.log(`✅ Datos locales exportados (${exportedAt}):`);
  console.log(`   • Contratos  : ${contracts.length}`);
  console.log(`   • Vehículos  : ${vehicles.length}`);
  console.log(`   • Movimientos: ${movements.length}`);
  console.log(`   • Documentos : ${documents.length}`);
  console.log('');

  // ── 2. Importar datos al servidor de producción (Railway) ─────
  console.log('⏳ Enviando datos a la base de datos de producción en Railway...');
  let importResult;
  try {
    const res = await fetch(`${PROD_URL}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contracts, vehicles, movements, documents })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    importResult = await res.json();
  } catch (err) {
    console.error('❌ Error al conectar con el servidor de producción (Railway):');
    console.error('  ', err.message);
    process.exit(1);
  }

  console.log('✅ Sincronización a Producción completada exitosamente:');
  console.log(`   • Contratos  : ${importResult.imported.contracts}`);
  console.log(`   • Vehículos  : ${importResult.imported.vehicles}`);
  console.log(`   • Movimientos: ${importResult.imported.movements}`);
  console.log(`   • Documentos : ${importResult.imported.documents}`);
  console.log('');
  console.log('🎉 ¡Listo! La base de datos de producción en Railway ahora contiene tus datos locales.');
}

main();
