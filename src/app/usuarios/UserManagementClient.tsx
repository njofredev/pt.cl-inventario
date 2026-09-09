'use client'

import { useState, useTransition } from "react";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";
import { UserCog, ShieldCheck, User, UserPlus, Pencil, Trash2, X, Save, Building2, Warehouse, ShoppingCart, Search, Filter, ClipboardList, Briefcase, MapPin, IdCard } from "lucide-react";

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
  cargo?: string | null;
  areaTrabajo?: string | null;
  rut?: string | null;
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
  const [cargo, setCargo] = useState("");
  const [areaTrabajo, setAreaTrabajo] = useState("");
  const [rut, setRut] = useState("");
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
    setCargo("");
    setAreaTrabajo("");
    setRut("");
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
    setCargo(user.cargo || "");
    setAreaTrabajo(user.areaTrabajo || "");
    setRut(user.rut || "");
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
      formData.append("cargo", cargo);
      formData.append("areaTrabajo", areaTrabajo);
      formData.append("rut", rut);
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
              cargo: cargo.trim() || null,
              areaTrabajo: areaTrabajo.trim() || null,
              rut: rut.trim() || null,
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

  // Role filter tabs
  const [roleFilter, setRoleFilter] = useState<'TODOS' | 'CONSUMIDOR' | 'OPERADORES' | 'ADMIN'>('TODOS');
  const [searchUser, setSearchUser] = useState('');

  const filteredUsers = users.filter(u => {
    if (roleFilter === 'CONSUMIDOR' && u.role !== 'CONSUMIDOR') return false;
    if (roleFilter === 'OPERADORES' && (u.role === 'CONSUMIDOR' || u.role === 'ADMIN')) return false;
    if (roleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;

    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.cargo && u.cargo.toLowerCase().includes(q)) ||
        (u.areaTrabajo && u.areaTrabajo.toLowerCase().includes(q)) ||
        (u.rut && u.rut.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const consumidoresCount = users.filter(u => u.role === 'CONSUMIDOR').length;
  const operadoresCount = users.filter(u => u.role === 'USER' || u.role === 'OPERADOR').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* User Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-teal-600" />
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
          </div>
          {editingUser && (
            <button 
              onClick={resetForm}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          )}
        </div>

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
              <option value="CONSUMIDOR" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Consumidor (Solo Portal de Solicitud de Insumos)
              </option>
              <option value="USER" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Operador / Bodeguero (Entradas y Salidas de Bodega)
              </option>
              <option value="ADMIN" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Administrador (Control Total del Sistema)
              </option>
              <option value="CONTABLE" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Contable (Lectura, Auditoría y Kardex)
              </option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {role === 'CONSUMIDOR' && 'Este usuario solo tendrá acceso al Portal de Solicitud de Insumos para pedir materiales.'}
              {role === 'USER' && 'Acceso operativo a bodegas para registrar entradas, salidas físicas y conciliar stock.'}
              {role === 'ADMIN' && 'Acceso irrestricto a todos los módulos, parámetros, usuarios y bodegas.'}
              {role === 'CONTABLE' && 'Acceso a balances, reportes, precios y bitácoras valorizadas.'}
            </p>
          </div>

          {/* Cargo & Área de Trabajo & RUT */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cargo */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Cargo / Puesto
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej. Odontólogo, Asistente..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Área de Trabajo */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Área / Box
                </label>
                <input
                  type="text"
                  value={areaTrabajo}
                  onChange={(e) => setAreaTrabajo(e.target.value)}
                  placeholder="Ej. Box dental 2, Esterilización..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* RUT */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <IdCard className="h-3 w-3 text-teal-600 dark:text-teal-400" /> RUT (Opcional)
              </label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej. 12.345.678-9"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Cuentas Registradas ({filteredUsers.length})
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRoleFilter('TODOS')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              roleFilter === 'TODOS'
                ? 'bg-[#162158] dark:bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('CONSUMIDOR')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'CONSUMIDOR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <ShoppingCart className="h-3 w-3" />
            Consumidores ({consumidoresCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('OPERADORES')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'OPERADORES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
            }`}
          >
            <User className="h-3 w-3" />
            Bodegueros / Operadores ({operadoresCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            Admins
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-[34%]">Usuario / Profesional</th>
                <th className="py-3 px-3 w-[15%]">Rol</th>
                <th className="py-3 px-3 w-[26%]">Asignaciones</th>
                <th className="py-3 px-3 w-[13%]">Registro</th>
                <th className="py-3 px-4 w-[12%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No se encontraron usuarios bajo este filtro.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const totalBodegas = user.bodegas.length;
                  const totalSucursales = user.sucursales.length;
                  const bodegasTooltip = user.bodegas.map(b => `${b.nombre} (${b.sucursal?.nombre || 'General'})`).join(', ');
                  const sucursalesTooltip = user.sucursales.map(s => s.nombre).join(', ');

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 ${
                        editingUser?.id === user.id ? 'bg-teal-500/5 dark:bg-teal-500/10' : ''
                      }`}
                    >
                      {/* Columna Usuario / Profesional */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-600/25 border border-teal-500/25 text-teal-700 dark:text-teal-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {user.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[180px]">
                                {user.nombre}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                @{user.username}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {user.rut && (
                                <span className="text-[10px] font-mono text-slate-400 font-medium">
                                  {user.rut}
                                </span>
                              )}
                              {user.cargo && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                  <Briefcase className="h-2.5 w-2.5 text-slate-400" />
                                  <span className="truncate max-w-[130px]">{user.cargo}</span>
                                </span>
                              )}
                              {user.areaTrabajo && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md border border-teal-100 dark:border-teal-900/50">
                                  <MapPin className="h-2.5 w-2.5 text-teal-500" />
                                  <span className="truncate max-w-[130px]">{user.areaTrabajo}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Columna Rol */}
                      <td className="py-3.5 px-3 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap shadow-2xs ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800' 
                            : user.role === 'CONSUMIDOR'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                              : user.role === 'CONTABLE'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800'
                        }`}>
                          {user.role === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
                          {user.role === 'CONSUMIDOR' && <ShoppingCart className="h-3 w-3" />}
                          {user.role === 'CONTABLE' && <Building2 className="h-3 w-3" />}
                          {user.role !== 'ADMIN' && user.role !== 'CONSUMIDOR' && user.role !== 'CONTABLE' && <User className="h-3 w-3" />}
                          
                          {user.role === 'ADMIN' ? 'Admin' :
                           user.role === 'CONSUMIDOR' ? 'Consumidor' :
                           user.role === 'CONTABLE' ? 'Contable' : 'Bodeguero'}
                        </span>
                      </td>

                      {/* Columna Asignaciones (Compacta y visual) */}
                      <td className="py-3.5 px-3 align-middle">
                        {totalSucursales === 0 && totalBodegas === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            {user.role === 'CONSUMIDOR' ? 'Portal de Insumos' : 'Acceso Global'}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {/* Sucursales */}
                            {totalSucursales > 0 && (
                              <div className="flex items-center gap-1 flex-wrap" title={`Sucursales: ${sucursalesTooltip}`}>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  <Building2 className="h-2.5 w-2.5 text-slate-500" />
                                  {totalSucursales === 1 
                                    ? user.sucursales[0].nombre 
                                    : `${totalSucursales} Sucursales`}
                                </span>
                              </div>
                            )}

                            {/* Bodegas */}
                            {totalBodegas > 0 && (
                              <div className="flex items-center gap-1 flex-wrap" title={`Bodegas: ${bodegasTooltip}`}>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60">
                                  <Warehouse className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                                  {totalBodegas === 1 
                                    ? user.bodegas[0].nombre 
                                    : `${totalBodegas} Bodegas autorizadas`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Columna Fecha Registro */}
                      <td className="py-3.5 px-3 align-middle text-slate-400 font-medium text-[11px] whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Columna Acciones */}
                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(user)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              editingUser?.id === user.id 
                                ? 'bg-teal-500 border-teal-500 text-white shadow-xs' 
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
