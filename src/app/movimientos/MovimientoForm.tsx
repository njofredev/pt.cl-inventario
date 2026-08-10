'use client'

import { useState } from 'react';
import { createTransaction } from './actions';
import { Plus, Minus, Package, Tag, Sparkles } from 'lucide-react';

interface ProductOption {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
  unidadCompra?: string | null;
  unidadesPorEnvase?: number | null;
  unidadEnvase?: string | null;
  unidadesPorConsumo?: number | null;
}

interface Ubicacion {
  id: string;
  nombre: string;
}

interface Bodega {
  id: string;
  nombre: string;
  ubicaciones: Ubicacion[];
}

interface Props {
  products: ProductOption[];
  bodegas: Bodega[];
  defaultTipo: string;
}

export default function MovimientoForm({ products, bodegas, defaultTipo }: Props) {
  const [esEntrada, setEsEntrada] = useState(defaultTipo === 'INGRESO');
  const [productId, setProductId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [bodegaId, setBodegaId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [modoUnidad, setModoUnidad] = useState<'COMPRA' | 'CONSUMO'>('COMPRA');
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Search through products
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

  const selectedProduct = products.find(p => p.id === productId);

  // Get locations for the selected warehouse
  const selectedBodega = bodegas.find(b => b.id === bodegaId);
  const locations = selectedBodega ? selectedBodega.ubicaciones : [];

  const tieneUnidadCompra = Boolean(selectedProduct?.unidadCompra);
  const factorConversion = (selectedProduct?.unidadesPorEnvase || 1) * (selectedProduct?.unidadesPorConsumo || 1);
  const cantNum = parseInt(cantidad) || 0;
  const cantidadFinalCalculada = (tieneUnidadCompra && modoUnidad === 'COMPRA' && esEntrada) 
    ? cantNum * factorConversion 
    : cantNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      setStatus({ success: false, message: "Por favor selecciona un producto de la lista." });
      return;
    }
    if (cantNum <= 0) {
      setStatus({ success: false, message: "Por favor ingresa una cantidad válida mayor a 0." });
      return;
    }
    if (!bodegaId || !ubicacionId) {
      setStatus({ success: false, message: "Por favor selecciona bodega y ubicación." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('productoId', productId);
    formData.append('cantidad', cantidadFinalCalculada.toString());
    formData.append('esEntrada', esEntrada ? 'true' : 'false');
    formData.append('bodegaId', bodegaId);
    formData.append('ubicacionId', ubicacionId);

    const res = await createTransaction(formData);
    setLoading(false);

    if (res.success) {
      setStatus({ success: true, message: `Movimiento registrado exitosamente (${cantidadFinalCalculada} ${selectedProduct?.unidad || 'Unidades'} en Stock).` });
      setCantidad('');
      setProductId('');
      setSearchQuery('');
      setBodegaId('');
      setUbicacionId('');
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Selector de Tipo */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => { setEsEntrada(true); setStatus(null); }}
          className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            esEntrada 
              ? 'bg-[#227262] text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="h-3.5 w-3.5" /> Ingreso
        </button>
        <button
          type="button"
          onClick={() => { setEsEntrada(false); setStatus(null); }}
          className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            !esEntrada 
              ? 'bg-amber-600 text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Minus className="h-3.5 w-3.5" /> Egreso
        </button>
      </div>

      {/* Producto */}
      <div className="space-y-1 relative">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Buscar Producto *</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Escribe código o nombre..."
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
        {filteredProducts.length > 0 && (
          <div className="absolute z-20 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProductId(p.id);
                  setSearchQuery(`[${p.codigo}] ${p.nombre}`);
                  if (p.unidadCompra) setModoUnidad('COMPRA');
                }}
                className="w-full text-left px-3.5 py-2 text-xs hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
              >
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">[{p.codigo}]</span> {p.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selector de Unidad de Ingreso (Si aplica) */}
      {selectedProduct && tieneUnidadCompra && esEntrada && (
        <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl space-y-1.5">
          <div className="text-[10px] font-bold text-teal-800 dark:text-teal-300">
            Unidad de Ingreso:
          </div>
          <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-teal-200 dark:border-teal-700">
            <button
              type="button"
              onClick={() => setModoUnidad('COMPRA')}
              className={`py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                modoUnidad === 'COMPRA'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Package className="h-3 w-3" />
              <span>{selectedProduct.unidadCompra}</span>
            </button>
            <button
              type="button"
              onClick={() => setModoUnidad('CONSUMO')}
              className={`py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                modoUnidad === 'CONSUMO'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Tag className="h-3 w-3" />
              <span>{selectedProduct.unidad || 'Unidad'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Cantidad {selectedProduct ? `(${modoUnidad === 'COMPRA' && tieneUnidadCompra && esEntrada ? selectedProduct.unidadCompra : (selectedProduct.unidad || 'Unidades')})` : ''} *
        </label>
        <input
          type="number"
          min="1"
          required
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder={tieneUnidadCompra && modoUnidad === 'COMPRA' && esEntrada ? `Ej. 2 ${selectedProduct?.unidadCompra}` : "Ej. 100"}
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
        {tieneUnidadCompra && modoUnidad === 'COMPRA' && esEntrada && cantNum > 0 && (
          <div className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 pt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Equivale a <span className="font-bold underline">{cantidadFinalCalculada} {selectedProduct?.unidad || 'Unidades'}</span> a ingresar en el Stock.</span>
          </div>
        )}
      </div>

      {/* Bodega */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Bodega *</label>
        <select
          required
          value={bodegaId}
          onChange={(e) => { setBodegaId(e.target.value); setUbicacionId(''); }}
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        >
          <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Seleccione bodega...</option>
          {bodegas.map(b => (
            <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{b.nombre}</option>
          ))}
        </select>
      </div>

      {/* Ubicación */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ubicación Física *</label>
        <select
          required
          disabled={!bodegaId}
          value={ubicacionId}
          onChange={(e) => setUbicacionId(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 font-medium"
        >
          <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Seleccione ubicación...</option>
          {locations.map(u => (
            <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{u.nombre}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && (
        <div className={`p-3 text-xs font-semibold rounded-xl border ${
          status.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {status.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#162158] hover:bg-[#0d1436] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-md active-scale-down cursor-pointer mt-2"
      >
        {loading ? 'Procesando...' : 'Registrar Movimiento'}
      </button>
    </form>
  );
}
