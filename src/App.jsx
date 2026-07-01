import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { DashboardTab } from './components/DashboardTab';
import { EmpresasTab } from './components/EmpresasTab';
import { ContratosTab } from './components/ContratosTab';
import { CiudadesTab } from './components/CiudadesTab';
import { TerminalesTab } from './components/TerminalesTab';
import { VehiculosTab } from './components/VehiculosTab';
import { UsuariosTab } from './components/UsuariosTab';
import { AuthScreen } from './components/AuthScreen';
import { HistorialTab } from './components/HistorialTab';
import { parseConsolidadoCSV, deriveAggregates } from './utils/dataParser';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'operator', password: 'operator123', role: 'operator' },
  { username: 'viewer', password: 'viewer123', role: 'viewer' }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all', 'active', 'inactive', 'unassociated'
  
  // Auth Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fleet_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('fleet_users');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('fleet_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  // Raw Database States (stored in localStorage)
  const [contractsRaw, setContractsRaw] = useState([]);
  const [vehiclesRaw, setVehiclesRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Movements Audit History State
  const [movements, setMovements] = useState(() => {
    const saved = localStorage.getItem('fleet_movements');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Initial Data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const savedContracts = localStorage.getItem('fleet_contracts');
        const savedVehicles = localStorage.getItem('fleet_vehicles');

        if (savedContracts && savedVehicles) {
          setContractsRaw(JSON.parse(savedContracts));
          setVehiclesRaw(JSON.parse(savedVehicles));
        } else {
          // Fetch and parse the CSV
          const response = await fetch('/data/schB - Consolidado.csv');
          if (!response.ok) {
            throw new Error(`Error al cargar el CSV (${response.status}: ${response.statusText})`);
          }
          const csvText = await response.text();
          const parsed = parseConsolidadoCSV(csvText);
          
          setContractsRaw(parsed.contractsRaw);
          setVehiclesRaw(parsed.vehiclesRaw);
          
          localStorage.setItem('fleet_contracts', JSON.stringify(parsed.contractsRaw));
          localStorage.setItem('fleet_vehicles', JSON.stringify(parsed.vehiclesRaw));
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Error al cargar los datos iniciales.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Compute aggregate state dynamically based on raw arrays
  const data = useMemo(() => {
    if (contractsRaw.length === 0 && vehiclesRaw.length === 0) {
      return {
        contractsRaw: [],
        vehiclesRaw: [],
        empresas: [],
        contratos: [],
        ciudades: [],
        terminales: [],
        vehicles: []
      };
    }
    const derived = deriveAggregates(contractsRaw, vehiclesRaw);
    return {
      contractsRaw,
      vehiclesRaw,
      ...derived
    };
  }, [contractsRaw, vehiclesRaw]);

  // Auth Operations
  const handleLogin = (username, password) => {
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('fleet_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fleet_session');
    setActiveTab('dashboard');
  };

  // State Persistence Helper
  const persistState = (newContracts, newVehicles) => {
    setContractsRaw(newContracts);
    setVehiclesRaw(newVehicles);
    localStorage.setItem('fleet_contracts', JSON.stringify(newContracts));
    localStorage.setItem('fleet_vehicles', JSON.stringify(newVehicles));
  };

  // Movements logger helper
  const logMovement = (action, entityType, entityId, description, changes = null) => {
    const newMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.username || 'Sistema',
      action,
      entityType,
      entityId,
      description,
      changes
    };
    setMovements(prev => {
      const updated = [newMovement, ...prev];
      localStorage.setItem('fleet_movements', JSON.stringify(updated));
      return updated;
    });
  };

  // CRUD Operations - VEHICLES
  const addVehicle = (vehicle) => {
    const updated = [vehicle, ...vehiclesRaw];
    persistState(contractsRaw, updated);
    logMovement(
      'Añadir Vehículo',
      'Vehículo',
      vehicle.vin,
      `Vehículo Unidad ${vehicle.unitNo} (${vehicle.make}) añadido con estado "Activo".`
    );
  };

  const updateVehicle = (vin, newVehicle) => {
    const oldVehicle = vehiclesRaw.find(v => v.vin === vin);
    const updated = vehiclesRaw.map(v => v.vin === vin ? { ...v, ...newVehicle } : v);
    persistState(contractsRaw, updated);
    if (oldVehicle) {
      const changes = [];
      const keys = ['unitNo', 'make', 'year', 'bodyType', 'tag', 'city', 'contract', 'status'];
      keys.forEach(k => {
        if (oldVehicle[k] !== newVehicle[k]) {
          changes.push(`${k}: de "${oldVehicle[k] || 'N/A'}" a "${newVehicle[k] || 'N/A'}"`);
        }
      });
      const changesStr = changes.length > 0 ? ` (Cambios: ${changes.join(', ')})` : '';
      logMovement(
        'Editar Vehículo',
        'Vehículo',
        vin,
        `Vehículo Unidad ${newVehicle.unitNo} actualizado.${changesStr}`
      );
    }
  };

  const deleteVehicle = (vin, newStatus = 'Fuera de servicio') => {
    const target = vehiclesRaw.find(v => v.vin === vin);
    const updated = vehiclesRaw.map(v => v.vin === vin ? { ...v, status: newStatus } : v);
    persistState(contractsRaw, updated);
    if (target) {
      logMovement(
        'Desactivar Vehículo',
        'Vehículo',
        vin,
        `Vehículo Unidad ${target.unitNo} (${target.make}) cambiado a estado "${newStatus}".`
      );
    }
  };

  // CRUD Operations - CONTRACTS
  const addContract = (contract) => {
    const updated = [...contractsRaw, contract];
    persistState(updated, vehiclesRaw);
    logMovement(
      'Añadir Contrato',
      'Contrato',
      contract.contractNumber,
      `Contrato ${contract.contractNumber} asignado a ${contract.empresa} en ${contract.ciudad} con capacidad de ${contract.cantidad} unidades.`
    );
  };

  const updateContract = (contractNumber, newContract) => {
    const oldContract = contractsRaw.find(c => c.contractNumber === contractNumber);
    // Cascading update: if contract number changes, update vehicles referencing it
    const updatedContracts = contractsRaw.map(c => 
      c.contractNumber === contractNumber ? { ...c, ...newContract } : c
    );
    
    let updatedVehicles = [...vehiclesRaw];
    if (newContract.contractNumber && newContract.contractNumber !== contractNumber) {
      updatedVehicles = vehiclesRaw.map(v => 
        v.contract === contractNumber ? { ...v, contract: newContract.contractNumber } : v
      );
    }
    
    persistState(updatedContracts, updatedVehicles);
    if (oldContract) {
      const changes = [];
      const keys = ['contractNumber', 'empresa', 'entityId', 'terminal', 'ciudad', 'cantidad'];
      keys.forEach(k => {
        if (oldContract[k] !== newContract[k]) {
          changes.push(`${k}: de "${oldContract[k] || 'N/A'}" a "${newContract[k] || 'N/A'}"`);
        }
      });
      const changesStr = changes.length > 0 ? ` (Cambios: ${changes.join(', ')})` : '';
      logMovement(
        'Editar Contrato',
        'Contrato',
        contractNumber,
        `Contrato ${contractNumber} actualizado.${changesStr}`
      );
    }
  };

  const deleteContract = (contractNumber) => {
    const oldContract = contractsRaw.find(c => c.contractNumber === contractNumber);
    const updatedContracts = contractsRaw.filter(c => c.contractNumber !== contractNumber);
    // Unlink deleted contract from vehicles
    const updatedVehicles = vehiclesRaw.map(v => 
      v.contract === contractNumber 
        ? { ...v, contract: 'No encontrado', entityId: 'No encontrado', empresa: 'No asociado', terminal: 'N/A' } 
        : v
    );
    persistState(updatedContracts, updatedVehicles);
    if (oldContract) {
      logMovement(
        'Eliminar Contrato',
        'Contrato',
        contractNumber,
        `Contrato ${contractNumber} eliminado de la base de datos.`
      );
    }
  };

  // CRUD Operations - COMPANIES (Cascading)
  const updateCompany = (entityId, newName) => {
    const oldCompany = contractsRaw.find(c => c.entityId === entityId)?.empresa || entityId;
    const updatedContracts = contractsRaw.map(c => 
      c.entityId === entityId ? { ...c, empresa: newName } : c
    );
    persistState(updatedContracts, vehiclesRaw);
    logMovement(
      'Editar Empresa',
      'Empresa',
      entityId,
      `Empresa "${oldCompany}" (ID: ${entityId}) renombrada a "${newName}".`
    );
  };

  const deleteCompany = (entityId) => {
    const oldCompany = contractsRaw.find(c => c.entityId === entityId)?.empresa || entityId;
    // Delete all contracts associated with this company
    const updatedContracts = contractsRaw.filter(c => c.entityId !== entityId);
    
    // Clear vehicle association for deleted company
    const updatedVehicles = vehiclesRaw.map(v => 
      v.entityId === entityId 
        ? { ...v, contract: 'No encontrado', entityId: 'No encontrado', empresa: 'No asociado', terminal: 'N/A' }
        : v
    );
    persistState(updatedContracts, updatedVehicles);
    logMovement(
      'Eliminar Empresa',
      'Empresa',
      entityId,
      `Empresa "${oldCompany}" (ID: ${entityId}) eliminada junto con sus contratos asociados.`
    );
  };

  // CRUD Operations - CITIES (Cascading)
  const updateCity = (oldName, newName) => {
    const updatedContracts = contractsRaw.map(c => 
      c.ciudad.toLowerCase() === oldName.toLowerCase() ? { ...c, ciudad: newName } : c
    );
    const updatedVehicles = vehiclesRaw.map(v => 
      v.city.toLowerCase() === oldName.toLowerCase() ? { ...v, city: newName } : v
    );
    persistState(updatedContracts, updatedVehicles);
    logMovement(
      'Editar Ciudad',
      'Ciudad',
      oldName,
      `Ciudad "${oldName}" renombrada a "${newName}".`
    );
  };

  const deleteCity = (cityName) => {
    const updatedContracts = contractsRaw.map(c => 
      c.ciudad.toLowerCase() === cityName.toLowerCase() ? { ...c, ciudad: 'Sin Ciudad' } : c
    );
    const updatedVehicles = vehiclesRaw.map(v => 
      v.city.toLowerCase() === cityName.toLowerCase() ? { ...v, city: 'Sin Ciudad' } : v
    );
    persistState(updatedContracts, updatedVehicles);
    logMovement(
      'Eliminar Ciudad',
      'Ciudad',
      cityName,
      `Ciudad "${cityName}" eliminada del sistema. Contratos y vehículos asociados fueron marcados como 'Sin Ciudad'.`
    );
  };

  // CRUD Operations - TERMINALS (Cascading)
  const updateTerminal = (oldCode, newCode, cityName) => {
    const updatedContracts = contractsRaw.map(c => 
      (c.terminal === oldCode && c.ciudad.toLowerCase() === cityName.toLowerCase())
        ? { ...c, terminal: newCode } 
        : c
    );
    const updatedVehicles = vehiclesRaw.map(v => 
      (v.terminal === oldCode && v.city.toLowerCase() === cityName.toLowerCase())
        ? { ...v, terminal: newCode } 
        : v
    );
    persistState(updatedContracts, updatedVehicles);
    logMovement(
      'Editar Terminal',
      'Terminal',
      oldCode,
      `Terminal "${oldCode}" en "${cityName}" renombrada a "${newCode}".`
    );
  };

  const deleteTerminal = (terminalCode, cityName) => {
    // Delete all contracts linking this terminal
    const updatedContracts = contractsRaw.filter(c => 
      !(c.terminal === terminalCode && c.ciudad.toLowerCase() === cityName.toLowerCase())
    );
    // Unlink vehicle terminal code
    const updatedVehicles = vehiclesRaw.map(v => 
      (v.terminal === terminalCode && v.city.toLowerCase() === cityName.toLowerCase())
        ? { ...v, terminal: 'N/A' } 
        : v
    );
    persistState(updatedContracts, updatedVehicles);
    logMovement(
      'Eliminar Terminal',
      'Terminal',
      terminalCode,
      `Terminal "${terminalCode}" en "${cityName}" eliminada del sistema.`
    );
  };

  // CRUD Operations - USERS
  const addUser = (newUser) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('fleet_users', JSON.stringify(updated));
  };

  const updateUser = (oldUsername, updatedUser) => {
    const updated = users.map(u => u.username === oldUsername ? { ...u, ...updatedUser } : u);
    setUsers(updated);
    localStorage.setItem('fleet_users', JSON.stringify(updated));
    // If the logged in user updated themselves, refresh current user state
    if (currentUser && currentUser.username === oldUsername) {
      const refreshed = { ...currentUser, ...updatedUser };
      setCurrentUser(refreshed);
      localStorage.setItem('fleet_session', JSON.stringify(refreshed));
    }
  };

  const deleteUser = (usernameToDelete) => {
    const updated = users.filter(u => u.username !== usernameToDelete);
    setUsers(updated);
    localStorage.setItem('fleet_users', JSON.stringify(updated));
  };

  const renderTabContent = () => {
    if (!data) return null;

    const permissions = {
      isAdmin: currentUser?.role === 'admin',
      isOperator: currentUser?.role === 'admin' || currentUser?.role === 'operator',
      isViewer: currentUser?.role === 'viewer'
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab 
            data={data} 
            onNavigate={(tab, filter = 'all') => {
              setVehicleFilter(filter);
              setActiveTab(tab);
            }} 
          />
        );
      case 'empresas':
        return (
          <EmpresasTab 
            data={data} 
            permissions={permissions}
            onUpdateCompany={updateCompany}
            onDeleteCompany={deleteCompany}
          />
        );
      case 'contratos':
        return (
          <ContratosTab 
            data={data} 
            permissions={permissions}
            onAddContract={addContract}
            onUpdateContract={updateContract}
            onDeleteContract={deleteContract}
          />
        );
      case 'ciudades':
        return (
          <CiudadesTab 
            data={data} 
            permissions={permissions}
            onUpdateCity={updateCity}
            onDeleteCity={deleteCity}
          />
        );
      case 'terminales':
        return (
          <TerminalesTab 
            data={data} 
            permissions={permissions}
            onUpdateTerminal={updateTerminal}
            onDeleteTerminal={deleteTerminal}
          />
        );
      case 'vehiculos':
        return (
          <VehiculosTab 
            data={data} 
            permissions={permissions}
            onAddVehicle={addVehicle}
            onUpdateVehicle={updateVehicle}
            onDeleteVehicle={deleteVehicle}
            initialFilter={vehicleFilter}
            onResetFilter={() => setVehicleFilter('all')}
          />
        );
      case 'historial':
        return (
          <HistorialTab
            movements={movements}
            permissions={permissions}
            onClearHistory={() => {
              if (window.confirm('¿Está seguro de que desea vaciar todo el historial de auditoría? Esta acción no se puede deshacer.')) {
                setMovements([]);
                localStorage.setItem('fleet_movements', JSON.stringify([]));
                setTimeout(() => {
                  logMovement('Vaciar Historial', 'Historial', 'N/A', 'El historial de auditoría fue limpiado por el usuario.');
                }, 100);
              }
            }}
          />
        );
      case 'usuarios':
        if (currentUser?.role !== 'admin') return <DashboardTab data={data} />;
        return (
          <UsuariosTab 
            users={users}
            currentUser={currentUser}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
      default:
        return <DashboardTab data={data} />;
    }
  };

  // If loading raw files on boot
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Iniciando FleetManager</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm">
          Cargando registros logísticos y configuraciones operativas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-rose-100 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-full mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Error al Cargar Datos</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow shadow-blue-500/20 cursor-pointer"
        >
          <RefreshCw size={14} />
          Recargar Página
        </button>
      </div>
    );
  }

  // Auth Guard
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      loading={loading}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderTabContent()}
    </Layout>
  );
}

export default App;
