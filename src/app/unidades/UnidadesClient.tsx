'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { createUnidadAction, updateUnidadAction, deleteUnidadAction } from './actions';
import { Plus, Search, Edit3, Trash2, CheckCircle, AlertCircle, Scale, Tag, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const [nombreForm, setNombreForm] = useState('');
  const [isPending, startTransition] = useTransition();

  // Status message
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const filtered = useMemo(() => {
    return unidades.filter(u => 
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unidades, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  
  // Guard current page in range
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUnidades = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUnidad(null);
    setNombreForm('');
    setStatus(null);
  };

  const startCreate = () => {
    setEditingUnidad(null);
    setNombreForm('');
    setStatus(null);
    setIsModalOpen(true);
  };

  const startEdit = (u: Unidad) => {
    setEditingUnidad(u);
    setNombreForm(u.nombre);
    setStatus(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreForm.trim()) return;

    setStatus(null);

    startTransition(async () => {
      if (editingUnidad) {
        // Edit Action
        const formData = new FormData();
        formData.append('id', editingUnidad.id);
        formData.append('nombre', nombreForm.trim().toUpperCase());

        const res = await updateUnidadAction(formData);
        if (res.success) {
          setUnidades(prev =>
            prev.map(u => u.id === editingUnidad.id ? { ...u, nombre: nombreForm.trim().toUpperCase() } : u)
          );
          closeModal();
        } else {
          setStatus({ success: false, message: res.error });
        }
      } else {
        // Create Action
        const formData = new FormData();
        formData.append('nombre', nombreForm.trim().toUpperCase());

        const res = await createUnidadAction(formData);
        if (res.success) {
          const newUnit: Unidad = {
            id: Date.now().toString(),
            nombre: nombreForm.trim().toUpperCase(),
            createdAt: new Date().toISOString()
          };
          setUnidades(prev => [...prev, newUnit].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          closeModal();
        } else {
          setStatus({ success: false, message: res.error });
        }
      }
    });
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la unidad de medida "${nombre}"?`)) return;

    setStatus(null);
    const res = await deleteUnidadAction(id);

    if (res.success) {
      setUnidades(unidades.filter(u => u.id !== id));
      if (editingUnidad?.id === id) {
        closeModal();
      }
    } else {
      alert(res.error || "Error al eliminar unidad");
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Mantenedor de Unidades de Medida
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Administra el catálogo completo de unidades disponibles para compras, envases y stock de consumo ({unidades.length} registradas).
          </p>
        </div>
      </div>

      {/* Main Full-Width Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar Header (Search + Create Button) */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Catálogo de Unidades ({filtered.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Unidades oficiales de medición para catálogo de productos y recetas.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar unidad..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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

              {/* Botón Nueva Unidad */}
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active-scale-down cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Unidad</span>
              </button>
            </div>
          </div>
        </div>

        {/* Listado de Unidades Full Width */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5 w-[75%]">Nombre de la Unidad de Medida</th>
                <th className="py-3 px-5 w-[25%] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedUnidades.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-14 text-center text-slate-400 text-xs font-medium">
                    No se encontraron unidades con ese término.
                  </td>
                </tr>
              ) : (
                paginatedUnidades.map((u) => (
                  <tr 
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-5 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 shadow-2xs" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                          {u.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer shadow-2xs group-hover:border-teal-400/80"
                          title="Editar unidad"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.nombre)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 hover:bg-red-50/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer shadow-2xs"
                          title="Eliminar unidad"
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

        {/* Footer / Controles de Paginación */}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Mostrando <strong className="text-slate-700 dark:text-slate-200">{Math.min((safeCurrentPage - 1) * pageSize + 1, filtered.length)}</strong> a <strong className="text-slate-700 dark:text-slate-200">{Math.min(safeCurrentPage * pageSize, filtered.length)}</strong> de <strong className="text-slate-700 dark:text-slate-200">{filtered.length}</strong> unidades
              </span>
              
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <span className="text-[11px]">Por pág:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Botones de navegación de página */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {(() => {
                  const pages = [];
                  const delta = 1;
                  const left = Math.max(1, safeCurrentPage - delta);
                  const right = Math.min(totalPages, safeCurrentPage + delta);

                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }

                  return pages.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold text-xs">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = p === safeCurrentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => setCurrentPage(Number(p))}
                        className={`min-w-[28px] h-7 px-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#162158] dark:bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Diálogo Crear o Editar Unidad */}
      {isModalOpen && (
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
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {editingUnidad ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {editingUnidad ? "Modifica el nombre oficial de la unidad." : "Agrega una nueva unidad al catálogo general."}
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

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Nombre de la Unidad *
                </label>
                <input
                  type="text"
                  value={nombreForm}
                  onChange={(e) => setNombreForm(e.target.value)}
                  placeholder="Ej. AMPOLLA, FRASCO, CAJA..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold uppercase placeholder:normal-case"
                />
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
                  disabled={isPending || !nombreForm.trim()}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 rounded-xl transition-all active-scale-down shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {editingUnidad ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isPending 
                    ? (editingUnidad ? "Guardando..." : "Creando...") 
                    : (editingUnidad ? "Guardar Cambios" : "Crear Unidad")
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
