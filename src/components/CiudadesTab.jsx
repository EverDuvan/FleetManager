import React, { useState } from 'react';
import { DataTable } from './ui/DataTable';
import { SidePanel } from './ui/SidePanel';
import { Dialog } from './ui/Dialog';
import { Truck, Map, FileText, Edit, Trash2 } from 'lucide-react';

export function CiudadesTab({ data, permissions, onUpdateCity, onDeleteCity }) {
  const { ciudades, contratos, vehicles } = data;
  const [selectedCity, setSelectedCity] = useState(null);
  
  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const [error, setError] = useState('');

  const columns = [
    { key: 'name', label: 'Ciudad', sortable: true, filterable: false },
    { key: 'terminalsCount', label: 'Terminales', sortable: true, filterable: false, cellClassName: 'text-center' },
    { key: 'contractsCount', label: 'Contratos', sortable: true, filterable: false, cellClassName: 'text-center' },
    { key: 'companiesCount', label: 'Empresas', sortable: true, filterable: false, cellClassName: 'text-center' },
    { key: 'plannedVehicles', label: 'Esperados (Contratos)', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    { key: 'actualVehicles', label: 'Físicos Reales', sortable: true, filterable: false, cellClassName: 'text-center font-mono' },
    {
      key: 'cumplimiento',
      label: 'Diferencia',
      sortable: true,
      filterable: false,
      render: (_, row) => {
        const diff = row.actualVehicles - row.plannedVehicles;
        if (diff === 0) {
          return <span className="text-emerald-500 font-semibold">Equilibrado</span>;
        } else if (diff < 0) {
          return <span className="text-amber-500 font-semibold">{diff} veh.</span>;
        } else {
          return <span className="text-blue-500 font-semibold">+{diff} veh.</span>;
        }
      }
    }
  ];

  const handleOpenEdit = () => {
    if (!selectedCity) return;
    setCityName(selectedCity.name);
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!cityName.trim()) {
      setError('El nombre de la ciudad no puede estar vacío.');
      return;
    }
    
    // Check if new name exists
    if (cityName.trim().toLowerCase() !== selectedCity.name.toLowerCase() &&
        ciudades.some(c => c.name.toLowerCase() === cityName.trim().toLowerCase())) {
      setError('Ese nombre de ciudad ya existe.');
      return;
    }

    onUpdateCity(selectedCity.name, cityName.trim());
    setSelectedCity(prev => ({ ...prev, name: cityName.trim() }));
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedCity) return;
    if (window.confirm(`¿Está seguro de que desea eliminar la ciudad "${selectedCity.name}"?\nEsto cambiará a "Sin Ciudad" todas las asignaciones en contratos y vehículos asociados.`)) {
      onDeleteCity(selectedCity.name);
      setSelectedCity(null);
    }
  };

  // Contracts and vehicles in selected city
  const cityContracts = selectedCity
    ? contratos.filter(c => c.ciudad.toLowerCase() === selectedCity.name.toLowerCase())
    : [];

  const cityVehicles = selectedCity
    ? vehicles.filter(v => v.city.toLowerCase() === selectedCity.name.toLowerCase())
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 transition-all duration-300 ${selectedCity ? 'w-full lg:w-2/3' : 'w-full'}`}>
        <DataTable
          columns={columns}
          data={ciudades}
          idField="name"
          onRowClick={(row) => setSelectedCity(row)}
          selectedRowId={selectedCity?.name}
          searchPlaceholder="Buscar por ciudad..."
        />
      </div>

      <SidePanel
        isOpen={!!selectedCity}
        onClose={() => setSelectedCity(null)}
        title={`Ciudad: ${selectedCity?.name}`}
      >
        {selectedCity && (
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-655 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-lg text-xs font-semibold cursor-pointer flex-1 justify-center transition-colors shadow-sm"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                )}
              </div>
            )}

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Terminales</span>
                <p className="text-sm font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCity.terminalsCount}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{selectedCity.terminalsList}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Empresas</span>
                <p className="text-sm font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCity.companiesCount}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Planificados</span>
                <p className="text-sm font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCity.plannedVehicles}</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Físicos Reales</span>
                <p className="text-sm font-mono font-bold mt-1 text-zinc-900 dark:text-zinc-50">{selectedCity.actualVehicles}</p>
              </div>
            </div>

            {/* List of Contracts in City */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <FileText size={14} />
                Contratos Asociados ({cityContracts.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                {cityContracts.length > 0 ? (
                  cityContracts.map(c => (
                    <div key={c.contractNumber} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{c.contractNumber}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 block truncate max-w-[180px]">{c.empresa}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{c.actualCount} / {c.cantidad}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Terminal {c.terminal}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-400 dark:text-zinc-650 text-xs">
                    Ningún contrato registrado en esta ciudad.
                  </div>
                )}
              </div>
            </div>

            {/* List of Vehicles in City */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Truck size={14} />
                Vehículos en esta Ciudad ({cityVehicles.length})
              </h4>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 max-h-52 overflow-y-auto">
                {cityVehicles.length > 0 ? (
                  cityVehicles.map(v => (
                    <div key={v.vin} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Unidad {v.unitNo}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">{v.make} - {v.bodyType}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-mono">
                          {v.tag}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-mono mt-0.5">{v.contract}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-400 dark:text-zinc-650 text-xs">
                    Ningún vehículo físico registrado en esta ciudad.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Edit Name Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Nombre Ciudad: ${selectedCity?.name}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">Nombre de la Ciudad</label>
            <input
              type="text"
              value={cityName}
              onChange={e => setCityName(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              placeholder="Ej. Miami Turnberry"
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
