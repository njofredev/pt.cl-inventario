'use client';

import { useState } from 'react';
import { createUnidadAction, updateUnidadAction, deleteUnidadAction } from './actions';
import { Plus, Search, Edit3, Trash2, CheckCircle, AlertCircle, Scale, Tag } from 'lucide-react';

interface Unidad {
  id: string;
  nombre: string;
  createdAt: string;
}

interface Props {
  initialUnidades: Unidad[];
}

export default function UnidadesClient({ initialUnidades }: Props) {
  const [unidades, setUnidades] = useState<Unidad[]>(initialUnidades);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create state
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Status message
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const filtered = unidades.filter(u => 
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setLoadingCreate(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('nombre', nuevoNombre);

    const res = await createUnidadAction(formData);
    setLoadingCreate(false);

    if (res.success) {
      setStatus({ success: true, message: `Unidad "${nuevoNombre.toUpperCase()}" agregada con éxito.` });
      setUnidades([...unidades, { id: Date.now().toString(), nombre: nuevoNombre.trim().toUpperCase(), createdAt: new Date().toISOString() }].sort((a,b) => a.nombre.localeCompare(b.nombre)));
      setNuevoNombre('');
    } else {
      setStatus({ success: false, message: res.error });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editNombre.trim()) return;

    setLoadingEdit(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('id', id);
    formData.append('nombre', editNombre);

    const res = await updateUnidadAction(formData);
    setLoadingEdit(false);

    if (res.success) {
      setStatus({ success: true, message: `Unidad actualizada a "${editNombre.toUpperCase()}".` });
      setUnidades(unidades.map(u => u.id === id ? { ...u, nombre: editNombre.trim().toUpperCase() } : u));
      setEditingId(null);
    } else {
      setStatus({ success: false, message: res.error });
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la unidad de medida "${nombre}"?`)) return;

    setStatus(null);
    const res = await deleteUnidadAction(id);

    if (res.success) {
      setStatus({ success: true, message: `Unidad "${nombre}" eliminada.` });
      setUnidades(unidades.filter(u => u.id !== id));
    } else {
      setStatus({ success: false, message: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Mantenedor de Unidades de Medida
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administra el catálogo completo de unidades disponibles para compras, envases y stock de consumo ({unidades.length} registradas).
          </p>
        </div>
      </div>

      {/* Grid Principal: Formulario Nuevo + Buscador y Tabla */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario Crear */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Agregar Nueva Unidad
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Nombre de la Unidad *
              </label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. AMPOLLA, FRASCO, CAJA..."
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={loadingCreate || !nuevoNombre.trim()}
              className="w-full py-2.5 bg-[#162158] hover:bg-[#0f1842] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loadingCreate ? "Guardando..." : "Registrar Unidad"}
            </button>
          </form>

          {status && (
            <div className={`p-3 text-[11px] font-semibold rounded-xl border flex items-center gap-2 ${
              status.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {status.success ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        {/* Tabla y Filtro */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Catálogo de Unidades ({filtered.length})
            </h2>

            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar unidad..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="max-h-[550px] overflow-y-auto hide-scrollbar border border-slate-100 dark:border-slate-800 rounded-xl">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No se encontraron unidades con ese término.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((u) => (
                  <div key={u.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition-colors">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-teal-500 rounded-lg font-bold uppercase text-slate-800 dark:text-slate-100 focus:outline-none flex-1"
                        />
                        <button
                          onClick={() => handleUpdate(u.id)}
                          disabled={loadingEdit}
                          className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-slate-500 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                            {u.nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(u.id); setEditNombre(u.nombre); }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.nombre)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
