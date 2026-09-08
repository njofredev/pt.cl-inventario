'use client';

import { useState } from "react";
import {
  Warehouse,
  Plus,
  Search,
  Edit3,
  Trash2,
  MapPin,
  Building2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Layers,
  Settings2,
  ShieldAlert,
  Lock
} from "lucide-react";
import {
  createBodegaAction,
  updateBodegaAction,
  deleteBodegaAction,
  createUbicacionAction,
  deleteUbicacionAction
} from "./actions";

interface Sucursal {
  id: string;
  nombre: string;
}

interface UbicacionItem {
  id: string;
  nombre: string;
  _count?: {
    stocks: number;
    movimientos: number;
  };
}

interface Bodega {
  id: string;
  nombre: string;
  sucursalId: string;
  sucursal: Sucursal;
  ubicaciones: UbicacionItem[];
  _count: {
    ubicaciones: number;
    stocks: number;
    movimientos: number;
  };
}

interface Props {
  initialBodegas: Bodega[];
  sucursales: Sucursal[];
  isAdmin?: boolean;
}

export default function BodegasClient({ initialBodegas, sucursales, isAdmin = false }: Props) {
  const [bodegas, setBodegas] = useState<Bodega[]>(initialBodegas);
  const [search, setSearch] = useState("");
  const [selectedSucursalFilter, setSelectedSucursalFilter] = useState("TODAS");

  // Form State: Create Bodega
  const [newNombre, setNewNombre] = useState("");
  const [newSucursalId, setNewSucursalId] = useState(sucursales[0]?.id || "");
  const [isCreating, setIsCreating] = useState(false);

  // Form State: Edit Inline / Modal
  const [editingBodega, setEditingBodega] = useState<Bodega | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editSucursalId, setEditSucursalId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State: Ubicaciones Sub-manager Modal
  const [managingBodega, setManagingBodega] = useState<Bodega | null>(null);
  const [newUbicacionNombre, setNewUbicacionNombre] = useState("");
  const [isAddingUbicacion, setIsAddingUbicacion] = useState(false);

  // State: Delete Confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Messages
  const [actionMessage, setActionMessage] = useState<{ success?: string; error?: string } | null>(null);

  // Filtered List
  const filteredBodegas = bodegas.filter((b) => {
    const matchesSearch =
      b.nombre.toLowerCase().includes(search.toLowerCase()) ||
      b.sucursal.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesSucursal = selectedSucursalFilter === "TODAS" || b.sucursalId === selectedSucursalFilter;
    return matchesSearch && matchesSucursal;
  });

  // Handler: Create Bodega
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newNombre.trim() || !newSucursalId) return;

    setIsCreating(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("nombre", newNombre);
    formData.append("sucursalId", newSucursalId);

    const res = await createBodegaAction(formData);
    setIsCreating(false);

    if (res.error) {
      setActionMessage({ error: res.error });
    } else {
      setActionMessage({ success: `Bodega "${newNombre}" creada exitosamente.` });
      setNewNombre("");
      window.location.reload();
    }
  }

  // Handler: Open Edit Modal
  function startEditing(bodega: Bodega) {
    setEditingBodega(bodega);
    setEditNombre(bodega.nombre);
    setEditSucursalId(bodega.sucursalId);
  }

  // Handler: Submit Edit
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBodega || !editNombre.trim() || !editSucursalId) return;

    setIsUpdating(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("id", editingBodega.id);
    formData.append("nombre", editNombre);
    formData.append("sucursalId", editSucursalId);

    const res = await updateBodegaAction(formData);
    setIsUpdating(false);

    if (res.error) {
      setActionMessage({ error: res.error });
    } else {
      setActionMessage({ success: `Bodega actualizada correctamente.` });
      setEditingBodega(null);
      window.location.reload();
    }
  }

  // Handler: Delete Bodega
  async function handleDelete(id: string) {
    setIsDeleting(true);
    setActionMessage(null);

    const res = await deleteBodegaAction(id);
    setIsDeleting(false);
    setDeletingId(null);

    if (res.error) {
      setActionMessage({ error: res.error });
    } else {
      setActionMessage({ success: "Bodega eliminada correctamente." });
      setBodegas(bodegas.filter((b) => b.id !== id));
    }
  }

  // Handler: Create Ubicacion Sub-item
  async function handleCreateUbicacion(e: React.FormEvent) {
    e.preventDefault();
    if (!managingBodega || !newUbicacionNombre.trim()) return;

    setIsAddingUbicacion(true);
    setActionMessage(null);

    const res = await createUbicacionAction(managingBodega.id, newUbicacionNombre);
    setIsAddingUbicacion(false);

    if (res.error) {
      setActionMessage({ error: res.error });
    } else {
      setActionMessage({ success: `Ubicación "${newUbicacionNombre}" creada en ${managingBodega.nombre}.` });
      setNewUbicacionNombre("");
      window.location.reload();
    }
  }

  // Handler: Delete Ubicacion Sub-item
  async function handleDeleteUbicacion(ubicacionId: string) {
    setActionMessage(null);
    const res = await deleteUbicacionAction(ubicacionId);

    if (res.error) {
      setActionMessage({ error: res.error });
    } else {
      setActionMessage({ success: "Ubicación física eliminada correctamente." });
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 rounded-xl">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Gestión de Bodegas y Ubicaciones Físicas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Catálogo centralizado de recintos de almacenamiento por sucursal y sus estantes/ubics internas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {bodegas.length} Bodegas Registradas
          </span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {actionMessage?.success && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionMessage.success}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionMessage?.error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{actionMessage.error}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-red-600 dark:text-red-400 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grid: Main Form (Left 4 cols) + List Card (Right 8 cols) */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-6`}>

        {/* FORMULARIO: REGISTRAR NUEVA BODEGA (Exclusivo Administradores) */}
        {isAdmin ? (
          <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" /> Nueva Bodega
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Asigna una nueva bodega física a una sucursal
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Sucursal Destino *
                </label>
                <select
                  value={newSucursalId}
                  onChange={(e) => setNewSucursalId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      📍 Sucursal: {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Nombre de la Bodega *
                </label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="ej: Bodega Clínica (Vitacura)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating || !newNombre.trim()}
                className="w-full py-3 bg-[#162158] hover:bg-[#0f1842] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active-scale-down cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>{isCreating ? "Registrando..." : "Guardar Bodega"}</span>
              </button>
            </form>
          </div>
        ) : null}

        {/* LISTA Y TABLA DE BODEGAS */}
        <div className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-4`}>

          {/* Controls: Search + Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por bodega o sucursal..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">
                Filtrar Sucursal:
              </span>
              <select
                value={selectedSucursalFilter}
                onChange={(e) => setSelectedSucursalFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium shrink-0"
              >
                <option value="TODAS">Todas las Sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBodegas.length === 0 ? (
              <div className="col-span-2 p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <Warehouse className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-500">No se encontraron bodegas que coincidan.</p>
              </div>
            ) : (
              filteredBodegas.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40 rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                          <Building2 className="h-3 w-3" /> {b.sucursal.nombre}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {b.nombre}
                        </h3>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditing(b)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Bodega"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Bodega"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Counters & Ubicaciones Trigger */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <button
                      type="button"
                      onClick={() => setManagingBodega(b)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/60 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 rounded-xl transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-700 font-bold"
                      title="Haz clic para ver y gestionar estantes y ubicaciones físicas"
                    >
                      <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{b._count.ubicaciones} Ubicaciones</span>
                      <Settings2 className="h-3 w-3 text-slate-400 ml-0.5" />
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Boxes className="h-3.5 w-3.5" />
                      <span>{b._count.stocks} Registros Stock</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: SUB-GESTIÓN DE UBICACIONES DENTRO DE UNA BODEGA */}
      {managingBodega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-2xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    {managingBodega.sucursal.nombre}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Ubicaciones en {managingBodega.nombre}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setManagingBodega(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form: Add New Physical Location inside Bodega */}
            <form onSubmit={handleCreateUbicacion} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl space-y-2">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                ➕ Agregar Nueva Ubicación / Estante
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newUbicacionNombre}
                  onChange={(e) => setNewUbicacionNombre(e.target.value)}
                  placeholder="ej: Estante A-1, Repisa Central..."
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={isAddingUbicacion || !newUbicacionNombre.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs active-scale-down cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isAddingUbicacion ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>

            {/* List of Physical Locations */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Ubicaciones Registradas ({managingBodega.ubicaciones.length})
              </label>

              {managingBodega.ubicaciones.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  No hay ubicaciones registradas aún en esta bodega.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                  {managingBodega.ubicaciones.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-100">{u.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {u._count && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {u._count.stocks} stocks
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteUbicacion(u.id)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Eliminar Ubicación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingBodega(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR BODEGA */}
      {editingBodega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-teal-600" /> Editar Bodega
              </h3>
              <button
                onClick={() => setEditingBodega(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Sucursal *
                </label>
                <select
                  value={editSucursalId}
                  onChange={(e) => setEditSucursalId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      📍 {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Nombre de la Bodega *
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBodega(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editNombre.trim()}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{isUpdating ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN ELIMINAR BODEGA */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                ¿Eliminar Bodega?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Esta acción no se puede deshacer. Se verificará que la bodega no contenga movimientos o ubicaciones activas.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <span>{isDeleting ? "Eliminando..." : "Sí, Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

