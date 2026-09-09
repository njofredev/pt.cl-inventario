'use client'

import { useState, useEffect } from 'react';
import { createTransaction, createBatchEgreso } from './actions';
import { Plus, Minus, Package, Tag, Sparkles, User, UserCheck, ShoppingCart, Trash2, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartItem {
  id: string; // unique item key or productId
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

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

interface DestinoOption {
  id: string;
  nombre: string;
  sucursal?: { nombre: string } | null;
}

interface ConsumidorOption {
  id: string;
  username: string;
  nombre: string;
  rut?: string | null;
  areaTrabajo?: string | null;
  cargo?: string | null;
}

interface Props {
  products: ProductOption[];
  bodegas: Bodega[];
  destinos?: DestinoOption[];
  consumidores?: ConsumidorOption[];
  defaultTipo: string;
  forceEsEntrada?: boolean;
}

export default function MovimientoForm({ products, bodegas, destinos = [], consumidores = [], defaultTipo, forceEsEntrada }: Props) {
  const [esEntrada, setEsEntrada] = useState(
    typeof forceEsEntrada === 'boolean' ? forceEsEntrada : defaultTipo === 'INGRESO'
  );
  const [productId, setProductId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [bodegaId, setBodegaId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [destinoNombre, setDestinoNombre] = useState('');
  const [consumidorSeleccionado, setConsumidorSeleccionado] = useState('');
  const [recibidoPor, setRecibidoPor] = useState('');
  const [modoUnidad, setModoUnidad] = useState<'COMPRA' | 'CONSUMO'>('COMPRA');
  const [status, setStatus] = useState<{ success?: boolean; message?: string; correlativo?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Cart state for Egreso Directo
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);

  // Sync state if prop changes (tab changes)
  useEffect(() => {
    if (typeof forceEsEntrada === 'boolean') {
      setEsEntrada(forceEsEntrada);
      setStatus(null);
      setCartItems([]);
      setCartError(null);
    }
  }, [forceEsEntrada]);

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

  // Cart management
  function handleAddToCart() {
    setCartError(null);
    if (!selectedProduct) {
      setCartError("Selecciona un producto de la lista primero.");
      return;
    }
    if (cantNum <= 0) {
      setCartError("Ingresa una cantidad válida mayor a 0.");
      return;
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex(item => item.productoId === selectedProduct.id);
    if (existingIndex >= 0) {
      // Sum quantity
      const updated = [...cartItems];
      updated[existingIndex].cantidad += cantNum;
      setCartItems(updated);
    } else {
      setCartItems(prev => [
        ...prev,
        {
          id: `${selectedProduct.id}-${Date.now()}`,
          productoId: selectedProduct.id,
          codigo: selectedProduct.codigo,
          nombre: selectedProduct.nombre,
          cantidad: cantNum,
          unidad: selectedProduct.unidad || 'UND'
        }
      ]);
    }

    // Reset product input
    setProductId('');
    setSearchQuery('');
    setCantidad('');
  }

  function handleRemoveFromCart(index: number) {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  }

  function handleUpdateCartQuantity(index: number, newQty: number) {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[index].cantidad = newQty;
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bodegaId) {
      setStatus({ success: false, message: "Por favor selecciona una bodega." });
      return;
    }

    // Solicitante resolution
    const solicitanteFinal = consumidorSeleccionado
      ? (consumidores.find(c => c.id === consumidorSeleccionado)?.nombre || recibidoPor)
      : recibidoPor;

    // EGRESO MODE: Use Cart
    if (!esEntrada) {
      // If user has items in cart, proceed with batch
      // If cart is empty but user has a product & qty in input, prompt or auto-add
      let itemsToSubmit = [...cartItems];
      if (itemsToSubmit.length === 0) {
        if (selectedProduct && cantNum > 0) {
          itemsToSubmit = [{
            id: selectedProduct.id,
            productoId: selectedProduct.id,
            codigo: selectedProduct.codigo,
            nombre: selectedProduct.nombre,
            cantidad: cantNum,
            unidad: selectedProduct.unidad || 'UND'
          }];
        } else {
          setStatus({ success: false, message: "Agrega al menos un producto al carrito para registrar el egreso." });
          return;
        }
      }

      setLoading(true);
      setStatus(null);

      const res = await createBatchEgreso({
        items: itemsToSubmit.map(it => ({
          productoId: it.productoId,
          cantidad: it.cantidad
        })),
        bodegaId,
        ubicacionId: ubicacionId || null,
        recibidoPor: solicitanteFinal || null,
        destinoNombre: destinoNombre || null
      });

      setLoading(false);

      if (res.success) {
        setStatus({
          success: true,
          message: `Egreso masivo de ${itemsToSubmit.length} producto(s) registrado con éxito.`,
          correlativo: res.correlativo
        });
        setCartItems([]);
        setCantidad('');
        setProductId('');
        setSearchQuery('');
        setBodegaId('');
        setUbicacionId('');
        setDestinoNombre('');
        setConsumidorSeleccionado('');
        setRecibidoPor('');
      } else {
        setStatus({ success: false, message: res.error });
      }
      return;
    }

    // INGRESO MODE: Single transaction
    if (!productId) {
      setStatus({ success: false, message: "Por favor selecciona un producto de la lista." });
      return;
    }
    if (cantNum <= 0) {
      setStatus({ success: false, message: "Por favor ingresa una cantidad válida mayor a 0." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('productoId', productId);
    formData.append('cantidad', cantidadFinalCalculada.toString());
    formData.append('esEntrada', 'true');
    formData.append('bodegaId', bodegaId);
    if (ubicacionId) formData.append('ubicacionId', ubicacionId);

    const res = await createTransaction(formData);
    setLoading(false);

    if (res.success) {
      setStatus({
        success: true,
        message: `Ingreso registrado con éxito.`,
        correlativo: res.correlativo
      });
      setCantidad('');
      setProductId('');
      setSearchQuery('');
      setBodegaId('');
      setUbicacionId('');
      setDestinoNombre('');
      setConsumidorSeleccionado('');
      setRecibidoPor('');
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selector de Tipo (si no está forzado) */}
      {typeof forceEsEntrada !== 'boolean' && (
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setEsEntrada(true); setStatus(null); setCartItems([]); }}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${esEntrada
                ? 'bg-[#227262] text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Plus className="h-3.5 w-3.5" /> Ingreso
          </button>
          <button
            type="button"
            onClick={() => { setEsEntrada(false); setStatus(null); setCartItems([]); }}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${!esEntrada
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Minus className="h-3.5 w-3.5" /> Egreso
          </button>
        </div>
      )}

      {/* Selector de Usuario Consumidor Solicitante (Salidas/Egresos) */}
      {!esEntrada && (
        <div className="space-y-1 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <label className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Usuario Consumidor Solicitante
            </span>
            <span className="text-[9.5px] font-semibold text-amber-700/80 dark:text-amber-400/80 bg-amber-100/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
              {consumidores.length} {consumidores.length === 1 ? 'registrado' : 'registrados'}
            </span>
          </label>
          <select
            value={consumidorSeleccionado}
            onChange={(e) => {
              const val = e.target.value;
              setConsumidorSeleccionado(val);
              if (val) {
                const cons = consumidores.find(c => c.id === val);
                if (cons) {
                  setRecibidoPor(cons.nombre);
                }
              }
            }}
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold shadow-2xs"
          >
            <option value="">-- Seleccionar usuario consumidor registrado --</option>
            {consumidores.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.username}){c.cargo ? ` - ${c.cargo}` : ''}{c.areaTrabajo ? ` [${c.areaTrabajo}]` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bodega y Ubicación (cabecera compartida para el movimiento o lote) */}
      <div className={`grid ${!esEntrada ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70`}>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {esEntrada ? 'Bodega de Destino *' : 'Bodega de Origen *'}
          </label>
          <select
            required
            value={bodegaId}
            onChange={(e) => { setBodegaId(e.target.value); setUbicacionId(''); }}
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="">Seleccione bodega...</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {!esEntrada && (
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Ubicación Física (Opcional)
            </label>
            <select
              disabled={!bodegaId}
              value={ubicacionId}
              onChange={(e) => setUbicacionId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 font-medium"
            >
              <option value="">General / Por Defecto</option>
              {locations.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Destino y Receptor en Egreso */}
      {!esEntrada && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Destino / Box / Sala (Opcional)
            </label>
            <select
              value={destinoNombre}
              onChange={(e) => setDestinoNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="">Selecciona destino clínico...</option>
              {destinos.map(d => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre} {d.sucursal?.nombre ? `(${d.sucursal.nombre})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nombre de quien Retira / Detalle (Opcional)
            </label>
            <input
              type="text"
              value={recibidoPor}
              onChange={(e) => setRecibidoPor(e.target.value)}
              placeholder="Ej. Valeria Martínez / TENS Box 3"
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>
      )}

      {/* SECCIÓN DE PRODUCTOS: MODO CARRITO (EGRESO) O MODO INDIVIDUAL (INGRESO) */}
      <div className={`p-4 rounded-2xl border ${!esEntrada ? 'bg-amber-50/30 dark:bg-slate-800/60 border-amber-200/80 dark:border-slate-700' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'} space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {!esEntrada ? (
              <>
                <ShoppingCart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Agregar Insumos a la Salida
              </>
            ) : (
              <>
                <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Detalle del Producto a Ingresar
              </>
            )}
          </span>
          {!esEntrada && cartItems.length > 0 && (
            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'ítem en lista' : 'ítems en lista'}
            </span>
          )}
        </div>

        {/* Formulario de selección de producto */}
        <div className="space-y-3">
          {/* Buscar Producto */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Buscar Producto {!esEntrada ? '(para agregar a lista)' : '*'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe código o nombre del producto..."
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
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
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">[{p.codigo}]</span> {p.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector de Unidad de Ingreso (Solo Ingreso) */}
          {selectedProduct && tieneUnidadCompra && esEntrada && (
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold text-teal-800 dark:text-teal-300">
                Unidad de Ingreso:
              </div>
              <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-teal-200 dark:border-teal-700">
                <button
                  type="button"
                  onClick={() => setModoUnidad('COMPRA')}
                  className={`py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${modoUnidad === 'COMPRA'
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
                  className={`py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${modoUnidad === 'CONSUMO'
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

          {/* Cantidad y Botón de Agregar (si es Egreso) */}
          <div className={!esEntrada ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end" : "space-y-1"}>
            <div className={!esEntrada ? "sm:col-span-2 space-y-1" : "space-y-1"}>
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Cantidad {selectedProduct ? `(${modoUnidad === 'COMPRA' && tieneUnidadCompra && esEntrada ? selectedProduct.unidadCompra : (selectedProduct.unidad || 'Unidades')})` : ''} *
              </label>
              <input
                type="number"
                min="1"
                required={esEntrada || cartItems.length === 0}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={(e) => {
                  if (!esEntrada && e.key === 'Enter') {
                    e.preventDefault();
                    handleAddToCart();
                  }
                }}
                placeholder={tieneUnidadCompra && modoUnidad === 'COMPRA' && esEntrada ? `Ej. 2 ${selectedProduct?.unidadCompra}` : "Ej. 10"}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Botón para agregar al carrito en modo Egreso */}
            {!esEntrada && (
              <div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Agregar Insumo</span>
                </button>
              </div>
            )}
          </div>

          {/* Mensaje de error al agregar al carrito */}
          {cartError && (
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{cartError}</span>
            </div>
          )}

          {tieneUnidadCompra && modoUnidad === 'COMPRA' && esEntrada && cantNum > 0 && (
            <div className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 pt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Equivale a <span className="font-bold underline">{cantidadFinalCalculada} {selectedProduct?.unidad || 'Unidades'}</span> a ingresar en el Stock.</span>
            </div>
          )}
        </div>

        {/* TABLA / LISTA DE ITEMS EN EL CARRITO (Solo Egreso) */}
        {!esEntrada && (
          <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <span>Insumos Seleccionados en esta Salida</span>
                <span className="text-[10px] text-slate-400 font-normal">({cartItems.length})</span>
              </span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                >
                  Vaciar lista
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 bg-white/50 dark:bg-slate-900/30">
                <ShoppingCart className="h-6 w-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">El carrito está vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Busca un producto arriba, indica la cantidad y presiona <strong>&quot;Agregar Insumo&quot;</strong> para incluir varios en una sola entrega.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 transition"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.nombre}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Código: {item.codigo}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, item.cantidad - 1)}
                          className="px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleUpdateCartQuantity(idx, parseInt(e.target.value) || 1)}
                          className="w-12 text-center text-xs font-bold bg-transparent border-x border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 py-0.5 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, item.cantidad + 1)}
                          className="px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-8">
                        {item.unidad}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        title="Quitar de la lista"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Alert with Correlative Badge */}
      {status && (
        <div className={`p-3 text-xs font-semibold rounded-xl border ${status.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              {status.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
              {status.message}
            </span>
            {status.correlativo && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-extrabold text-[11px] shadow-xs shrink-0">
                N° {status.correlativo}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 text-white font-extrabold rounded-xl text-xs transition-all shadow-md active-scale-down cursor-pointer flex items-center justify-center gap-2 ${!esEntrada
            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            : 'bg-[#162158] hover:bg-[#0d1436] dark:bg-teal-600 dark:hover:bg-teal-500'
          }`}
      >
        {loading ? (
          'Procesando...'
        ) : !esEntrada ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {cartItems.length > 0
                ? `Confirmar y Registrar Salida (${cartItems.length} insumo${cartItems.length === 1 ? '' : 's'})`
                : 'Registrar Salida'}
            </span>
          </>
        ) : (
          'Registrar Ingreso'
        )}
      </button>
    </form>
  );
}

