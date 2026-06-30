import React, { useState } from 'react';
import { DataTable } from './ui/DataTable';
import { Dialog } from './ui/Dialog';
import { User, Shield, Key, Plus, Edit, Trash2 } from 'lucide-react';

export function UsuariosTab({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');

  const rolesTranslations = {
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Lector'
  };

  const columns = [
    { key: 'username', label: 'Usuario', sortable: true, filterable: false, cellClassName: 'font-semibold' },
    {
      key: 'role',
      label: 'Rol',
      sortable: true,
      filterable: true,
      render: (val) => {
        let badgeColor = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
        if (val === 'admin') badgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400';
        else if (val === 'operator') badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
        
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
            {rolesTranslations[val] || val}
          </span>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      filterable: false,
      cellClassName: 'text-center',
      render: (_, row) => {
        const isSelf = row.username === currentUser.username;
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(row.username)}
              disabled={isSelf}
              className={`p-1 rounded-md transition-colors ${
                isSelf 
                  ? 'text-zinc-300 dark:text-zinc-750 cursor-not-allowed' 
                  : 'text-zinc-400 hover:text-red-650 dark:hover:text-red-400 cursor-pointer hover:bg-zinc-150 dark:hover:bg-zinc-800'
              }`}
              title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      }
    }
  ];

  const handleOpenAdd = () => {
    setUsername('');
    setPassword('');
    setRole('viewer');
    setError('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor complete todos los campos.');
      return;
    }
    
    // Check if user already exists
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('El nombre de usuario ya existe.');
      return;
    }

    onAddUser({
      username: username.trim(),
      password: password.trim(),
      role
    });
    setIsAddOpen(false);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor complete todos los campos.');
      return;
    }

    // Check if name changed and exists
    if (username.trim().toLowerCase() !== selectedUser.username.toLowerCase() &&
        users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('El nombre de usuario ya existe.');
      return;
    }

    onUpdateUser(selectedUser.username, {
      username: username.trim(),
      password: password.trim(),
      role
    });
    setIsEditOpen(false);
  };

  const handleDeleteClick = (userToDelete) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al usuario "${userToDelete}"?`)) {
      onDeleteUser(userToDelete);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Administración de Usuarios</h2>
          <p className="text-xs text-zinc-500">Gestione los accesos y los roles asignados a la plataforma</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Nuevo Usuario
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        idField="username"
        searchPlaceholder="Buscar usuario..."
      />

      {/* Add Dialog */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Crear Nuevo Usuario">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><User size={12}/>Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              placeholder="Ej. juan.perez"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><Key size={12}/>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
              placeholder="Contraseña"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><Shield size={12}/>Rol / Privilegios</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
            >
              <option value="viewer">Lector (Solo Lectura)</option>
              <option value="operator">Operador (Añadir/Editar)</option>
              <option value="admin">Administrador (Control Total)</option>
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
              Crear Usuario
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar Usuario: ${selectedUser?.username}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><User size={12}/>Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><Key size={12}/>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5"><Shield size={12}/>Rol / Privilegios</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={selectedUser?.username === currentUser.username}
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="viewer">Lector (Solo Lectura)</option>
              <option value="operator">Operador (Añadir/Editar)</option>
              <option value="admin">Administrador (Control Total)</option>
            </select>
            {selectedUser?.username === currentUser.username && (
              <span className="text-[10px] text-zinc-400 block mt-1">No puedes cambiar tu propio rol.</span>
            )}
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
