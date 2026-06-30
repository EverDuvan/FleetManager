/**
 * exportUtils.js
 * Utilidades de exportación PDF y Excel para FleetManager
 * Usa jsPDF + jspdf-autotable para PDF y SheetJS (xlsx) para Excel.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const BRAND = {
  blue: [37, 99, 235],       // blue-600
  darkBg: [9, 9, 11],        // zinc-950
  headerBg: [24, 24, 27],    // zinc-900
  rowAlt: [244, 244, 245],   // zinc-100
  border: [228, 228, 231],   // zinc-200
  text: [24, 24, 27],        // zinc-900
  subtext: [113, 113, 122],  // zinc-500
  white: [255, 255, 255],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTimestamp() {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Dibuja el encabezado de FleetManager en un PDF.
 * @param {jsPDF} doc
 * @param {string} title  - Título del reporte
 */
function drawHeader(doc, title) {
  const pageW = doc.internal.pageSize.getWidth();

  // Blue accent bar
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, 0, pageW, 18, 'F');

  // App name
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FleetManager', 14, 12);

  // Report title (right side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageW - 14, 12, { align: 'right' });

  // Timestamp below header bar
  doc.setTextColor(...BRAND.subtext);
  doc.setFontSize(7.5);
  doc.text(`Generado: ${getTimestamp()}`, 14, 24);

  // Decorative line
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.4);
  doc.line(14, 27, pageW - 14, 27);
}

/**
 * Dibuja el pie de página con número de página.
 * @param {jsPDF} doc
 */
function drawFooter(doc) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.subtext);
    doc.text('Panel de Control de Flotas y Contratos — FleetManager', 14, pageH - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageW - 14, pageH - 7, { align: 'right' });
  }
}

// ─── Table Export ─────────────────────────────────────────────────────────────

/**
 * Exporta una tabla como PDF.
 * @param {string}   title    - Título visible en el PDF
 * @param {Array}    columns  - [{ label, key }]
 * @param {Array}    rows     - Array de objetos de datos
 * @param {string}   filename - Nombre base del archivo (sin extensión)
 */
export function exportTableToPDF(title, columns, rows, filename) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  drawHeader(doc, title);

  // Build table arrays
  const head = [columns.map(c => c.label)];
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
      return val === null || val === undefined ? '' : String(val);
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: 31,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: BRAND.text,
      lineColor: BRAND.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BRAND.blue,
      textColor: BRAND.white,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: BRAND.rowAlt,
    },
    columnStyles: {},
    didDrawPage: () => drawHeader(doc, title),
  });

  drawFooter(doc);
  doc.save(`${slugify(filename)}.pdf`);
}

/**
 * Exporta una tabla como archivo Excel (.xlsx).
 * @param {string}   title    - Usado como nombre de hoja
 * @param {Array}    columns  - [{ label, key }]
 * @param {Array}    rows     - Array de objetos de datos
 * @param {string}   filename - Nombre base del archivo (sin extensión)
 */
export function exportTableToExcel(title, columns, rows, filename) {
  // Header row
  const header = columns.map(c => c.label);

  // Data rows
  const data = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
      return val === null || val === undefined ? '' : val;
    })
  );

  const wsData = [header, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths based on header length
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length + 4, 14) }));

  // Style header row (SheetJS community doesn't support cell styles in .xlsx without pro)
  // We add metadata only
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));

  // Add a meta sheet
  const metaWs = XLSX.utils.aoa_to_sheet([
    ['Reporte', title],
    ['Generado', getTimestamp()],
    ['Sistema', 'FleetManager — Panel de Control de Flotas y Contratos'],
    ['Total Registros', rows.length],
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, 'Info');

  XLSX.writeFile(wb, `${slugify(filename)}.xlsx`);
}

// ─── Single Vehicle PDF ───────────────────────────────────────────────────────

/**
 * Exporta la ficha técnica de un vehículo individual como PDF.
 * @param {Object} vehicle - Objeto del vehículo con todos sus campos
 */
export function exportVehicleDetailPDF(vehicle) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header ──
  drawHeader(doc, 'Ficha Técnica Vehicular');

  // ── Title block ──
  let y = 34;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.text);
  doc.text(`Unidad: ${vehicle.unitNo}`, margin, y);

  // Status badge
  const hasContract = vehicle.contract !== 'No encontrado' && vehicle.empresa !== 'No asociado';
  doc.setFillColor(...(hasContract ? [16, 185, 129] : [239, 68, 68]));  // emerald / red
  doc.roundedRect(pageW - margin - 32, y - 6, 32, 9, 2, 2, 'F');
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(hasContract ? 'VINCULADO' : 'SIN CONTRATO', pageW - margin - 16, y - 0.5, { align: 'center' });

  y += 6;
  doc.setTextColor(...BRAND.subtext);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${vehicle.make} · Año ${vehicle.year || 'N/A'} · ${vehicle.bodyType}`, margin, y);

  // Separator
  y += 6;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);

  // ── Section: Datos Técnicos ──
  y += 8;
  doc.setFillColor(...BRAND.blue);
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
  doc.text('DATOS TÉCNICOS', margin + 3, y + 0.5);

  y += 9;
  const techFields = [
    ['VIN', vehicle.vin || 'N/A'],
    ['Número de Unidad', vehicle.unitNo],
    ['Marca / Fabricante', vehicle.make],
    ['Año de Modelo', String(vehicle.year || 'N/A')],
    ['Tipo de Carrocería', vehicle.bodyType],
    ['Placa / Tag', vehicle.tag || 'N/A'],
  ];

  techFields.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? margin : pageW / 2 + 4;
    const rowY = y + Math.floor(i / 2) * 12;

    if (i % 2 === 0 && i > 0) {
      // Subtle line between rows
      doc.setDrawColor(...BRAND.border);
      doc.setLineWidth(0.15);
      doc.line(margin, rowY - 2, pageW - margin, rowY - 2);
    }

    doc.setTextColor(...BRAND.subtext);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x, rowY);

    doc.setTextColor(...BRAND.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x, rowY + 5);
  });

  // ── Section: Asignación de Servicio ──
  y += Math.ceil(techFields.length / 2) * 12 + 6;
  doc.setFillColor(...BRAND.blue);
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
  doc.text('ASIGNACIÓN DE SERVICIO', margin + 3, y + 0.5);

  y += 9;
  const serviceFields = [
    ['Ciudad de Operación', vehicle.city || 'Sin Ciudad'],
    ['Empresa Operadora', vehicle.empresa || 'No asociado'],
    ['Contrato de Enlace', vehicle.contract || 'No encontrado'],
    ['Entity ID de Empresa', vehicle.entityId || 'N/A'],
    ['Código de Terminal', vehicle.terminal || 'N/A'],
  ];

  serviceFields.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? margin : pageW / 2 + 4;
    const rowY = y + Math.floor(i / 2) * 12;

    if (i % 2 === 0 && i > 0) {
      doc.setDrawColor(...BRAND.border);
      doc.setLineWidth(0.15);
      doc.line(margin, rowY - 2, pageW - margin, rowY - 2);
    }

    doc.setTextColor(...BRAND.subtext);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x, rowY);

    doc.setTextColor(...BRAND.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x, rowY + 5);
  });

  // ── Warning block if no contract ──
  if (!hasContract) {
    y += Math.ceil(serviceFields.length / 2) * 12 + 8;
    doc.setFillColor(254, 242, 242);   // red-50
    doc.setDrawColor(252, 165, 165);   // red-300
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y - 4, pageW - margin * 2, 14, 2, 2, 'FD');
    doc.setTextColor(185, 28, 28);     // red-700
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠  ATENCIÓN: Este vehículo no está asociado a un contrato vigente.', margin + 4, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      'El registro físico existe pero no está vinculado operativamente. Se recomienda asignar un contrato.',
      margin + 4, y + 7
    );
  }

  drawFooter(doc);
  doc.save(`ficha_vehiculo_${slugify(vehicle.unitNo || vehicle.vin)}.pdf`);
}

/**
 * Exporta los datos de un vehículo individual como Excel (una fila).
 * @param {Object} vehicle
 */
export function exportVehicleDetailExcel(vehicle) {
  const columns = [
    { label: 'Unidad', key: 'unitNo' },
    { label: 'Marca', key: 'make' },
    { label: 'Año', key: 'year' },
    { label: 'Carrocería', key: 'bodyType' },
    { label: 'VIN', key: 'vin' },
    { label: 'Placa / Tag', key: 'tag' },
    { label: 'Ciudad', key: 'city' },
    { label: 'Empresa', key: 'empresa' },
    { label: 'Contrato', key: 'contract' },
    { label: 'Entity ID', key: 'entityId' },
    { label: 'Terminal', key: 'terminal' },
  ];

  exportTableToExcel(
    `Unidad ${vehicle.unitNo}`,
    columns,
    [vehicle],
    `ficha_vehiculo_${slugify(vehicle.unitNo || vehicle.vin)}`
  );
}
