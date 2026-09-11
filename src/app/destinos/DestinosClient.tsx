'use client'

import { useState, useTransition, useEffect } from "react";
import { createDestinoAction, updateDestinoAction, deleteDestinoAction } from "./actions";
import { MapPin, Plus, Pencil, Trash2, X, Save, Building2, Search, AlertCircle } from "lucide-react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface Destino {
  id: string;
  nombre: string;
  sucursalId: string;
  sucursal: Sucursal;
  createdAt: Date;
}

interface DestinosClientProps {
  initialDestinos: Destino[];
  sucursales: Sucursal[];
}

export default function DestinosClient({ initialDestinos, sucursales }: DestinosClientProps) {
  const [destinos, setDestinos] = useState<Destino[]>(initialDestinos);
  
  // Modal states for creating or editing destino
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDestino, setEditingDestino] = useState<Destino | null>(null);

  // Form input states
  const [nombre, setNombre] = useState("");
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id || "");

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSucursalFilter, setSelectedSucursalFilter] = useState("ALL");

  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Prevent background scroll when modal is active
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

  // Reset form and close modal helper
  const closeModal = () => {
    setIsFormOpen(false);
    setEditingDestino(null);
    setNombre("");
    setSucursalId(sucursales[0]?.id || "");
    setStatus(null);
  };

  // Open modal for creating new destino
  const startCreate = () => {
    setEditingDestino(null);
    setNombre("");
    setSucursalId(sucursales[0]?.id || "");
    setStatus(null);
    setIsFormOpen(true);
  };

  // Populate and open modal for editing
  const startEdit = (destino: Destino) => {
    setEditingDestino(destino);
    setNombre(destino.nombre);
    setSucursalId(destino.sucursalId);
    setStatus(null);
    setIsFormOpen(true);
  };

  // Handle Create or Update Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim() || !sucursalId) {
      setStatus({ success: false, message: "Todos los campos son obligatorios." });
      return;
    }

    setStatus(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      formData.append("sucursalId", sucursalId);

      if (editingDestino) {
        // Edit Action
        const res = await updateDestinoAction(editingDestino.id, formData);
        if (res.success) {
          const selectedSucursal = sucursales.find(s => s.id === sucursalId)!;
          setDestinos(prev =>
            prev.map(d => (d.id === editingDestino.id ? { ...d, nombre: nombre.trim(), sucursalId, sucursal: selectedSucursal } : d))
          );
          closeModal();
        } else {
          setStatus({ success: false, message: res.error });
        }
      } else {
        // Create Action
        const res = await createDestinoAction(formData);
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
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el destino "${name}"?`)) {
      return;
    }

    setStatus(null);
    startTransition(async () => {
      const res = await deleteDestinoAction(id);
      if (res.success) {
        setDestinos(prev => prev.filter(d => d.id !== id));
        if (editingDestino?.id === id) {
          closeModal();
        }
      } else {
        alert(res.error || "No se pudo eliminar el destino");
      }
    });
  };

  // Filter destinations
  const filteredDestinos = destinos.filter(d => {
    const matchesSearch = d.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSucursal = selectedSucursalFilter === "ALL" || d.sucursalId === selectedSucursalFilter;
    return matchesSearch && matchesSucursal;
  });

  return (
    <div className="space-y-4 w-full">
      {/* Destinations List Full Width Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar (Search, Filter, New Button) */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  Destinos Físicos Registrados ({filteredDestinos.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Ubicaciones físicas de destino (boxes, áreas, consultas) asignadas a cada sucursal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar destino o box..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Sucursal Dropdown */}
              <select
                value={selectedSucursalFilter}
                onChange={(e) => setSelectedSucursalFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              >
                <option value="ALL">Todas las Sucursales</option>
                {sucursales.map(suc => (
                  <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                ))}
              </select>

              {/* Botón Nuevo Destino */}
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active-scale-down cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Destino</span>
              </button>
            </div>
          </div>
        </div>

        {/* Destinos Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5 w-[55%]">Ubicación Física / Box</th>
                <th className="py-3 px-4 w-[30%]">Sucursal Perteneciente</th>
                <th className="py-3 px-5 w-[15%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDestinos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-14 text-center text-slate-400 text-xs font-medium">
                    No se encontraron destinos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredDestinos.map((destino) => (
                  <tr 
                    key={destino.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {destino.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {destino.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800 shadow-2xs">
                        <Building2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        {destino.sucursal.nombre}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(destino)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer shadow-2xs group-hover:border-teal-400/80"
                          title="Editar destino"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(destino.id, destino.nombre)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 hover:bg-red-50/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer shadow-2xs"
                          title="Eliminar destino"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer para Crear o Editar Destino */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {editingDestino ? "Editar Destino Físico" : "Nuevo Destino Físico"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {editingDestino ? "Modifica el nombre o la sucursal asignada." : "Registra un nuevo box, sala o servicio."}
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

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              {/* Nombre de la Ubicación */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Ubicación Física / Nombre del Box *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Box dental 1, Sala esterilización..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Sucursal */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Sucursal Perteneciente *
                </label>
                <select
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {sucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
                </select>
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
                  {editingDestino ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isPending 
                    ? (editingDestino ? "Guardando..." : "Creando...") 
                    : (editingDestino ? "Guardar Cambios" : "Crear Destino")
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
