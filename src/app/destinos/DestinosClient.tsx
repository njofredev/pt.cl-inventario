'use client'

import { useState, useTransition } from "react";
import { createDestinoAction, updateDestinoAction, deleteDestinoAction } from "./actions";
import { MapPin, Plus, Pencil, Trash2, X, Save, Building2, Search } from "lucide-react";

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
  const [editingDestino, setEditingDestino] = useState<Destino | null>(null);

  // Form states
  const [nombre, setNombre] = useState("");
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id || "");

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSucursalFilter, setSelectedSucursalFilter] = useState("ALL");

  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset form helper
  const resetForm = () => {
    setNombre("");
    setSucursalId(sucursales[0]?.id || "");
    setEditingDestino(null);
    setStatus(null);
  };

  // Populate form for editing
  const startEdit = (destino: Destino) => {
    setEditingDestino(destino);
    setNombre(destino.nombre);
    setSucursalId(destino.sucursalId);
    setStatus(null);
  };

  // Handle Create or Update Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre || !sucursalId) {
      setStatus({ success: false, message: "Todos los campos son obligatorios." });
      return;
    }

    setStatus(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("sucursalId", sucursalId);

      if (editingDestino) {
        // Edit Action
        const res = await updateDestinoAction(editingDestino.id, formData);
        if (res.success) {
          setStatus({ success: true, message: "Destino actualizado exitosamente." });
          const selectedSucursal = sucursales.find(s => s.id === sucursalId)!;
          setDestinos(prev =>
            prev.map(d => (d.id === editingDestino.id ? { ...d, nombre, sucursalId, sucursal: selectedSucursal } : d))
          );
          resetForm();
        } else {
          setStatus({ success: false, message: res.error });
        }
      } else {
        // Create Action
        const res = await createDestinoAction(formData);
        if (res.success) {
          setStatus({ success: true, message: "Destino registrado exitosamente." });
          resetForm();
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
        setStatus({ success: true, message: `Destino "${name}" eliminado correctamente.` });
        setDestinos(prev => prev.filter(d => d.id !== id));
        if (editingDestino?.id === id) {
          resetForm();
        }
      } else {
        setStatus({ success: false, message: res.error });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create / Edit Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit space-y-4 transition-all duration-300">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {editingDestino ? "Editar Destino" : "Nuevo Destino"}
          </span>
          {editingDestino && (
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cancelar edición"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ubicación Física *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Box dental 1..."
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Sucursal */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sucursal *</label>
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              {sucursales.map(suc => (
                <option key={suc.id} value={suc.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {suc.nombre}
                </option>
              ))}
            </select>
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {editingDestino && (
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
                editingDestino ? "w-2/3" : "w-full"
              }`}
            >
              {editingDestino ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isPending 
                ? (editingDestino ? "Guardando..." : "Creando...") 
                : (editingDestino ? "Guardar Cambios" : "Agregar Destino")
              }
            </button>
          </div>
        </form>
      </div>

      {/* Destinations List Card */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Table Toolbar (Search & Filter) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 shrink-0">
            Destinos Físicos Registrados
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar destino..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/85 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={selectedSucursalFilter}
              onChange={(e) => setSelectedSucursalFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/85 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            >
              <option value="ALL">Todas las Sucursales</option>
              {sucursales.map(suc => (
                <option key={suc.id} value={suc.id}>{suc.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Destinos Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-3 pl-5">Ubicación Física</th>
                <th className="p-3">Sucursal</th>
                <th className="p-3 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDestinos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400 italic">
                    No se encontraron destinos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredDestinos.map((destino) => (
                  <tr key={destino.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${editingDestino?.id === destino.id ? 'bg-teal-500/5 dark:bg-teal-500/10' : ''}`}>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 pl-5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {destino.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{destino.nombre}</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        <Building2 className="h-3 w-3" />
                        {destino.sucursal.nombre}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(destino)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            editingDestino?.id === destino.id 
                              ? 'bg-teal-500 border-teal-500 text-white' 
                              : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                          }`}
                          title="Editar destino"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(destino.id, destino.nombre)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 hover:bg-red-50/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
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
    </div>
  );
}
