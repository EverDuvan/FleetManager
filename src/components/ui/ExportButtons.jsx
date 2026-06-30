import React from 'react';
import { FileDown, Sheet } from 'lucide-react';

/**
 * ExportButtons
 * Botones de exportación reutilizables para PDF y Excel.
 *
 * Props:
 *  - onExportPDF   {Function}  Callback al hacer clic en PDF
 *  - onExportExcel {Function}  Callback al hacer clic en Excel
 *  - size          {'sm'|'xs'} Tamaño del botón (default 'sm')
 *  - className     {string}    Clases extra para el contenedor
 */
export function ExportButtons({ onExportPDF, onExportExcel, size = 'sm', className = '' }) {
  const isXs = size === 'xs';

  const base = isXs
    ? 'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all duration-150 select-none'
    : 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 select-none';

  const iconSize = isXs ? 11 : 13;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* PDF Button */}
      <button
        type="button"
        onClick={onExportPDF}
        title="Descargar como PDF"
        className={`${base} bg-rose-50 hover:bg-rose-100 active:scale-95 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400`}
      >
        <FileDown size={iconSize} />
        PDF
      </button>

      {/* Excel Button */}
      <button
        type="button"
        onClick={onExportExcel}
        title="Descargar como Excel (.xlsx)"
        className={`${base} bg-emerald-50 hover:bg-emerald-100 active:scale-95 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400`}
      >
        <Sheet size={iconSize} />
        Excel
      </button>
    </div>
  );
}
