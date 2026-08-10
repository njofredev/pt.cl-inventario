'use client';

import { useState } from 'react';
import { Package, X, Loader2, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { quickCreateProductAction } from '@/app/productos/actions';

interface QuickCreateProductModalProps {
  isOpen: boolean;
  initialSearchQuery: string;
  onClose: () => void;
  onProductCreated: (newProduct: {
    id: string;
    codigo: string;
    nombre: string;
    unidad: string;
    unidadCompra?: string | null;
    unidadesPorEnvase?: number | null;
  }) => void;
}

export default function QuickCreateProductModal({
  isOpen,
  initialSearchQuery,
  onClose,
  onProductCreated,
}: QuickCreateProductModalProps) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState(initialSearchQuery);
  const [unidad, setUnidad] = useState('Unidad');
  const [unidadCompra, setUnidadCompra] = useState('');
  const [unidadesPorEnvase, setUnidadesPorEnvase] = useState('1');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await quickCreateProductAction({
      codigo: codigo.trim() || undefined,
      nombre: nombre.trim(),
      unidad: unidad.trim() || 'Unidad',
      unidadCompra: unidadCompra.trim() || undefined,
      unidadesPorEnvase: parseInt(unidadesPorEnvase) || 1,
    });

    setLoading(false);

    if (res.success && res.product) {
      onProductCreated(res.product);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al crear el producto.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Registrar Nuevo Producto en Catálogo
              </h3>
              <p className="text-[10px] text-slate-400">
                Crea el producto al instante para añadirlo a este movimiento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Producto No Encontrado:</p>
            <p className="text-[11px] opacity-90">
              "<span className="underline font-bold">{initialSearchQuery}</span>" no existe en la base de datos. Ingrésalo ahora para asignarlo automáticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nombre */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Composite DRV 3-4"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Código (Opcional - Auto si se omite) */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Código del Producto (Opcional)
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Dejar en blanco para auto-generar (Ej. PROD-0045)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Unidad & Unidad Compra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Unidad de Medida *
              </label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer"
              >
                <option value="Unidad">Unidad</option>
                <option value="Caja">Caja</option>
                <option value="Frasco">Frasco</option>
                <option value="Ampolla">Ampolla</option>
                <option value="Jeringa">Jeringa</option>
                <option value="Tubo">Tubo</option>
                <option value="Pack">Pack</option>
                <option value="Rollo">Rollo</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Unidad de Compra
              </label>
              <input
                type="text"
                value={unidadCompra}
                onChange={(e) => setUnidadCompra(e.target.value)}
                placeholder="Ej. Caja x 100"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Guardar y Asignar</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
