import React, { useState, useMemo } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { ExportButtons } from './ui/ExportButtons';
import { exportTableToPDF, exportTableToExcel } from '../utils/exportUtils';
import { 
  User, 
  Tag, 
  Trash2, 
  Info,
  Clock
} from 'lucide-react';

export function HistorialTab({ movements, permissions, onClearHistory }) {
  const [selectedMovement, setSelectedMovement] = useState(null);

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Fecha y Hora',
      sortable: true,
      filterable: false,
      cellClassName: 'font-mono text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400',
      render: (val) => formatTimestamp(val)
    },
    { 
      key: 'user', 
      label: 'Usuario', 
      sortable: true, 
      filterable: true,
      cellClassName: 'font-semibold text-zinc-800 dark:text-zinc-200' 
    },
    {
      key: 'action',
      label: 'Acción',
      sortable: true,
      filterable: true,
      render: (val) => {
        let colorClass = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
        if (val.startsWith('Añadir')) {
          colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
        } else if (val.startsWith('Editar')) {
          colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
        } else if (val.startsWith('Desactivar') || val.startsWith('Eliminar') || val.startsWith('Vaciar')) {
          colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colorClass}`}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'entityType',
      label: 'Entidad',
      sortable: true,
      filterable: true,
      render: (val) => {
        let colorClass = 'bg-zinc-150 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400';
        if (val === 'Vehículo') {
          colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-950/10 dark:text-blue-400';
        } else if (val === 'Contrato') {
          colorClass = 'bg-purple-50 text-purple-600 dark:bg-purple-950/10 dark:text-purple-400';
        } else if (val === 'Empresa') {
          colorClass = 'bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400';
        } else if (val === 'Ciudad') {
          colorClass = 'bg-teal-50 text-teal-600 dark:bg-teal-950/10 dark:text-teal-400';
        } else if (val === 'Terminal') {
          colorClass = 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/10 dark:text-cyan-400';
        }
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colorClass}`}>
            {val}
          </span>
        );
      }
    },
    { 
      key: 'entityId', 
      label: 'ID Entidad', 
      sortable: true, 
      filterable: false,
      cellClassName: 'font-mono text-xs text-zinc-400 dark:text-zinc-500' 
    },
    { 
      key: 'description', 
      label: 'Detalles / Descripción', 
      sortable: false, 
      filterable: false,
      cellClassName: 'truncate max-w-[280px] text-zinc-650 dark:text-zinc-350' 
    }
  ];

  // Map movements for exports with human-readable timestamp
  const exportData = useMemo(() => {
    return movements.map(m => ({
      ...m,
      formattedDate: formatTimestamp(m.timestamp)
    }));
  }, [movements]);

  const exportColumns = [
    { key: 'formattedDate', label: 'Fecha y Hora' },
    { key: 'user', label: 'Usuario' },
    { key: 'action', label: 'Acción' },
    { key: 'entityType', label: 'Tipo Entidad' },
    { key: 'entityId', label: 'ID Entidad' },
    { key: 'description', label: 'Descripción' }
  ];

  const handleExportPDF = () => {
    exportTableToPDF('Bitácora de Auditoría y Movimientos', exportColumns, exportData, 'historial_movimientos');
  };

  const handleExportExcel = () => {
    exportTableToExcel('Historial Movimientos', exportColumns, exportData, 'historial_movimientos');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Table area */}
      <div className={`flex-1 transition-all duration-300 ${selectedMovement ? 'w-full lg:w-2/3' : 'w-full'} space-y-4`}>
        {/* Top toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />

          {permissions?.isAdmin && movements.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Vaciar Historial
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={movements}
          idField="id"
          onRowClick={(row) => setSelectedMovement(row)}
          selectedRowId={selectedMovement?.id}
          searchPlaceholder="Buscar por usuario, acción, detalles..."
        />
      </div>

      {/* Side panel for details */}
      <SidePanel
        isOpen={!!selectedMovement}
        onClose={() => setSelectedMovement(null)}
        title="Detalles de Movimiento"
      >
        {selectedMovement && (
          <div className="space-y-5">
            {/* Action Header Tag */}
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Acción Registrada</span>
              <div className="ml-auto">
                {columns[2].render(selectedMovement.action)}
              </div>
            </div>

            {/* Timestamp Info */}
            <div className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
              <Clock size={16} className="text-zinc-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Fecha y Hora</span>
                <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {formatTimestamp(selectedMovement.timestamp)}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
              <User size={16} className="text-zinc-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Usuario Responsable</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedMovement.user}
                </span>
              </div>
            </div>

            {/* Entity Assignment */}
            <div className="border border-zinc-150 dark:border-zinc-850 rounded-lg p-4 space-y-3">
              <h5 className="font-bold text-xs uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Tag size={12} />
                Entidad Afectada
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold block">Tipo</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedMovement.entityType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold block">Identificador</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 break-all">
                    {selectedMovement.entityId}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Description */}
            <div className="p-4 bg-blue-50/30 dark:bg-zinc-900/40 border border-blue-100/55 dark:border-zinc-800 rounded-lg space-y-2">
              <h5 className="font-bold text-xs uppercase text-blue-650 dark:text-blue-400 flex items-center gap-1.5">
                <Info size={12} />
                Descripción del Evento
              </h5>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                {selectedMovement.description}
              </p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
