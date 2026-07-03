import React, { useState } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { Dialog } from './ui/Dialog';
import { ExportButtons } from './ui/ExportButtons';
import { exportTableToPDF, exportTableToExcel } from '../utils/exportUtils';
import { FileText, Truck, Edit, Trash2 } from 'lucide-react';

export function EmpresasTab({ data, permissions, onUpdateCompany, onDeleteCompany }) {
  const { empresas, contratos, vehicles } = data;
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [empresaName, setEmpresaName] = useState('');
  const [error, setError] = useState('');

  const columns = [
    { key: 'empresa', label: 'Empresa', sortable: true, filterable: false },
    { key: 'entityId', label: 'Entity ID', sortable: true, filterable: false, cellClassName: 'font-mono text-zinc-500' },
    { key: 'contractsCount', label: 'Contratos', sortable: true, filterable: false, cellClassName: 'text-center font-semibold' },
    { key: 'plannedVehicles', label: 'Esperados (Contrato)', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    { key: 'actualVehicles', label: 'Físicos (Reales)', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    {
      key: 'cumplimiento',
      label: 'Cumplimiento',
      sortable: true,
      filterable: false,
      render: (_, row) => {
        if (row.plannedVehicles === 0) return <span className="text-zinc-400">N/A</span>;
        const pct = Math.round((row.actualVehicles / row.plannedVehicles) * 100);
        let colorClass = 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
        if (pct >= 95 && pct <= 105) colorClass = 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20';
        else if (pct < 95) colorClass = 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/20';
        else if (pct > 105) colorClass = 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/20';
        
        return (
          <div className="flex items-center justify-center gap-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
              {pct}%
            </span>
          </div>
        );
      }
    }
  ];

  // Export handlers
  const exportColumns = [
    { key: 'empresa', label: 'Empresa' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'contractsCount', label: 'Nº Contratos' },
    { key: 'plannedVehicles', label: 'Veh. Planificados' },
    { key: 'actualVehicles', label: 'Veh. Físicos Reales' },
  ];
  const handleExportPDF = () => exportTableToPDF('Empresas Operadoras', exportColumns, empresas, 'empresas');
  const handleExportExcel = () => exportTableToExcel('Empresas', exportColumns, empresas, 'empresas');

  const handleOpenEdit = () => {
    if (!selectedCompany) return;
    setEmpresaName(selectedCompany.empresa);
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!empresaName.trim()) {
      setError('El nombre de la empresa no puede estar vacío.');
      return;
    }

    onUpdateCompany(selectedCompany.entityId, empresaName.trim());
    setSelectedCompany(prev => ({ ...prev, empresa: empresaName.trim() }));
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedCompany) return;
    if (window.confirm(`¿Está seguro de que desea eliminar la empresa "${selectedCompany.empresa}"?\nATENCIÓN: Esto eliminará todos sus contratos y desvinculará sus vehículos.`)) {
      onDeleteCompany(selectedCompany.entityId);
      setSelectedCompany(null);
    }
  };

  // Filter contracts and vehicles for the side panel
  const companyContracts = selectedCompany 
    ? contratos.filter(c => c.entityId === selectedCompany.entityId)
    : [];

  const companyVehicles = selectedCompany
    ? vehicles.filter(v => v.entityId === selectedCompany.entityId || v.empresa === selectedCompany.empresa)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 transition-all duration-300 ${selectedCompany ? 'w-full lg:w-2/3' : 'w-full'} space-y-4`}>
        <div className="flex justify-start">
          <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
        </div>
        <DataTable
          columns={columns}
          data={empresas}
          idField="entityId"
          onRowClick={(row) => setSelectedCompany(row)}
          selectedRowId={selectedCompany?.entityId}
          searchPlaceholder="Buscar por empresa o ID..."
        />
      </div>

      <SidePanel
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title={selectedCompany?.empresa || 'Detalle de Empresa'}
      >
        {selectedCompany && (
          <div className="space-y-6">
            {/* Operator/Admin Actions */}
            {permissions.isOperator && (
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                >
                  <Edit size={12} />
                  Editar Nombre
                </button>
                {permissions.isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-lg text-xs font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                )}
              </div>
            )}

            {/* Card stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">ID de Entidad</span>
                <p className="text-sm font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCompany.entityId}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Contratos</span>
                <p className="text-sm font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCompany.contractsCount}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Planificado</span>
                <p className="text-sm font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCompany.plannedVehicles} veh.</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Físico Real</span>
                <p className="text-sm font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCompany.actualVehicles} veh.</p>
              </div>
            </div>

            {/* List of Contracts */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <FileText size={14} />
                Contratos ({companyContracts.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                {companyContracts.map(c => (
                  <div key={c.contractNumber} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{c.contractNumber}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 block">{c.ciudad} - Terminal {c.terminal}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold block text-zinc-900 dark:text-zinc-100">{c.actualCount} / {c.cantidad}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Real vs Plan</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Vehicles (top 15) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Truck size={14} />
                Vehículos ({companyVehicles.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 max-h-48 overflow-y-auto">
                {companyVehicles.length > 0 ? (
                  companyVehicles.map(v => (
                    <div key={v.vin} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Unidad {v.unitNo}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-mono">{v.vin.substring(0, 8)}... - {v.make} ({v.year})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-mono">
                        {v.tag}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-400 dark:text-zinc-650 text-xs">
                    Ningún vehículo asignado
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Edit Name Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Nombre: ${selectedCompany?.empresa}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Nombre de la Empresa</label>
            <input
              type="text"
              value={empresaName}
              onChange={e => setEmpresaName(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              placeholder="Ej. Tequesta Carrier Inc."
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
