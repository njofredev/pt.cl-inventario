'use client'

import { useState, useTransition, useEffect } from "react";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";
import { 
  UserCog, 
  ShieldCheck, 
  User, 
  UserPlus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Building2, 
  Warehouse, 
  ShoppingCart, 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  IdCard, 
  Plus, 
  Users, 
  Lock,
  Check,
  Calendar,
  AlertCircle
} from "lucide-react";

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

interface DestinoItem {
  id: string;
  nombre: string;
  sucursalId: string;
  sucursal?: {
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
  destinos?: DestinoItem[];
}

export default function UserManagementClient({ 
  initialUsers, 
  sucursales, 
  bodegas, 
  destinos = [] 
}: UserManagementClientProps) {
  const [users, setUsers] = useState<DbUser[]>(initialUsers);
  
  // Modal / Drawer state: controls opening either for creating new or editing existing
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  // Filter & Search states for the main table
  const [roleFilter, setRoleFilter] = useState<'TODOS' | 'CONSUMIDOR' | 'OPERADORES' | 'CONTABLE' | 'ADMIN'>('TODOS');
  const [searchUser, setSearchUser] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFormOpen]);

  // Reset form helper and close modal
  const closeModal = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setNombre("");
    setRole("USER");
    setCargo("");
    setAreaTrabajo("");
    setRut("");
    setSelectedSucursales([]);
    setSelectedBodegas([]);
    setStatus(null);
  };

  // Open modal for new user
  const startCreate = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setNombre("");
    setRole("USER");
    setCargo("");
    setAreaTrabajo("");
    setRut("");
    setSelectedSucursales([]);
    setSelectedBodegas([]);
    setStatus(null);
    setIsFormOpen(true);
  };

  // Populate form and open modal for editing
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
    setIsFormOpen(true);
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
          closeModal();
        } else {
          setStatus({ success: false, message: res.error });
        }
      } else {
        // Create Action
        const res = await createUserAction(formData);
        if (res.success) {
          closeModal();
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
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (editingUser?.id === userId) {
          closeModal();
        }
      } else {
        alert(res.error || "No se pudo eliminar el usuario");
      }
    });
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (roleFilter === 'CONSUMIDOR' && u.role !== 'CONSUMIDOR') return false;
    if (roleFilter === 'OPERADORES' && (u.role === 'CONSUMIDOR' || u.role === 'ADMIN' || u.role === 'CONTABLE')) return false;
    if (roleFilter === 'CONTABLE' && u.role !== 'CONTABLE') return false;
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
  const contablesCount = users.filter(u => u.role === 'CONTABLE').length;
  const adminsCount = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="space-y-4 w-full">
      {/* Main Full-Width Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Top Control Bar: Search + Filter Tabs + New User Button */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Cuentas Registradas ({filteredUsers.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Haz clic en el botón de edición para modificar permisos, roles o áreas asignadas.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Buscar por nombre, usuario, RUT o box..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                {searchUser && (
                  <button 
                    onClick={() => setSearchUser('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botón Nuevo Usuario */}
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active-scale-down cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => setRoleFilter('TODOS')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'CONSUMIDOR'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Consumidores ({consumidoresCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('OPERADORES')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'OPERADORES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Bodegueros / Operadores ({operadoresCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('CONTABLE')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'CONTABLE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Contable ({contablesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admins ({adminsCount})</span>
            </button>
          </div>
        </div>

        {/* User List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[760px]">
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
                  <td colSpan={5} className="py-14 text-center text-slate-400 text-xs font-medium">
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
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                    >
                      {/* Columna Usuario / Profesional */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-600/25 border border-teal-500/25 text-teal-700 dark:text-teal-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {user.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[200px]">
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
                                  <span className="truncate max-w-[140px]">{user.cargo}</span>
                                </span>
                              )}
                              {user.areaTrabajo && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md border border-teal-100 dark:border-teal-900/50">
                                  <MapPin className="h-2.5 w-2.5 text-teal-500" />
                                  <span className="truncate max-w-[140px]">{user.areaTrabajo}</span>
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

                      {/* Columna Asignaciones */}
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
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer shadow-2xs group-hover:border-teal-400/80"
                            title="Editar usuario"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.nombre)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 hover:bg-red-50/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer shadow-2xs"
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

      {/* Modal / Drawer para Crear o Editar Usuario */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {editingUser ? `Editar Usuario: ${editingUser.nombre}` : "Registrar Nuevo Usuario"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {editingUser ? "Modifica los permisos, sucursales y datos de acceso." : "Ingresa los datos para crear una nueva cuenta en el sistema."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Status Alert if error */}
              {status && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                  status.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              {/* Nombre Completo & Nombre de Usuario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Fernando Urbina..."
                    required
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. furbina..."
                    required
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* Contraseña & Rol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Lock className="h-3 w-3 text-slate-400" /> Contraseña
                    </label>
                    {editingUser && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        (Opcional)
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? "En blanco para no cambiar..." : "Contraseña inicial..."}
                    required={!editingUser}
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-slate-400" /> Rol / Permisos *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="CONSUMIDOR">Consumidor (Solo Portal de Solicitud)</option>
                    <option value="USER">Operador / Bodeguero (Entradas y Salidas)</option>
                    <option value="ADMIN">Administrador (Control Total)</option>
                    <option value="CONTABLE">Contable (Lectura, Auditoría y Kardex)</option>
                  </select>
                </div>
              </div>

              {/* Cargo & Área / Box & RUT */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  {/* Área / Box Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-teal-600 dark:text-teal-400" /> Área / Box
                    </label>
                    <select
                      value={areaTrabajo}
                      onChange={(e) => setAreaTrabajo(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      <option value="">Selecciona Área o Box...</option>

                      {/* Si el usuario actual tiene un valor previo no listado, lo preservamos */}
                      {areaTrabajo && !destinos.some(d => d.nombre.trim().toLowerCase() === areaTrabajo.trim().toLowerCase()) && (
                        <option value={areaTrabajo}>
                          {areaTrabajo} (Actual)
                        </option>
                      )}

                      {/* Destinos agrupados por Sucursal */}
                      {sucursales.map(suc => {
                        const destinosDeSucursal = destinos.filter(d => d.sucursalId === suc.id);
                        if (destinosDeSucursal.length === 0) return null;
                        return (
                          <optgroup key={suc.id} label={suc.nombre}>
                            {destinosDeSucursal.map(d => (
                              <option key={d.id} value={d.nombre}>
                                {d.nombre}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}

                      {/* Destinos sin sucursal asignada si existieran */}
                      {destinos.filter(d => !d.sucursalId).length > 0 && (
                        <optgroup label="Otros Destinos">
                          {destinos.filter(d => !d.sucursalId).map(d => (
                            <option key={d.id} value={d.nombre}>
                              {d.nombre}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
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
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* Permisos de Sucursales Permitidas */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Sucursales Permitidas
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({selectedSucursales.length} seleccionadas)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
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
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Bodegas Permitidas
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({selectedBodegas.length} seleccionadas)
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {sucursales.map(suc => {
                    const bodegasInSuc = bodegas.filter(b => b.sucursalId === suc.id);
                    if (bodegasInSuc.length === 0) return null;

                    return (
                      <div key={suc.id} className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-1">
                          {suc.nombre}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1 pt-1">
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

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 rounded-xl transition-all active-scale-down shadow-sm cursor-pointer flex items-center gap-2"
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
        </div>
      )}
    </div>
  );
}
