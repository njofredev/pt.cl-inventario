'use client'

import { useState, useTransition } from "react";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";
import { UserCog, ShieldCheck, User, UserPlus, Pencil, Trash2, X, Save, Building2, Warehouse } from "lucide-react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface Bodega {
  id: string;
  nombre: string;
  sucursalId: string;
  sucursal: {
    nombre: string;
  };
}

interface DbUser {
  id: string;
  username: string;
  nombre: string;
  role: string;
  createdAt: Date;
  sucursales: Sucursal[];
  bodegas: Bodega[];
}

interface UserManagementClientProps {
  initialUsers: DbUser[];
  sucursales: Sucursal[];
  bodegas: Bodega[];
}

export default function UserManagementClient({ initialUsers, sucursales, bodegas }: UserManagementClientProps) {
  const [users, setUsers] = useState<DbUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [role, setRole] = useState("USER");
  const [selectedSucursales, setSelectedSucursales] = useState<string[]>([]);
  const [selectedBodegas, setSelectedBodegas] = useState<string[]>([]);

  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset form helper
  const resetForm = () => {
    setUsername("");
    setPassword("");
    setNombre("");
    setRole("USER");
    setSelectedSucursales([]);
    setSelectedBodegas([]);
    setEditingUser(null);
    setStatus(null);
  };

  // Populate form for editing
  const startEdit = (user: DbUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setNombre(user.nombre);
    setRole(user.role);
    setSelectedSucursales(user.sucursales.map(s => s.id));
    setSelectedBodegas(user.bodegas.map(b => b.id));
    setPassword(""); // Leave blank, only fill if they want to change it
    setStatus(null);
  };

  // Handle Checkbox Toggles
  const toggleSucursal = (id: string) => {
    setSelectedSucursales(prev => {
      const exists = prev.includes(id);
      if (exists) {
        // If unchecking a sucursal, also uncheck all its bodegas
        const bodegasOfSucursal = bodegas.filter(b => b.sucursalId === id).map(b => b.id);
        setSelectedBodegas(bPrev => bPrev.filter(bId => !bodegasOfSucursal.includes(bId)));
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleBodega = (id: string, sucursalId: string) => {
    setSelectedBodegas(prev => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter(item => item !== id);
      } else {
        // If checking a bodega, ensure its parent sucursal is also checked
        setSelectedSucursales(sPrev => {
          if (!sPrev.includes(sucursalId)) {
            return [...sPrev, sucursalId];
          }
          return sPrev;
        });
        return [...prev, id];
      }
    });
  };

  // Handle Create or Update Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username || !nombre || !role) {
      setStatus({ success: false, message: "Nombre, usuario y rol son obligatorios." });
      return;
    }

    if (!editingUser && !password) {
      setStatus({ success: false, message: "La contraseña es obligatoria para nuevos usuarios." });
      return;
    }

    setStatus(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("nombre", nombre);
      formData.append("role", role);
      formData.append("sucursalesIds", JSON.stringify(selectedSucursales));
      formData.append("bodegasIds", JSON.stringify(selectedBodegas));

      if (editingUser) {
        // Edit Action
        const res = await updateUserAction(editingUser.id, formData);
        if (res.success) {
          setStatus({ success: true, message: "Usuario actualizado exitosamente." });
          // Update local state dynamically
          setUsers(prev =>
            prev.map(u => (u.id === editingUser.id ? { 
              ...u, 
              username, 
              nombre, 
              role,
              sucursales: sucursales.filter(s => selectedSucursales.includes(s.id)),
              bodegas: bodegas.filter(b => selectedBodegas.includes(b.id))
            } : u))
          );
          resetForm();
        } else {
          setStatus({ success: false, message: res.error });
        }
      } else {
        // Create Action
        const res = await createUserAction(formData);
        if (res.success) {
          setStatus({ success: true, message: "Usuario creado exitosamente." });
          resetForm();
          window.location.reload();
        } else {
          setStatus({ success: false, message: res.error });
        }
      }
    });
  }

  // Handle Delete Action
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?`)) {
      return;
    }

    setStatus(null);
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) {
        setStatus({ success: true, message: `Usuario "${userName}" eliminado correctamente.` });
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (editingUser?.id === userId) {
          resetForm();
        }
      } else {
        setStatus({ success: false, message: res.error });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Creation/Edition Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit space-y-4 transition-all duration-300">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
          </span>
          {editingUser && (
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cancelar edición"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. F. Urbina..."
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. furbina..."
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Contraseña</label>
              {editingUser && (
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 normal-case">
                  (Dejar en blanco para no cambiar)
                </span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingUser ? "Nueva contraseña..." : "Ingresar contraseña..."}
              required={!editingUser}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rol / Permisos</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="USER" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Auxiliar (Lectura y Movimientos)</option>
              <option value="ADMIN" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Administrador (Control total y Usuarios)</option>
              <option value="CONTABLE" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Contable (Lectura y Reportes)</option>
            </select>
          </div>

          {/* Permisos de Sucursal */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Sucursales Permitidas
            </label>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {sucursales.map(suc => (
                <label key={suc.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedSucursales.includes(suc.id)}
                    onChange={() => toggleSucursal(suc.id)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span>{suc.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Permisos de Bodegas (Agrupadas por Sucursal) */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Bodegas Permitidas
            </label>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {sucursales.map(suc => {
                const bodegasInSuc = bodegas.filter(b => b.sucursalId === suc.id);
                if (bodegasInSuc.length === 0) return null;

                return (
                  <div key={suc.id} className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-1">
                      {suc.nombre}
                    </p>
                    <div className="space-y-1.5 pl-1 pt-1">
                      {bodegasInSuc.map(bod => (
                        <label key={bod.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedBodegas.includes(bod.id)}
                            onChange={() => toggleBodega(bod.id, suc.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                          />
                          <span>{bod.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Feedback */}
          {status && (
            <div className={`p-3 rounded-xl text-xs font-semibold border ${
              status.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {status.message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                className="w-1/3 py-2.5 text-xs font-extrabold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all active-scale-down cursor-pointer flex items-center justify-center gap-1"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className={`py-2.5 text-xs font-extrabold text-white bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 rounded-xl transition-all active-scale-down shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                editingUser ? "w-2/3" : "w-full"
              }`}
            >
              {editingUser ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isPending 
                ? (editingUser ? "Guardando..." : "Creando...") 
                : (editingUser ? "Guardar Cambios" : "Crear Usuario")
              }
            </button>
          </div>
        </form>
      </div>

      {/* User List Table Card */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
          Usuarios Registrados
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-3 pl-5">Nombre</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Asignaciones</th>
                <th className="p-3">Fecha Registro</th>
                <th className="p-3 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${editingUser?.id === user.id ? 'bg-teal-500/5 dark:bg-teal-500/10' : ''}`}>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-100 pl-5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {user.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{user.nombre}</span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-mono font-medium">{user.username}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {user.role === 'ADMIN' ? (
                        <>
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" /> Auxiliar
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3 space-y-1 max-w-[200px]">
                    {user.sucursales.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.sucursales.map(s => (
                          <span key={s.id} className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-0.5" title="Sucursal asignada">
                            <Building2 className="h-2.5 w-2.5 shrink-0" />
                            {s.nombre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {user.bodegas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.bodegas.map(b => (
                          <span key={b.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/60 flex items-center gap-0.5" title={`Bodega asignada de sucursal: ${b.sucursal?.nombre || ''}`}>
                            <Warehouse className="h-2.5 w-2.5 shrink-0" />
                            {b.nombre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      user.sucursales.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">Acceso Total (Sin filtrar)</span>
                      )
                    )}
                  </td>
                  <td className="p-3 text-slate-400 font-medium text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="p-3 text-right pr-5 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(user)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          editingUser?.id === user.id 
                            ? 'bg-teal-500 border-teal-500 text-white' 
                            : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                        title="Editar usuario"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.nombre)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 hover:bg-red-50/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
