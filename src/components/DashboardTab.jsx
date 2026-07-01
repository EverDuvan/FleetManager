import React, { useMemo } from 'react';
import { 
  Truck, 
  Building2, 
  FileText, 
  MapPin, 
  Map, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

export function DashboardTab({ data, onNavigate }) {
  const { vehicles, empresas, contratos, ciudades, terminales } = data;

  // Process data for charts
  
  // 1. Vehicle Make Distribution
  const makeData = useMemo(() => {
    const counts = {};
    vehicles.forEach(v => {
      const make = v.make || 'Desconocido';
      counts[make] = (counts[make] || 0) + 1;
    });
    return Object.keys(counts)
      .map(make => ({ name: make, cantidad: counts[make] }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [vehicles]);

  // 2. Vehicle Year Distribution
  const yearData = useMemo(() => {
    const counts = {};
    vehicles.forEach(v => {
      if (v.year) {
        counts[v.year] = (counts[v.year] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map(year => ({ year: parseInt(year, 10), cantidad: counts[year] }))
      .sort((a, b) => a.year - b.year);
  }, [vehicles]);

  // 3. Body Type Distribution
  const bodyTypeData = useMemo(() => {
    const counts = {};
    vehicles.forEach(v => {
      const type = v.bodyType || 'Desconocido';
      if (type && type !== 'N/A') {
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map(type => ({ name: type, cantidad: counts[type] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8); // Top 8 body types
  }, [vehicles]);

  // 4. Planned vs Actual per Terminal
  const terminalComparisonData = useMemo(() => {
    return terminales.map(t => ({
      name: t.ciudad !== 'Sin Ciudad' ? `${t.terminal} (${t.ciudad})` : `T-${t.terminal}`,
      Planificado: t.planned,
      Real: t.actual
    })).sort((a, b) => b.Planificado - a.Planificado);
  }, [terminales]);

  // Vehicle Association & Operational Status
  const activeCount = useMemo(() => {
    return vehicles.filter(v => !v.status || v.status === 'Activo').length;
  }, [vehicles]);

  const inactiveCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'Sin uso' || v.status === 'Fuera de servicio').length;
  }, [vehicles]);

  const sinUsoCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'Sin uso').length;
  }, [vehicles]);

  const fueraServicioCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'Fuera de servicio').length;
  }, [vehicles]);

  const associatedCount = useMemo(() => {
    return vehicles.filter(v => (!v.status || v.status === 'Activo') && v.contract !== 'No encontrado' && v.empresa !== 'No asociado').length;
  }, [vehicles]);

  const unassociatedCount = useMemo(() => {
    return vehicles.filter(v => (!v.status || v.status === 'Activo') && (v.contract === 'No encontrado' || v.empresa === 'No asociado')).length;
  }, [vehicles]);

  // Recharts color palette
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg shadow-md text-xs">
          <p className="font-semibold text-zinc-950 dark:text-zinc-50 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.fill || entry.stroke || '#3b82f6' }} className="font-semibold">
              {entry.name}: <span className="font-mono">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehículos"
          value={vehicles.length}
          icon={Truck}
          description="Suma total de vehículos registrados"
          trend={`${activeCount} activos / ${inactiveCount} inactivos`}
          trendType="neutral"
          onClick={() => onNavigate?.('vehiculos', 'all')}
        />
        <StatCard
          title="Vehículos Activos"
          value={activeCount}
          icon={CheckCircle2}
          description="Unidades operativas en servicio"
          trend={`${associatedCount} vinculados a contrato`}
          trendType="positive"
          onClick={() => onNavigate?.('vehiculos', 'active')}
        />
        <StatCard
          title="Vehículos Inactivos"
          value={inactiveCount}
          icon={ShieldAlert}
          description="Fuera de servicio / Sin uso"
          trend={`${sinUsoCount} sin uso / ${fueraServicioCount} f. de servicio`}
          trendType="negative"
          onClick={() => onNavigate?.('vehiculos', 'inactive')}
        />
        <StatCard
          title="Activos Sin Contrato"
          value={unassociatedCount}
          icon={AlertTriangle}
          description="Unidades activas no vinculadas"
          trend="Requieren vinculación"
          trendType="neutral"
          onClick={() => onNavigate?.('vehiculos', 'unassociated')}
        />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Empresas Registradas"
          value={empresas.length}
          icon={Building2}
          description="Entidades transportistas"
          onClick={() => onNavigate?.('empresas')}
        />
        <StatCard
          title="Contratos Totales"
          value={contratos.length}
          icon={FileText}
          description="Contratos de anexo B"
          onClick={() => onNavigate?.('contratos')}
        />
        <StatCard
          title="Terminales Operativas"
          value={terminales.length}
          icon={Map}
          description="Puntos de distribución"
          onClick={() => onNavigate?.('terminales')}
        />
        <StatCard
          title="Ciudades de Operación"
          value={ciudades.length}
          icon={MapPin}
          description="Cobertura de red logística"
          onClick={() => onNavigate?.('ciudades')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Terminal Comparison: Planned vs Actual */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Capacidad por Terminal (Planificado vs Real)</CardTitle>
            <span className="text-xs text-zinc-500">Muestra la cantidad esperada según contrato versus los vehículos físicos asignados</span>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminalComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800/50" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    stroke="#71717a"
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    stroke="#71717a"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Planificado" fill="#3b82f6" name="Esperado (Contrato)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Real" fill="#10b981" name="Físico Real" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Makes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Fabricante (Marca)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={makeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="cantidad"
                  >
                    {makeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 space-y-2">
              {makeData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                  </div>
                  <span className="font-mono text-zinc-500">{item.cantidad} ({((item.cantidad / vehicles.length) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Year Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Flota por Año de Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800/50" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    stroke="#71717a"
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    stroke="#71717a"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cantidad" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQuantity)" name="Vehículos" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Body Type Distribution */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 8 Tipos de Carrocería</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bodyTypeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800/50" />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} stroke="#71717a" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#71717a', fontSize: 10 }} stroke="#71717a" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#8b5cf6" name="Vehículos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
