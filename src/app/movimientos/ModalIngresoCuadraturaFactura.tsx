'use client';

import { useState, useId, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calculator,
  Warehouse,
  Receipt,
  Scale
} from 'lucide-react';
import { guardarDesgloseFactura, DocumentItemInput } from './docActions';
import QuickCreateProductModal from '@/components/QuickCreateProductModal';

interface ProductOption {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
}

interface BodegaOption {
  id: string;
  nombre: string;
  ubicaciones: Array<{ id: string; nombre: string }>;
}

interface FacturaTarget {
  id: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaDocumento: string;
  montoTotal: number;
  proveedor?: {
    rut: string;
    razonSocial: string;
  } | null;
  items?: Array<{
    id?: string;
    cantidad: number;
    precioUnitario: number;
    esAfecto: boolean;
    incluyeIva: boolean;
    subtotal: number;
    bodegaId?: string | null;
    ubicacionId?: string | null;
    producto: {
      id: string;
      codigo: string;
      nombre: string;
      unidad?: string | null;
    };
  }>;
}

interface Props {
  factura: FacturaTarget;
  products: ProductOption[];
  bodegas: BodegaOption[];
  onClose: () => void;
  onSuccess?: () => void;
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface ItemRow {
  key: string;
  productoId: string;
  searchQuery: string;
  cantidad: string;
  precioUnitario: string;
}

export default function ModalIngresoCuadraturaFactura({
  factura,
  products,
  bodegas,
  onClose,
  onSuccess
}: Props) {
  const [productsList, setProductsList] = useState<ProductOption[]>(products);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings de bodega y tratamiento tributario (rescatar de factura.items o localStorage si ya existían)
  const initialItem = factura.items && factura.items.length > 0 ? factura.items[0] : null;

  const [bodegaId, setBodegaId] = useState<string>(() => {
    if (initialItem?.bodegaId) return initialItem.bodegaId;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`factura_bodega_${factura.id}`) || localStorage.getItem('factura_default_bodega');
      if (saved && bodegas.some(b => b.id === saved)) return saved;
    }
    return bodegas[0]?.id || '';
  });

  const selectedBodega = bodegas.find(b => b.id === bodegaId);

  const [ubicacionId, setUbicacionId] = useState<string>(() => {
    if (initialItem?.ubicacionId) return initialItem.ubicacionId;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`factura_ubicacion_${factura.id}`);
      if (saved) return saved;
    }
    return selectedBodega?.ubicaciones[0]?.id || '';
  });

  const [esAfecto, setEsAfecto] = useState<boolean>(() => {
    if (initialItem !== null && typeof initialItem.esAfecto === 'boolean') {
      return initialItem.esAfecto;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`factura_esAfecto_${factura.id}`) || localStorage.getItem('factura_default_esAfecto');
      if (saved !== null) return saved === 'true';
    }
    return true; // default 19% IVA
  });

  const [incluyeIva, setIncluyeIva] = useState<boolean>(() => {
    if (initialItem !== null && typeof initialItem.incluyeIva === 'boolean') {
      return initialItem.incluyeIva;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`factura_incluyeIva_${factura.id}`) || localStorage.getItem('factura_default_incluyeIva');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  // Guardar cambios de preferencia inmediatamente para que persistan entre aperturas/cierres
  const handleToggleAfecto = () => {
    setEsAfecto(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`factura_esAfecto_${factura.id}`, String(next));
        localStorage.setItem('factura_default_esAfecto', String(next));
      }
      return next;
    });
  };

  const handleToggleIncluyeIva = () => {
    setIncluyeIva(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`factura_incluyeIva_${factura.id}`, String(next));
        localStorage.setItem('factura_default_incluyeIva', String(next));
      }
      return next;
    });
  };

  const handleBodegaChange = (bId: string) => {
    setBodegaId(bId);
    const b = bodegas.find(x => x.id === bId);
    const uId = b?.ubicaciones[0]?.id || '';
    setUbicacionId(uId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`factura_bodega_${factura.id}`, bId);
      localStorage.setItem('factura_default_bodega', bId);
      if (uId) localStorage.setItem(`factura_ubicacion_${factura.id}`, uId);
    }
  };

  const handleUbicacionChange = (uId: string) => {
    setUbicacionId(uId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`factura_ubicacion_${factura.id}`, uId);
    }
  };

  // Modal para crear producto rápido si no existe
  const [quickCreateModal, setQuickCreateModal] = useState<{
    isOpen: boolean;
    rowIdx: number;
    searchQuery: string;
  }>({ isOpen: false, rowIdx: -1, searchQuery: '' });

  // Filas de productos iniciales (si ya tenía ítems cargados los mapea, o inicia con 1 fila vacía)
  const [items, setItems] = useState<ItemRow[]>(() => {
    if (factura.items && factura.items.length > 0) {
      return factura.items.map((it, idx) => ({
        key: `row-${idx}-${it.id || Date.now()}`,
        productoId: it.producto.id,
        searchQuery: `[${it.producto.codigo}] ${it.producto.nombre}`,
        cantidad: String(it.cantidad),
        precioUnitario: String(it.precioUnitario),
      }));
    }
    return [
      {
        key: 'row-1',
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '',
      }
    ];
  });

  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Cálculos dinámicos
  const calculateItemSubtotal = (item: ItemRow): number => {
    const cant = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precioUnitario) || 0;
    if (cant <= 0 || precio <= 0) return 0;

    if (esAfecto) {
      return incluyeIva ? cant * precio : cant * (precio * 1.19);
    }
    return cant * precio;
  };

  const totalCalculadoExacto = items.reduce((acc, it) => acc + calculateItemSubtotal(it), 0);
  const totalCalculadoRedondeado = Math.round(totalCalculadoExacto);
  const montoFactura = Math.round(factura.montoTotal);
  const diferencia = montoFactura - totalCalculadoRedondeado;
  const estaCuadrada = items.length > 0 && Math.abs(diferencia) === 0 && items.every(it => it.productoId !== '' && parseFloat(it.cantidad) > 0);
  const casiCuadrada = Math.abs(diferencia) > 0 && Math.abs(diferencia) <= 3;

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random()}`,
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '',
      }
    ]);
    setTimeout(() => {
      if (itemsContainerRef.current) {
        itemsContainerRef.current.scrollTo({
          top: itemsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, patch: Partial<ItemRow>) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validar ítems
    if (items.length === 0) {
      setErrorMsg('Debes agregar al menos un producto a la factura.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productoId) {
        setErrorMsg(`La fila #${i + 1} no tiene un producto seleccionado del catálogo.`);
        return;
      }
      if (!it.cantidad || parseFloat(it.cantidad) <= 0) {
        setErrorMsg(`La fila #${i + 1} tiene una cantidad inválida.`);
        return;
      }
      if (!it.precioUnitario || parseFloat(it.precioUnitario) < 0) {
        setErrorMsg(`La fila #${i + 1} tiene un precio inválido.`);
        return;
      }
    }

    const preparedItems: DocumentItemInput[] = items.map(it => {
      const cant = parseInt(it.cantidad, 10) || 1;
      const precio = parseFloat(it.precioUnitario) || 0;
      const subtotal = calculateItemSubtotal(it);

      return {
        productoId: it.productoId,
        cantidad: cant,
        precioUnitario: precio,
        esAfecto,
        incluyeIva,
        subtotal,
        bodegaId,
        ubicacionId: ubicacionId || undefined,
      };
    });

    setLoading(true);
    try {
      const res = await guardarDesgloseFactura({
        documentoId: factura.id,
        items: preparedItems,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Ocurrió un error al guardar el desglose.');
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red o comunicación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#070e1e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-[96vw] xl:max-w-[1550px] shadow-2xl flex flex-col h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={() => setActiveSearchIndex(null)}
      >
        {/* Header Modal */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[#227262] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wide bg-teal-50 dark:bg-teal-950/60 text-[#227262] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {factura.tipoDocumento}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                  N° {factura.numeroDocumento}
                </h3>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {factura.proveedor?.razonSocial || 'Proveedor'}
                </span>
                {factura.proveedor?.rut && (
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    ({factura.proveedor.rut})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addItemRow}
              className="px-3.5 py-1.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active-scale-down transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Agregar Ítem</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: DISTRIBUCIÓN DE DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* COLUMNA IZQUIERDA (4 cols): Panel de Control de Cuadratura & Ajustes */}
          <div className="lg:col-span-4 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Tarjetas de Montos */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Panel de Cuadratura
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Monto Factura (Objetivo)
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                      ${montoFactura.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Suma Ingresada ({items.length} {items.length === 1 ? 'ítem' : 'ítems'})
                    </span>
                    <span className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5 block">
                      ${totalCalculadoRedondeado.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border shadow-2xs ${
                    estaCuadrada 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                      : casiCuadrada
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  }`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                      Estado de Cuadratura
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {estaCuadrada ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-sm font-black">¡CUADRADO EXACTO!</p>
                            <p className="text-[10px] opacity-80 font-medium">La suma coincide exactamente ($0 diferencia).</p>
                          </div>
                        </>
                      ) : casiCuadrada ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-sm font-black">Margen residual ±${Math.abs(diferencia)}</p>
                            <p className="text-[10px] opacity-80 font-medium">Se ajustará de forma automática al guardar.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-sm font-black">
                              {diferencia > 0 ? `Faltan $${diferencia.toLocaleString('es-CL')}` : `Excedido por $${Math.abs(diferencia).toLocaleString('es-CL')}`}
                            </p>
                            <p className="text-[10px] opacity-80 font-medium">Ajusta las cantidades o valores de los productos.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ajustes de Bodega & Tratamiento */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Destino y Tratamiento IVA
                </span>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                    <Warehouse className="h-3 w-3 text-teal-600" /> Bodega de Ingreso
                  </label>
                  <select
                    value={bodegaId}
                    onChange={(e) => handleBodegaChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                {selectedBodega && selectedBodega.ubicaciones.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                      Ubicación Interna
                    </label>
                    <select
                      value={ubicacionId}
                      onChange={(e) => handleUbicacionChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {selectedBodega.ubicaciones.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-xs">Impuesto:</span>
                    <button
                      type="button"
                      onClick={handleToggleAfecto}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        esAfecto
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {esAfecto ? 'Afecto IVA (19%)' : 'Exento (0%)'}
                    </button>
                  </div>

                  {esAfecto && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold text-xs">Valores ingresados:</span>
                      <button
                        type="button"
                        onClick={handleToggleIncluyeIva}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          incluyeIva
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {incluyeIva ? 'Con IVA Incluido' : 'Neto (Sin IVA)'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones principales en columna izquierda */}
            <div className="space-y-2 pt-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || items.length === 0}
                className={`w-full py-3 px-4 rounded-xl text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  estaCuadrada || casiCuadrada
                    ? 'bg-[#05b875] hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando e Ingresando Stock...</span>
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4" />
                    <span>{estaCuadrada || casiCuadrada ? 'Guardar y Cuadrar Factura' : 'Guardar con Diferencia'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA (8 cols): Lista de Productos Ampliada & Holgada */}
          <div className="lg:col-span-8 flex flex-col min-h-0 bg-white dark:bg-[#070e1e]">
            {/* Header de la lista de productos */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/40 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-teal-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Desglose de Productos ({items.length})
                </h4>
              </div>
            </div>

            {/* Listado de Filas Scrollable */}
            <div 
              ref={itemsContainerRef} 
              className="p-5 overflow-y-auto space-y-3 flex-1 min-h-0 pb-48"
            >
              {items.map((item, idx) => {
                const itemSubtotal = calculateItemSubtotal(item);
                const rawQuery = item.searchQuery.trim();
                const filteredItemProducts = rawQuery === ''
                  ? []
                  : productsList.filter(p =>
                      removeAccents(p.nombre).includes(removeAccents(rawQuery)) ||
                      removeAccents(p.codigo).includes(removeAccents(rawQuery))
                    ).slice(0, 10);

                const isExactMatchSelected = item.productoId !== '';

                return (
                  <div
                    key={item.key}
                    className={`p-3.5 bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-2 relative transition-all ${
                      activeSearchIndex === idx ? 'z-30 ring-2 ring-teal-500/20 border-teal-500/40' : 'z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Ítem #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                      {/* Búsqueda de Producto: 6 columnas para nombre completo */}
                      <div className="md:col-span-6 relative">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                          Producto / Insumo *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={item.searchQuery}
                            onChange={(e) => {
                              updateItemRow(idx, { searchQuery: e.target.value, productoId: '' });
                              setActiveSearchIndex(idx);
                            }}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setActiveSearchIndex(idx);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Escribe código o nombre del producto..."
                            className="w-full pl-8 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Dropdown de Autocompletado */}
                        {activeSearchIndex === idx && (
                          <div 
                            className="absolute z-50 left-0 w-full min-w-[360px] sm:min-w-[500px] max-w-[92vw] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {filteredItemProducts.length > 0 ? (
                              <>
                                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                  {filteredItemProducts.map(p => (
                                    <div
                                      key={p.id}
                                      onClick={() => {
                                        updateItemRow(idx, {
                                          productoId: p.id,
                                          searchQuery: `[${p.codigo}] ${p.nombre}`,
                                        });
                                        setActiveSearchIndex(null);
                                      }}
                                      className="p-3 text-xs hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer font-medium text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 transition-colors"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 flex-1 min-w-0">
                                        <span className="font-mono text-teal-600 dark:text-teal-400 font-bold shrink-0">
                                          [{p.codigo}]
                                        </span>
                                        <span className="text-slate-800 dark:text-slate-100 font-bold break-words whitespace-normal leading-relaxed">
                                          {p.nombre}
                                        </span>
                                      </div>
                                      {p.unidad && (
                                        <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 border border-slate-200 dark:border-slate-700">
                                          {p.unidad}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickCreateModal({ isOpen: true, rowIdx: idx, searchQuery: rawQuery });
                                    setActiveSearchIndex(null);
                                  }}
                                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>¿No está en la lista? Crear producto nuevo</span>
                                </button>
                              </>
                            ) : rawQuery.length > 0 && !isExactMatchSelected ? (
                              <div className="p-3 bg-amber-50/80 dark:bg-slate-800/90 text-center space-y-2">
                                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                  ⚠️ El producto "{rawQuery}" no existe en el catálogo.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickCreateModal({ isOpen: true, rowIdx: idx, searchQuery: rawQuery });
                                    setActiveSearchIndex(null);
                                  }}
                                  className="w-full py-2 px-3 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active-scale-down cursor-pointer"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Crear "{rawQuery}" en Catálogo</span>
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                                Escribe para buscar por código o nombre...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cantidad: 2 columnas */}
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateItemRow(idx, { cantidad: e.target.value })}
                          className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none text-center"
                        />
                      </div>

                      {/* Precio Unitario: 2 columnas */}
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                          Precio Unit. ($) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.precioUnitario}
                          onChange={(e) => updateItemRow(idx, { precioUnitario: e.target.value })}
                          className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none text-right font-mono"
                        />
                      </div>

                      {/* Subtotal & IVA: 2 columnas */}
                      <div className="md:col-span-2 text-right">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                          Subtotal {esAfecto ? 'con IVA' : 'Exento'}
                        </label>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono py-1.5 truncate">
                          ${Math.round(itemSubtotal).toLocaleString('es-CL')}
                        </p>

                        {/* Desglose de IVA calculado cuando el ítem es afecto */}
                        {esAfecto && itemSubtotal > 0 && (() => {
                          const cant = parseFloat(item.cantidad) || 0;
                          const precio = parseFloat(item.precioUnitario) || 0;
                          const netoTotal = incluyeIva ? itemSubtotal / 1.19 : cant * precio;
                          const ivaCalculado = itemSubtotal - netoTotal;

                          return (
                            <div className="mt-0.5 space-y-0.5 font-mono text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80 pt-1">
                              <span className="text-teal-600 dark:text-teal-400 font-bold block">
                                + IVA (19%): ${Math.round(ivaCalculado).toLocaleString('es-CL')}
                              </span>
                              {!incluyeIva && (
                                <span className="text-slate-400 text-[9px] block">
                                  Neto: ${Math.round(netoTotal).toLocaleString('es-CL')}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botón al final del último ítem para agregar producto sin tener que subir */}
              <div className="pt-2 pb-10">
                <button
                  type="button"
                  onClick={addItemRow}
                  className="w-full py-3 px-4 border-2 border-dashed border-teal-500/40 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/70 dark:bg-teal-950/20 dark:hover:bg-teal-950/50 text-[#05b875] dark:text-teal-300 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>+ Agregar Producto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Creación Rápida de Producto si no existe en BD */}
      {quickCreateModal.isOpen && (
        <QuickCreateProductModal
          isOpen={quickCreateModal.isOpen}
          initialSearchQuery={quickCreateModal.searchQuery}
          onClose={() => setQuickCreateModal({ isOpen: false, rowIdx: -1, searchQuery: '' })}
          onProductCreated={(newProduct) => {
            setProductsList(prev => [...prev, newProduct]);
            if (quickCreateModal.rowIdx >= 0) {
              updateItemRow(quickCreateModal.rowIdx, {
                productoId: newProduct.id,
                searchQuery: `[${newProduct.codigo}] ${newProduct.nombre}`,
              });
            }
            setQuickCreateModal({ isOpen: false, rowIdx: -1, searchQuery: '' });
          }}
        />
      )}
    </div>
  );
}
