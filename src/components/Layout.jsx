import React from 'react';
import { ThemeToggle } from './ui/ThemeToggle';
import { Truck, Building2, FileText, MapPin, Map, BarChart3, Users, LogOut, History } from 'lucide-react';

export function Layout({ activeTab, setActiveTab, children, loading, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'admin';

  const tabs = [
    { id: 'dashboard', label: 'Resumen', icon: BarChart3 },
    { id: 'empresas', label: 'Empresas', icon: Building2 },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'ciudades', label: 'Ciudades', icon: MapPin },
    { id: 'terminales', label: 'Terminales', icon: Map },
    { id: 'vehiculos', label: 'Vehículos', icon: Truck },
    { id: 'historial', label: 'Historial', icon: History },
  ];

  if (isAdmin) {
    tabs.push({ id: 'usuarios', label: 'Usuarios', icon: Users });
  }

  const roleLabels = {
    admin: 'Admin',
    operator: 'Operador',
    viewer: 'Lector'
  };

  const roleColors = {
    admin: 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400',
    operator: 'bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
    viewer: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0c0c0f]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
              <Truck size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                FleetManager
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Panel de Control de Flotas y Contratos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                Cargando...
              </div>
            )}
            
            {/* User Session Profile Box */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate max-w-[100px]">
                    {currentUser.username}
                  </span>
                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${roleColors[currentUser.role]}`}>
                    {roleLabels[currentUser.role]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            
            <ThemeToggle />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-8 py-6 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        © {new Date().getFullYear()} FleetManager Admin. Todos los derechos reservados. Desarrollado con React + Vite.
      </footer>
    </div>
  );
}
