'use client';

import { useState } from 'react';
import { 
  CalendarDays, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Edit3, 
  X, 
  Loader2, 
  Package, 
  ShieldAlert,
  Tag
} from 'lucide-react';
import { updateProductExpiration } from './actions';

interface ProductItem {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
  lote?: string | null;
  fechaVencimiento?: string | null;
  tieneVencimiento: boolean;
  stockTotal: number;
}

interface Props {
  products: ProductItem[];
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function VencimientosClient({ products }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'VENCIDOS' | 'PROXIMOS' | 'VIGENTES'>('TODOS');
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  function getExpirationStatus(prod: ProductItem) {
    if (!prod.fechaVencimiento) return 'SIN_FECHA';
    const expDate = new Date(prod.fechaVencimiento);
    if (expDate <= now) return 'VENCIDO';
    if (expDate <= sixtyDaysFromNow) return 'PROXIMO';
    return 'VIGENTE';
  }

  const vencidosCount = products.filter(p => getExpirationStatus(p) === 'VENCIDO').length;
  const proximosCount = products.filter(p => getExpirationStatus(p) === 'PROXIMO').length;
  const vigentesCount = products.filter(p => getExpirationStatus(p) === 'VIGENTE').length;

  const normSearch = removeAccents(search.trim());
  const filteredProducts = products.filter(prod => {
    const status = getExpirationStatus(prod);
    if (filterStatus === 'VENCIDOS' && status !== 'VENCIDO') return false;
    if (filterStatus === 'PROXIMOS' && status !== 'PROXIMO') return false;
    if (filterStatus === 'VIGENTES' && status !== 'VIGENTE') return false;

    if (!normSearch) return true;
    return (
      removeAccents(prod.nombre).includes(normSearch) ||
      removeAccents(prod.codigo).includes(normSearch) ||
      (prod.lote && removeAccents(prod.lote).includes(normSearch))
    );
  });

  function handleOpenModal(prod: ProductItem) {
    setSelectedProduct(prod);
    setLote(prod.lote || '');
    setFechaVencimiento(prod.fechaVencimiento ? new Date(prod.fechaVencimiento).toISOString().split('T')[0] : '');
    setStatusMsg('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);
    setStatusMsg('');

    const res = await updateProductExpiration(selectedProduct.id, lote, fechaVencimiento || null);
    setLoading(false);

    if (res.success) {
      setSelectedProduct(null);
    } else {
      setStatusMsg(res.error || 'Error al actualizar.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterStatus('VENCIDOS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VENCIDOS'
              ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase ${filterStatus === 'VENCIDOS' ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400'}`}>
              Vencidos (Retiro Inmediato)
            </span>
            <AlertTriangle className={`h-5 w-5 ${filterStatus === 'VENCIDOS' ? 'text-white' : 'text-rose-500'}`} />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{vencidosCount}</p>
          <p className={`text-[10px] mt-0.5 ${filterStatus === 'VENCIDOS' ? 'text-rose-100' : 'text-slate-400'}`}>
            Productos con fecha cumplida
          </p>
        </div>

        <div 
          onClick={() => setFilterStatus('PROXIMOS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'PROXIMOS'
              ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase ${filterStatus === 'PROXIMOS' ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
              Próximos a Vencer (&lt; 60 Días)
            </span>
            <Clock className={`h-5 w-5 ${filterStatus === 'PROXIMOS' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{proximosCount}</p>
          <p className={`text-[10px] mt-0.5 ${filterStatus === 'PROXIMOS' ? 'text-amber-100' : 'text-slate-400'}`}>
            Priorizar consumo (FEFO)
          </p>
        </div>

        <div 
          onClick={() => setFilterStatus('VIGENTES')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VIGENTES'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-600/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase ${filterStatus === 'VIGENTES' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Vigentes (&gt; 60 Días)
            </span>
            <CheckCircle2 className={`h-5 w-5 ${filterStatus === 'VIGENTES' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{vigentesCount}</p>
          <p className={`text-[10px] mt-0.5 ${filterStatus === 'VIGENTES' ? 'text-emerald-100' : 'text-slate-400'}`}>
            En estado óptimo
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {(['TODOS', 'VENCIDOS', 'PROXIMOS', 'VIGENTES'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                filterStatus === tab
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'TODOS' ? 'Todos los Productos' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o lote..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">N° de Lote</th>
                <th className="py-3 px-4">Fecha Vencimiento</th>
                <th className="py-3 px-4">Estado Caducidad</th>
                <th className="py-3 px-4 text-right">Stock Actual</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const status = getExpirationStatus(prod);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {prod.nombre}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        {prod.codigo}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {prod.lote ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                            {prod.lote}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin Lote</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {prod.fechaVencimiento ? (
                          new Date(prod.fechaVencimiento).toLocaleDateString('es-CL')
                        ) : (
                          <span className="text-slate-400 italic">No asignada</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {status === 'VENCIDO' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" /> VENCIDO
                          </span>
                        )}
                        {status === 'PROXIMO' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" /> PRÓXIMO A VENCER
                          </span>
                        )}
                        {status === 'VIGENTE' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" /> VIGENTE
                          </span>
                        )}
                        {status === 'SIN_FECHA' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800">
                            Sin Fecha
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">
                        {prod.stockTotal} {prod.unidad || 'U.'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(prod)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Editar Lote</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expiration Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Asignar Lote y Vencimiento
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {selectedProduct.nombre}
                </p>
                <p className="text-[10px] text-slate-400">
                  Código: <span className="font-mono">{selectedProduct.codigo}</span> | Stock: {selectedProduct.stockTotal} {selectedProduct.unidad}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Número de Lote / Fabricación
                </label>
                <input
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Ej. LOT-2026-X98"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {statusMsg && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                  {statusMsg}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Guardar Cambios</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
