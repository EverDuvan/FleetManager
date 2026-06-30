import React, { useState } from 'react';
import { Truck, ShieldAlert, Eye, EyeOff, Lock, User } from 'lucide-react';

export function AuthScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const success = onLogin(username, password);
      setLoading(false);
      if (!success) {
        setError('Credenciales inválidas. Intente nuevamente.');
      }
    }, 600);
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);
    setTimeout(() => {
      onLogin(user, pass);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* App Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Truck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-955 dark:text-zinc-50">
            FleetManager Admin
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            Inicie sesión para acceder a las operaciones de flotas, contratos y administración.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/30 rounded-lg flex items-center gap-2 text-xs text-rose-800 dark:text-rose-400">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <User size={12} />
              Usuario o Correo
            </label>
            <input
              type="text"
              placeholder="Ingrese su usuario..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Lock size={12} />
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-blue-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block text-center">
            Acceso Rápido de Demostración
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin', 'admin123')}
              disabled={loading}
              className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer text-center"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin('operator', 'operator123')}
              disabled={loading}
              className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer text-center"
            >
              Operador
            </button>
            <button
              onClick={() => handleQuickLogin('viewer', 'viewer123')}
              disabled={loading}
              className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer text-center"
            >
              Lector
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
