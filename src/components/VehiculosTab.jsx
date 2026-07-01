import React, { useState, useMemo } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { Dialog } from './ui/Dialog';
import { ExportButtons } from './ui/ExportButtons';
import { VehicleDocuments } from './ui/VehicleDocuments';
import { exportTableToPDF, exportTableToExcel, exportVehicleDetailPDF, exportVehicleDetailExcel } from '../utils/exportUtils';
import { 
  Truck, 
  Info, 
  Calendar, 
  ShieldAlert, 
  Landmark, 
  MapPin, 
  Hash, 
  ClipboardList, 
  Tag, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';

export function VehiculosTab({ data, permissions, onAddVehicle, onUpdateVehicle, onDeleteVehicle, initialFilter = 'all', onResetFilter }) {
  const { vehicles, contratos, ciudades, empresas } = data;

  // Filter vehicles based on active filter from dashboard
  const filteredVehicles = useMemo(() => {
    if (initialFilter === 'active') {
      return vehicles.filter(v => !v.status || v.status === 'Activo');
    }
    if (initialFilter === 'inactive') {
      return vehicles.filter(v => v.status === 'Sin uso' || v.status === 'Fuera de servicio');
    }
    if (initialFilter === 'unassociated') {
      return vehicles.filter(v => (!v.status || v.status === 'Activo') && (v.contract === 'No encontrado' || v.empresa === 'No asociado'));
    }
    return vehicles;
  }, [vehicles, initialFilter]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Modals Open State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  
  // Form States
  const [unitNo, setUnitNo] = useState('');
  const [make, setMake] = useState('');
  const [year, setYear] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [vin, setVin] = useState('');
  const [tag, setTag] = useState('');
  const [city, setCity] = useState('');
  const [contract, setContract] = useState('');
  const [entityId, setEntityId] = useState('');
  const [status, setStatus] = useState('Activo');
  const [deactivateStatus, setDeactivateStatus] = useState('Fuera de servicio');
  const [error, setError] = useState('');

  const columns = [
    { key: 'unitNo', label: 'Unidad', sortable: true, filterable: false, cellClassName: 'font-semibold font-mono text-blue-600 dark:text-blue-400' },
    { key: 'make', label: 'Marca', sortable: true, filterable: true },
    { key: 'year', label: 'Año', sortable: true, filterable: true, cellClassName: 'font-mono' },
    { key: 'bodyType', label: 'Carrocería', sortable: true, filterable: true, cellClassName: 'truncate max-w-[120px]' },
    { key: 'vin', label: 'VIN', sortable: true, filterable: false, cellClassName: 'font-mono text-zinc-400 dark:text-zinc-500 text-xs' },
    { key: 'tag', label: 'Placa / Tag', sortable: true, filterable: false, cellClassName: 'font-mono font-semibold' },
    { key: 'city', label: 'Ciudad', sortable: true, filterable: true },
    { key: 'empresa', label: 'Empresa', sortable: true, filterable: true, cellClassName: 'truncate max-w-[120px]' },
    {
      key: 'status',
      label: 'Estado Vehículo',
      sortable: true,
      filterable: true,
      render: (val) => {
        const stat = val || 'Activo';
        const colors = {
          'Activo': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
          'Sin uso': 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
          'Fuera de servicio': 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
        };
        const style = colors[stat] || colors['Activo'];
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style}`}>
            {stat}
          </span>
        );
      }
    },
    {
      key: 'estado',
      label: 'Estado Contrato',
      sortable: true,
      filterable: true,
      render: (_, row) => {
        const hasContract = row.contract !== 'No encontrado' && row.empresa !== 'No asociado';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            hasContract 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
          }`}>
            {hasContract ? 'Vinculado' : 'Sin Contrato'}
          </span>
        );
      }
    }
  ];

  // Unique list values for select dropdowns in forms
  const uniqueMakes = useMemo(() => Array.from(new Set(vehicles.map(v => v.make).filter(Boolean))).sort(), [vehicles]);
  const uniqueCities = useMemo(() => ciudades.map(c => c.name).sort(), [ciudades]);

  // Export column definitions (plain text, no renderers)
  const exportColumns = [
    { key: 'unitNo', label: 'Unidad' },
    { key: 'make', label: 'Marca' },
    { key: 'year', label: 'Año' },
    { key: 'bodyType', label: 'Carrocería' },
    { key: 'vin', label: 'VIN' },
    { key: 'tag', label: 'Placa / Tag' },
    { key: 'city', label: 'Ciudad' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'contract', label: 'Contrato' },
    { key: 'terminal', label: 'Terminal' },
    { key: 'status', label: 'Estado Vehículo' },
  ];

  const handleExportTablePDF = () =>
    exportTableToPDF('Inventario de Vehículos', exportColumns, filteredVehicles, 'vehiculos');

  const handleExportTableExcel = () =>
    exportTableToExcel('Vehículos', exportColumns, filteredVehicles, 'vehiculos');

  const handleExportVehiclePDF = () => selectedVehicle && exportVehicleDetailPDF(selectedVehicle);
  const handleExportVehicleExcel = () => selectedVehicle && exportVehicleDetailExcel(selectedVehicle);


  const handleFormContractChange = (val) => {
    setContract(val);
    if (val === 'No encontrado' || val === '') {
      setEntityId('No encontrado');
    } else {
      const match = contratos.find(c => c.contractNumber === val);
      if (match) {
        setEntityId(match.entityId);
      }
    }
  };

  const handleOpenAdd = () => {
    setUnitNo('');
    setMake('');
    setYear(new Date().getFullYear());
    setBodyType('');
    setVin('');
    setTag('');
    setCity('');
    setContract('No encontrado');
    setEntityId('No encontrado');
    setStatus('Activo');
    setError('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!unitNo.trim() || !make.trim() || !vin.trim() || !tag.trim()) {
      setError('Por favor complete los campos obligatorios: Unidad, Marca, VIN y Placa.');
      return;
    }
    
    if (vehicles.some(v => v.vin.toLowerCase() === vin.trim().toLowerCase())) {
      setError('El número VIN ya está registrado para otro vehículo.');
      return;
    }

    let resolvedEmpresa = 'No asociado';
    let resolvedTerminal = 'N/A';
    if (contract && contract !== 'No encontrado') {
      const match = contratos.find(c => c.contractNumber === contract);
      if (match) {
        resolvedEmpresa = match.empresa;
        resolvedTerminal = match.terminal;
      }
    }

    onAddVehicle({
      unitNo: unitNo.trim(),
      make: make.trim(),
      year: parseInt(year, 10) || null,
      bodyType: bodyType.trim() || 'N/A',
      vin: vin.trim().toUpperCase(),
      tag: tag.trim().toUpperCase(),
      city: city || 'Sin Ciudad',
      contract: contract || 'No encontrado',
      entityId: entityId || 'No encontrado',
      empresa: resolvedEmpresa,
      terminal: resolvedTerminal,
      status: status || 'Activo'
    });
    setIsAddOpen(false);
  };

  const handleOpenEdit = () => {
    if (!selectedVehicle) return;
    setUnitNo(selectedVehicle.unitNo);
    setMake(selectedVehicle.make);
    setYear(selectedVehicle.year || '');
    setBodyType(selectedVehicle.bodyType);
    setVin(selectedVehicle.vin);
    setTag(selectedVehicle.tag);
    setCity(selectedVehicle.city === 'Sin Ciudad' ? '' : selectedVehicle.city);
    setContract(selectedVehicle.contract);
    setEntityId(selectedVehicle.entityId);
    setStatus(selectedVehicle.status || 'Activo');
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!unitNo.trim() || !make.trim() || !vin.trim() || !tag.trim()) {
      setError('Por favor complete los campos obligatorios: Unidad, Marca, VIN y Placa.');
      return;
    }

    // Check VIN unique ignoring self
    if (vin.trim().toLowerCase() !== selectedVehicle.vin.toLowerCase() &&
        vehicles.some(v => v.vin.toLowerCase() === vin.trim().toLowerCase())) {
      setError('El número VIN ya está registrado para otro vehículo.');
      return;
    }

    let resolvedEmpresa = 'No asociado';
    let resolvedTerminal = 'N/A';
    if (contract && contract !== 'No encontrado') {
      const match = contratos.find(c => c.contractNumber === contract);
      if (match) {
        resolvedEmpresa = match.empresa;
        resolvedTerminal = match.terminal;
      }
    }

    const updated = {
      unitNo: unitNo.trim(),
      make: make.trim(),
      year: parseInt(year, 10) || null,
      bodyType: bodyType.trim() || 'N/A',
      vin: vin.trim().toUpperCase(),
      tag: tag.trim().toUpperCase(),
      city: city || 'Sin Ciudad',
      contract: contract || 'No encontrado',
      entityId: entityId || 'No encontrado',
      empresa: resolvedEmpresa,
      terminal: resolvedTerminal,
      status: status || 'Activo'
    };

    onUpdateVehicle(selectedVehicle.vin, updated);
    setSelectedVehicle(prev => ({ ...prev, ...updated }));
    setIsEditOpen(false);
  };

  const handleOpenDeactivate = () => {
    if (!selectedVehicle) return;
    setDeactivateStatus('Fuera de servicio');
    setIsDeactivateOpen(true);
  };

  const handleDeactivateConfirm = (e) => {
    e.preventDefault();
    onDeleteVehicle(selectedVehicle.vin, deactivateStatus);
    setSelectedVehicle(prev => ({ ...prev, status: deactivateStatus }));
    setIsDeactivateOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 transition-all duration-300 ${selectedVehicle ? 'w-full lg:w-2/3' : 'w-full'} space-y-4`}>
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-3">
          <ExportButtons
            onExportPDF={handleExportTablePDF}
            onExportExcel={handleExportTableExcel}
          />
          {permissions.isOperator && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Añadir Vehículo
            </button>
          )}
        </div>
        
        {initialFilter !== 'all' && (
          <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-105/50 dark:border-blue-900/20 rounded-xl text-xs text-blue-850 dark:text-blue-400">
            <div className="flex items-center gap-2">
              <span className="font-bold">Filtro aplicado:</span>
              <span className="font-semibold">
                {initialFilter === 'active' && 'Vehículos Activos'}
                {initialFilter === 'inactive' && 'Vehículos Inactivos (Sin uso / Fuera de servicio)'}
                {initialFilter === 'unassociated' && 'Vehículos Activos Sin Contrato'}
              </span>
            </div>
            <button
              onClick={onResetFilter}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
            >
              Mostrar Todos
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filteredVehicles}
          idField="vin"
          onRowClick={(row) => setSelectedVehicle(row)}
          selectedRowId={selectedVehicle?.vin}
          searchPlaceholder="Buscar por unidad, VIN, placa/tag, marca..."
        />
      </div>

      <SidePanel
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={`Unidad Vehicular: ${selectedVehicle?.unitNo}`}
      >
        {selectedVehicle && (
          <div className="space-y-5">
            {/* Operator/Admin Actions inside Panel */}
            {permissions.isOperator && (
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                >
                  <Edit size={12} />
                  Editar
                </button>
                {permissions.isAdmin && (
                  <button
                    onClick={handleOpenDeactivate}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-lg text-xs font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                  >
                    <Trash2 size={12} />
                    Desactivar
                  </button>
                )}
              </div>
            )}

            {/* Individual Export Buttons */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Exportar Ficha</span>
              <ExportButtons
                onExportPDF={handleExportVehiclePDF}
                onExportExcel={handleExportVehicleExcel}
                size="xs"
              />
            </div>

            {/* Alert if not associated */}
            {(selectedVehicle.contract === 'No encontrado' || selectedVehicle.empresa === 'No asociado') && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-305">
                <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Contrato No Asociado</span>
                  Este vehículo está físicamente registrado en las rutas de la flota pero no está mapeado a un contrato vigente.
                </div>
              </div>
            )}

            {/* Specs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Marca</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{selectedVehicle.make}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Año</span>
                </div>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">{selectedVehicle.year || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Carrocería</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-[180px]">{selectedVehicle.bodyType}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">VIN</span>
                </div>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 text-xs">{selectedVehicle.vin}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Placa / Tag</span>
                </div>
                <span className="px-1.5 py-0.5 bg-blue-105 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded text-xs font-bold font-mono">
                  {selectedVehicle.tag}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-zinc-400" />
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Estado Vehículo</span>
                </div>
                <span className="text-xs">
                  {(() => {
                    const stat = selectedVehicle.status || 'Activo';
                    const colors = {
                      'Activo': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
                      'Sin uso': 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                      'Fuera de servicio': 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    };
                    const style = colors[stat] || colors['Activo'];
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style}`}>
                        {stat}
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>

            {/* Assignments */}
            <div className="border border-zinc-150 dark:border-zinc-850 rounded-lg p-4 space-y-4">
              <h5 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">Asignaciones de Servicio</h5>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Ciudad / Destino</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{selectedVehicle.city || 'No asignada'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Landmark size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Empresa Operadora</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{selectedVehicle.empresa}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ClipboardList size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Contrato de Enlace</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs font-mono">{selectedVehicle.contract}</span>
                    {selectedVehicle.terminal && selectedVehicle.terminal !== 'N/A' && (
                      <span className="text-[10px] text-zinc-400 block font-semibold">Terminal: {selectedVehicle.terminal}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* === Registraciones / Documentos del Vehículo === */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <VehicleDocuments
                vehicle={selectedVehicle}
                permissions={permissions}
              />
            </div>

          </div>
        )}
      </SidePanel>

      {/* Add Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir Vehículo a la Flota">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Unidad (Obligatorio)</label>
              <input
                type="text"
                value={unitNo}
                onChange={e => setUnitNo(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. 13957"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Marca (Obligatorio)</label>
              <input
                type="text"
                value={make}
                onChange={e => setMake(e.target.value)}
                list="makes-list"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. FORD"
              />
              <datalist id="makes-list">
                {uniqueMakes.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Año de Modelo</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. 2022"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Carrocería</label>
              <input
                type="text"
                value={bodyType}
                onChange={e => setBodyType(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
                placeholder="Ej. STRAIGHT TRUCK"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">VIN (Obligatorio - 17 caracteres)</label>
              <input
                type="text"
                value={vin}
                onChange={e => setVin(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
                placeholder="Ingrese VIN..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Placa / Tag (Obligatorio)</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
                placeholder="Ej. KY583K"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Ciudad de Operación</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              >
                <option value="">Sin Ciudad</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Asociar Contrato</label>
              <select
                value={contract}
                onChange={e => handleFormContractChange(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              >
                <option value="No encontrado">Sin Contrato (Desvinculado)</option>
                {contratos.map(c => (
                  <option key={c.contractNumber} value={c.contractNumber}>
                    {c.contractNumber} - {c.empresa} ({c.ciudad})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Estado del Vehículo</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-955 dark:text-zinc-50"
            >
              <option value="Activo">Activo (En servicio)</option>
              <option value="Sin uso">Sin uso (Inactivo)</option>
              <option value="Fuera de servicio">Fuera de servicio (Inactivo)</option>
            </select>
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
              Añadir
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Vehículo: Unidad ${selectedVehicle?.unitNo}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Unidad (Obligatorio)</label>
              <input
                type="text"
                value={unitNo}
                onChange={e => setUnitNo(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Marca (Obligatorio)</label>
              <input
                type="text"
                value={make}
                onChange={e => setMake(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Año de Modelo</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Carrocería</label>
              <input
                type="text"
                value={bodyType}
                onChange={e => setBodyType(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">VIN (Obligatorio)</label>
              <input
                type="text"
                value={vin}
                onChange={e => setVin(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-955 dark:text-zinc-50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Placa / Tag (Obligatorio)</label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-955 dark:text-zinc-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Ciudad de Operación</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              >
                <option value="">Sin Ciudad</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Asociar Contrato</label>
              <select
                value={contract}
                onChange={e => handleFormContractChange(e.target.value)}
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 font-mono"
              >
                <option value="No encontrado">Sin Contrato (Desvinculado)</option>
                {contratos.map(c => (
                  <option key={c.contractNumber} value={c.contractNumber}>
                    {c.contractNumber} - {c.empresa} ({c.ciudad})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Estado del Vehículo</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-955 dark:text-zinc-50"
            >
              <option value="Activo">Activo (En servicio)</option>
              <option value="Sin uso">Sin uso (Inactivo)</option>
              <option value="Fuera de servicio">Fuera de servicio (Inactivo)</option>
            </select>
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

      {/* Deactivate Dialog */}
      <Dialog isOpen={isDeactivateOpen} onClose={() => setIsDeactivateOpen(false)} title={`Desactivar Vehículo: Unidad ${selectedVehicle?.unitNo}`}>
        <form onSubmit={handleDeactivateConfirm} className="space-y-4">
          <p className="text-sm text-zinc-650 dark:text-zinc-400">
            Al desactivar la unidad <strong>{selectedVehicle?.unitNo}</strong> (VIN: {selectedVehicle?.vin}), esta permanecerá en la base de datos pero su estado cambiará a inactivo.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Seleccione el nuevo estado:</label>
            <select
              value={deactivateStatus}
              onChange={e => setDeactivateStatus(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
            >
              <option value="Sin uso">Sin uso (Inactivo)</option>
              <option value="Fuera de servicio">Fuera de servicio (Inactivo)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeactivateOpen(false)}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors text-xs font-semibold shadow-sm shadow-rose-500/20 cursor-pointer"
            >
              Confirmar Desactivación
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
