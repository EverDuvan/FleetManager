import React, { useState, useMemo } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { Dialog } from './ui/Dialog';
import { ExportButtons } from './ui/ExportButtons';
import { exportTableToPDF, exportTableToExcel } from '../utils/exportUtils';
import { Truck, Building2, MapPin, Tag, Plus, Edit, Trash2 } from 'lucide-react';

export function ContratosTab({ data, permissions, onAddContract, onUpdateContract, onDeleteContract }) {
  const { contratos, vehicles, empresas, ciudades } = data;
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [contractNumber, setContractNumber] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [entityId, setEntityId] = useState('');
  const [terminal, setTerminal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [contratoViejo, setContratoViejo] = useState('');
  const [error, setError] = useState('');

  const columns = [
    { key: 'contractNumber', label: 'Contrato', sortable: true, filterable: false, cellClassName: 'font-mono font-bold' },
    { key: 'empresa', label: 'Empresa', sortable: true, filterable: true },
    { key: 'ciudad', label: 'Ciudad', sortable: true, filterable: true },
    { key: 'terminal', label: 'Terminal', sortable: true, filterable: true, cellClassName: 'font-semibold' },
    { key: 'cantidad', label: 'Planificado', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    { key: 'actualCount', label: 'Físico Real', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    {
      key: 'cumplimiento',
      label: 'Estado',
      sortable: true,
      filterable: false,
      render: (_, row) => {
        const diff = row.actualCount - row.cantidad;
        if (diff === 0) {
          return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">Completo</span>;
        } else if (diff < 0) {
          return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">{Math.abs(diff)} Faltantes</span>;
        } else {
          return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">{diff} Excedentes</span>;
        }
      }
    }
  ];

  // Helper lists
  const uniqueCompanies = useMemo(() => empresas.map(e => ({ name: e.empresa, id: e.entityId })), [empresas]);
  const uniqueCities = useMemo(() => ciudades.map(c => c.name).sort(), [ciudades]);

  // Sync entityId if user selects an existing company in form
  const handleCompanySelect = (val) => {
    setEmpresa(val);
    const found = uniqueCompanies.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (found) {
      setEntityId(found.id);
    }
  };

  const handleOpenAdd = () => {
    setContractNumber('');
    setEmpresa('');
    setEntityId('');
    setTerminal('');
    setCiudad('');
    setCantidad('10');
    setContratoViejo('');
    setError('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!contractNumber.trim() || !empresa.trim() || !entityId.trim() || !terminal.trim() || !ciudad.trim()) {
      setError('Por favor complete todos los campos obligatorios: Contrato, Empresa, Entity ID, Terminal y Ciudad.');
      return;
    }

    if (contratos.some(c => c.contractNumber.toLowerCase() === contractNumber.trim().toLowerCase())) {
      setError('El número de contrato ya existe.');
      return;
    }

    onAddContract({
      contractNumber: contractNumber.trim().toUpperCase(),
      empresa: empresa.trim(),
      entityId: entityId.trim().toUpperCase(),
      terminal: terminal.trim(),
      ciudad: ciudad.trim(),
      cantidad: parseInt(cantidad, 10) || 0,
      contratoViejo: contratoViejo.trim()
    });
    setIsAddOpen(false);
  };

  const handleOpenEdit = () => {
    if (!selectedContract) return;
    setContractNumber(selectedContract.contractNumber);
    setEmpresa(selectedContract.empresa);
    setEntityId(selectedContract.entityId);
    setTerminal(selectedContract.terminal);
    setCiudad(selectedContract.ciudad);
    setCantidad(selectedContract.cantidad);
    setContratoViejo(selectedContract.contratoViejo);
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!contractNumber.trim() || !empresa.trim() || !entityId.trim() || !terminal.trim() || !ciudad.trim()) {
      setError('Por favor complete todos los campos obligatorios: Contrato, Empresa, Entity ID, Terminal y Ciudad.');
      return;
    }

    // Check unique contract ignoring self
    if (contractNumber.trim().toLowerCase() !== selectedContract.contractNumber.toLowerCase() &&
        contratos.some(c => c.contractNumber.toLowerCase() === contractNumber.trim().toLowerCase())) {
      setError('El número de contrato ya está registrado para otro contrato.');
      return;
    }

    const updated = {
      contractNumber: contractNumber.trim().toUpperCase(),
      empresa: empresa.trim(),
      entityId: entityId.trim().toUpperCase(),
      terminal: terminal.trim(),
      ciudad: ciudad.trim(),
      cantidad: parseInt(cantidad, 10) || 0,
      contratoViejo: contratoViejo.trim()
    };

    onUpdateContract(selectedContract.contractNumber, updated);
    setSelectedContract(prev => ({ ...prev, ...updated, actualCount: prev.actualCount }));
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedContract) return;
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente el Contrato ${selectedContract.contractNumber}?\nEsto desvinculará sus vehículos asignados.`)) {
      onDeleteContract(selectedContract.contractNumber);
      setSelectedContract(null);
    }
  };

  // Vehicles matching selected contract
  const contractVehicles = selectedContract
    ? vehicles.filter(v => v.contract === selectedContract.contractNumber)
    : [];

  // Export handlers
  const exportColumns = [
    { key: 'contractNumber', label: 'Nº Contrato' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'terminal', label: 'Terminal' },
    { key: 'cantidad', label: 'Veh. Planificados' },
    { key: 'actualCount', label: 'Veh. Físicos Reales' },
    { key: 'contratoViejo', label: 'Contrato Viejo' },
  ];
  const handleExportPDF = () => exportTableToPDF('Contratos de Servicio', exportColumns, contratos, 'contratos');
  const handleExportExcel = () => exportTableToExcel('Contratos', exportColumns, contratos, 'contratos');

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 transition-all duration-300 ${selectedContract ? 'w-full lg:w-2/3' : 'w-full'} space-y-4`}>
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-3">
          <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
          {permissions.isOperator && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Añadir Contrato
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={contratos}
          idField="contractNumber"
          onRowClick={(row) => setSelectedContract(row)}
          selectedRowId={selectedContract?.contractNumber}
          searchPlaceholder="Buscar por contrato, empresa o ciudad..."
        />
      </div>

      <SidePanel
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={`Contrato: ${selectedContract?.contractNumber}`}
      >
        {selectedContract && (
          <div className="space-y-6">
            {/* Operator/Admin Actions */}
            {permissions.isOperator && (
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                >
                  <Edit size={12} />
                  Editar
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
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-lg">
                <Building2 size={16} className="text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Empresa</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedContract.empresa}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-lg">
                <MapPin size={16} className="text-zinc-400" />
                <div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Ubicación</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedContract.ciudad} (Terminal {selectedContract.terminal})</span>
                </div>
              </div>

              {selectedContract.contratoViejo && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-lg">
                  <Tag size={16} className="text-zinc-400" />
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block uppercase">Contrato Viejo</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{selectedContract.contratoViejo}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Distribution metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Planificados</span>
                <p className="text-xl font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedContract.cantidad}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Asignados Físicos</span>
                <p className="text-xl font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedContract.actualCount}</p>
              </div>
            </div>

            {/* Vehicles list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Truck size={14} />
                Vehículos Asignados ({contractVehicles.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 max-h-60 overflow-y-auto">
                {contractVehicles.length > 0 ? (
                  contractVehicles.map(v => (
                    <div key={v.vin} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Unidad {v.unitNo}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-mono">VIN: {v.vin.substring(0, 10)}...</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-mono block mb-1">
                          {v.tag}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{v.make} ({v.year})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-450 dark:text-zinc-650 text-xs font-medium">
                    Ningún vehículo físico asignado a este contrato.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Add Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Crear Nuevo Contrato">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Número de Contrato (Obligatorio)</label>
            <input
              type="text"
              value={contractNumber}
              onChange={e => setContractNumber(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              placeholder="Ej. C8894068"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Empresa (Obligatorio)</label>
              <input
                type="text"
                value={empresa}
                onChange={e => handleCompanySelect(e.target.value)}
                list="companies-list"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. Tequesta Carrier"
              />
              <datalist id="companies-list">
                {uniqueCompanies.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Entity ID de Empresa (Obligatorio)</label>
              <input
                type="text"
                value={entityId}
                onChange={e => setEntityId(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
                placeholder="Ej. V0026937"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Código Terminal (Obligatorio)</label>
              <input
                type="text"
                value={terminal}
                onChange={e => setTerminal(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
                placeholder="Ej. 331"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Ciudad (Obligatorio)</label>
              <input
                type="text"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                list="cities-list"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. Miami Turnberry"
              />
              <datalist id="cities-list">
                {uniqueCities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Cantidad Vehículos Esperada</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Contrato Viejo (Opcional)</label>
              <input
                type="text"
                value={contratoViejo}
                onChange={e => setContratoViejo(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. 252"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold"
            >
              Crear
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Contrato: ${selectedContract?.contractNumber}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Número de Contrato (Obligatorio)</label>
            <input
              type="text"
              value={contractNumber}
              onChange={e => setContractNumber(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Empresa (Obligatorio)</label>
              <input
                type="text"
                value={empresa}
                onChange={e => handleCompanySelect(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Entity ID de Empresa (Obligatorio)</label>
              <input
                type="text"
                value={entityId}
                onChange={e => setEntityId(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Código Terminal (Obligatorio)</label>
              <input
                type="text"
                value={terminal}
                onChange={e => setTerminal(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Ciudad (Obligatorio)</label>
              <input
                type="text"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Cantidad Vehículos Esperada</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Contrato Viejo</label>
              <input
                type="text"
                value={contratoViejo}
                onChange={e => setContratoViejo(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
