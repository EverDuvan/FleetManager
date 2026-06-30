import React, { useState } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { Dialog } from './ui/Dialog';
import { Truck, MapPin, Building2, FileText, Activity, Edit, Trash2 } from 'lucide-react';

export function TerminalesTab({ data, permissions, onUpdateTerminal, onDeleteTerminal }) {
  const { terminales, vehicles } = data;
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [terminalCode, setTerminalCode] = useState('');
  const [error, setError] = useState('');

  const columns = [
    { key: 'terminal', label: 'Terminal', sortable: true, filterable: true, cellClassName: 'font-semibold font-mono' },
    { key: 'ciudad', label: 'Ciudad', sortable: true, filterable: true },
    { key: 'empresa', label: 'Empresa', sortable: true, filterable: true },
    { key: 'contractNumber', label: 'Contrato', sortable: true, filterable: false, cellClassName: 'font-mono' },
    { key: 'planned', label: 'Planificados', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    { key: 'actual', label: 'Físicos Reales', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    {
      key: 'estado',
      label: 'Saturación / Déficit',
      sortable: true,
      filterable: false,
      render: (_, row) => {
        const diff = row.actual - row.planned;
        if (diff === 0) {
          return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">Óptimo</span>;
        } else if (diff < 0) {
          const pct = Math.round((row.actual / row.planned) * 100) || 0;
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                Déficit ({diff})
              </span>
              <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                Excedente (+{diff})
              </span>
              <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          );
        }
      }
    }
  ];

  const handleOpenEdit = () => {
    if (!selectedTerminal) return;
    setTerminalCode(selectedTerminal.terminal);
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!terminalCode.trim()) {
      setError('El código de terminal no puede estar vacío.');
      return;
    }

    onUpdateTerminal(selectedTerminal.terminal, terminalCode.trim(), selectedTerminal.ciudad);
    setSelectedTerminal(prev => ({ ...prev, terminal: terminalCode.trim(), id: `${terminalCode.trim()}-${prev.ciudad}` }));
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedTerminal) return;
    if (window.confirm(`¿Está seguro de que desea eliminar la Terminal ${selectedTerminal.terminal} (${selectedTerminal.ciudad})?\nEsto eliminará los contratos mapeados a ella y desvinculará sus vehículos.`)) {
      onDeleteTerminal(selectedTerminal.terminal, selectedTerminal.ciudad);
      setSelectedTerminal(null);
    }
  };

  // Vehicles matching selected terminal
  const terminalVehicles = selectedTerminal
    ? vehicles.filter(v => 
        v.terminal === selectedTerminal.terminal || 
        (v.city && v.city.toLowerCase() === selectedTerminal.ciudad.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 transition-all duration-300 ${selectedTerminal ? 'w-full lg:w-2/3' : 'w-full'}`}>
        <DataTable
          columns={columns}
          data={terminales}
          idField="id"
          onRowClick={(row) => setSelectedTerminal(row)}
          selectedRowId={selectedTerminal?.id}
          searchPlaceholder="Buscar por terminal, ciudad o empresa..."
        />
      </div>

      <SidePanel
        isOpen={!!selectedTerminal}
        onClose={() => setSelectedTerminal(null)}
        title={`Terminal ${selectedTerminal?.terminal}: ${selectedTerminal?.ciudad}`}
      >
        {selectedTerminal && (
          <div className="space-y-6">
            {/* Operator/Admin Actions */}
            {permissions.isOperator && (
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                >
                  <Edit size={12} />
                  Editar Código
                </button>
                {permissions.isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-lg text-xs font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                )}
              </div>
            )}

            {/* Quick Specs */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <Building2 size={16} className="text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Empresa Operadora</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedTerminal.empresa}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <FileText size={16} className="text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Contrato Asignado</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{selectedTerminal.contractNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                <Activity size={16} className="text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Diferencia Operativa</span>
                  <span className={`font-semibold ${selectedTerminal.actual - selectedTerminal.planned >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {selectedTerminal.actual - selectedTerminal.planned === 0 
                      ? 'Sin diferencia (Óptimo)' 
                      : selectedTerminal.actual - selectedTerminal.planned > 0 
                      ? `Exceso de ${selectedTerminal.actual - selectedTerminal.planned} vehículos` 
                      : `Déficit de ${Math.abs(selectedTerminal.actual - selectedTerminal.planned)} vehículos`}
                  </span>
                </div>
              </div>
            </div>

            {/* Capacities */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Cupo Planificado</span>
                <p className="text-xl font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedTerminal.planned}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Cupo Físico Real</span>
                <p className="text-xl font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedTerminal.actual}</p>
              </div>
            </div>

            {/* Terminal Vehicles List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Truck size={14} />
                Física Vehicular en Terminal ({terminalVehicles.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 max-h-56 overflow-y-auto">
                {terminalVehicles.length > 0 ? (
                  terminalVehicles.map(v => (
                    <div key={v.vin} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Unidad {v.unitNo}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">{v.make} ({v.year})</span>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-mono">
                          {v.tag}
                        </span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-mono mt-0.5">{v.vin.substring(0, 10)}...</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-400 dark:text-zinc-650 text-xs">
                    Ningún vehículo físico asignado a esta terminal.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Edit Code Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Código Terminal (${selectedTerminal?.ciudad})`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Nuevo Código de Terminal</label>
            <input
              type="text"
              value={terminalCode}
              onChange={e => setTerminalCode(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              placeholder="Ej. 331"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold"
            >
              Guardar
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
