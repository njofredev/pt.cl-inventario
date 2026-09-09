'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Building2,
  FileText,
  Truck,
  ReceiptText,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Loader2,
  Warehouse,
  MapPin,
  Tag
} from 'lucide-react';
import { createDocumentoMovimiento, DocumentItemInput } from './docActions';
import QuickCreateProductModal from '@/components/QuickCreateProductModal';

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

interface BodegaOption {
  id: string;
  nombre: string;
  ubicaciones: Array<{ id: string; nombre: string }>;
}

interface ProveedorOption {
  id: string;
  rut: string;
  razonSocial: string;
}

interface Props {
  products: ProductOption[];
  bodegas: BodegaOption[];
  proveedores: ProveedorOption[];
  onSuccess?: () => void;
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function MovimientoComprasForm({ products, bodegas, proveedores, onSuccess }: Props) {
  const [productsList, setProductsList] = useState<ProductOption[]>(products);
  const [quickCreateModal, setQuickCreateModal] = useState<{
    isOpen: boolean;
    rowIdx: number;
    searchQuery: string;
  }>({ isOpen: false, rowIdx: -1, searchQuery: '' });

  const [categoria, setCategoria] = useState<'COMPRA' | 'OTRO'>('COMPRA');
  const [tipoDocumento, setTipoDocumento] = useState<'FACTURA' | 'GUIA_DESPACHO'>('FACTURA');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState(new Date().toISOString().split('T')[0]);

  // Proveedor
  const [rutProveedor, setRutProveedor] = useState('');
  const [razonSocialProveedor, setRazonSocialProveedor] = useState('');
  const [showProvDropdown, setShowProvDropdown] = useState(false);

  // Document-Level Settings (Specified ONCE for the entire document)
  const [headerBodegaId, setHeaderBodegaId] = useState(bodegas[0]?.id || '');
  const [headerUbicacionId, setHeaderUbicacionId] = useState(bodegas[0]?.ubicaciones[0]?.id || '');
  const [headerEsAfecto, setHeaderEsAfecto] = useState(true);   // true: 19% IVA, false: 0% Exento
  const [headerIncluyeIva, setHeaderIncluyeIva] = useState(true); // true: Con IVA Inc., false: Sin IVA (Neto)

  // Document Totals & Status
  const [montoTotal, setMontoTotal] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Multi-item Breakdown (Lightweight rows)
  const [items, setItems] = useState<Array<{
    key: string;
    productoId: string;
    searchQuery: string;
    cantidad: string;
    precioUnitario: string;
  }>>([
    {
      key: '1',
      productoId: '',
      searchQuery: '',
      cantidad: '1',
      precioUnitario: '0',
    }
  ]);

  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // When header Bodega changes, set default Ubicacion to first location of that bodega
  const handleHeaderBodegaChange = (newBodegaId: string) => {
    setHeaderBodegaId(newBodegaId);
    const selectedBod = bodegas.find(b => b.id === newBodegaId);
    if (selectedBod && selectedBod.ubicaciones.length > 0) {
      setHeaderUbicacionId(selectedBod.ubicaciones[0].id);
    } else {
      setHeaderUbicacionId('');
    }
  };

  // Auto-fill Razón Social if RUT matches existing provider
  useEffect(() => {
    const cleanRut = rutProveedor.trim().toUpperCase();
    const found = proveedores.find(p => p.rut.toUpperCase() === cleanRut);
    if (found) {
      setRazonSocialProveedor(found.razonSocial);
    }
  }, [rutProveedor, proveedores]);

  // Provider Autocomplete filter
  const filteredProveedores = rutProveedor.trim() === ''
    ? []
    : proveedores.filter(p =>
      removeAccents(p.rut).includes(removeAccents(rutProveedor)) ||
      removeAccents(p.razonSocial).includes(removeAccents(rutProveedor))
    ).slice(0, 5);

  // Helper calculations for line item subtotal using document-level tax settings
  // NOTA: Se preservan los decimales exactos por producto y se redondea ÚNICAMENTE la suma total del desglose.
  const calculateItemSubtotal = (item: typeof items[0]) => {
    const cant = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precioUnitario) || 0;

    if (cant <= 0 || precio <= 0) return 0;

    let subtotalFinal = cant * precio;
    // If entered price does NOT include IVA and document is Afecto (19%), add 19%
    if (headerEsAfecto && !headerIncluyeIva) {
      subtotalFinal = subtotalFinal * 1.19;
    }
    return subtotalFinal;
  };

  const totalCalculadoDesgloseExact = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const totalCalculadoDesglose = Math.round(totalCalculadoDesgloseExact);
  const montoDocumentoNum = Math.round(parseFloat(montoTotal) || 0);
  const diferenciaCuadre = montoDocumentoNum - totalCalculadoDesglose;
  const isDocumentoCuadrado = montoDocumentoNum > 0 && Math.abs(diferenciaCuadre) <= 1; // Permite tolerancia por redondeo de pesos (<= $1)

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        key: Date.now().toString(),
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '0',
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, fields: Partial<typeof items[0]>) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...fields };
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!numeroDocumento.trim()) {
      setStatus({ success: false, message: 'Por favor ingresa el número de documento.' });
      return;
    }

    if (!rutProveedor.trim()) {
      setStatus({ success: false, message: 'Por favor ingresa el RUT del proveedor.' });
      return;
    }

    if (!headerBodegaId) {
      setStatus({ success: false, message: 'Por favor selecciona la bodega de destino.' });
      return;
    }

    // Validate products
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productoId) {
        setStatus({ success: false, message: `El producto en la fila #${i + 1} no es válido o no ha sido seleccionado.` });
        return;
      }
      if ((parseInt(item.cantidad) || 0) <= 0) {
        setStatus({ success: false, message: `Ingresa una cantidad mayor a 0 en la fila #${i + 1}.` });
        return;
      }
    }

    // Validate that document total and rounded items sum square
    if (montoDocumentoNum > 0 && Math.abs(diferenciaCuadre) > 1) {
      const confirmSubmit = confirm(
        `Atención: El total ingresado del documento ($${montoDocumentoNum.toLocaleString('es-CL')}) no coincide con la suma redondeada de los productos ($${totalCalculadoDesglose.toLocaleString('es-CL')}).\n` +
        `Existe una diferencia de $${Math.abs(diferenciaCuadre).toLocaleString('es-CL')}.\n\n` +
        `¿Deseas registrar el documento de todas formas?`
      );
      if (!confirmSubmit) {
        setStatus({
          success: false,
          message: `El total del documento ($${montoDocumentoNum.toLocaleString('es-CL')}) no cuadra con el detalle ingresado ($${totalCalculadoDesglose.toLocaleString('es-CL')}). Revisa las cantidades o precios unitarios.`
        });
        return;
      }
    }

    setLoading(true);
    setStatus(null);

    const payloadItems: DocumentItemInput[] = items.map(item => ({
      productoId: item.productoId,
      cantidad: parseInt(item.cantidad) || 1,
      precioUnitario: parseFloat(item.precioUnitario) || 0,
      esAfecto: headerEsAfecto,
      incluyeIva: headerIncluyeIva,
      subtotal: calculateItemSubtotal(item),
      bodegaId: headerBodegaId,
      ubicacionId: headerUbicacionId,
    }));

    const res = await createDocumentoMovimiento({
      categoria,
      tipoDocumento,
      numeroDocumento: numeroDocumento.trim(),
      fechaDocumento,
      rutProveedor: rutProveedor.trim(),
      razonSocialProveedor: razonSocialProveedor.trim(),
      montoTotal: montoDocumentoNum,
      esRecepcionIncompleta: false,
      observaciones: observaciones.trim(),
      items: payloadItems,
    });

    setLoading(false);

    if (res.success) {
      setStatus({
        success: true,
        message: `Movimiento y documento #${numeroDocumento} registrado exitosamente.`
      });
      // Reset form
      setNumeroDocumento('');
      setMontoTotal('');
      setObservaciones('');
      setItems([{
        key: Date.now().toString(),
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '0',
      }]);
      if (onSuccess) onSuccess();
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  const selectedBodegaObj = bodegas.find(b => b.id === headerBodegaId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Document Header Info & General Settings */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>1. Datos del Documento Tributario & Destino General</span>
        </h3>

        {/* Row 1: Proveedor RUT & Razón Social (Asked First) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
          <div className="relative">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              RUT Proveedor *
            </label>
            <input
              type="text"
              required
              value={rutProveedor}
              onChange={(e) => {
                setRutProveedor(e.target.value);
                setShowProvDropdown(true);
              }}
              onFocus={() => setShowProvDropdown(true)}
              placeholder="Ej. 76.123.456-7"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />

            {/* Proveedor Autocomplete Dropdown */}
            {showProvDropdown && filteredProveedores.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {filteredProveedores.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setRutProveedor(p.rut);
                      setRazonSocialProveedor(p.razonSocial);
                      setShowProvDropdown(false);
                    }}
                    className="p-2.5 text-xs hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer font-medium text-slate-800 dark:text-slate-200 flex justify-between items-center"
                  >
                    <span className="font-bold text-teal-600 dark:text-teal-400">{p.rut}</span>
                    <span className="truncate text-slate-500 dark:text-slate-300 ml-2">{p.razonSocial}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Razón Social Proveedor
            </label>
            <input
              type="text"
              value={razonSocialProveedor}
              onChange={(e) => setRazonSocialProveedor(e.target.value)}
              placeholder="Nombre de la empresa o proveedor"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Row 2: Tipo Documento, Número, Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              {tipoDocumento === 'FACTURA' ? (
                <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              ) : (
                <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              )}
              <span>Tipo de Documento *</span>
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
            >
              <option value="FACTURA">Factura</option>
              <option value="GUIA_DESPACHO">Guía de Despacho</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              N° de {tipoDocumento === 'FACTURA' ? 'Factura' : 'Guía'} *
            </label>
            <input
              type="text"
              required
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej. 104582"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Fecha Emisión *
            </label>
            <input
              type="date"
              required
              value={fechaDocumento}
              onChange={(e) => setFechaDocumento(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Row 3: Destino General (Bodega de Destino General) */}
        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Warehouse className="h-3.5 w-3.5 text-teal-600" />
              <span>Bodega de Destino General *</span>
            </label>
            <select
              value={headerBodegaId}
              onChange={(e) => handleHeaderBodegaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
            >
              {bodegas.map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Tratamiento Tributario de Impuesto (Afecto/Exento & IVA Inc/Neto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Tratamiento de Impuesto del Documento *
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setHeaderEsAfecto(true)}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${headerEsAfecto
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                Afecto 19% IVA
              </button>
              <button
                type="button"
                onClick={() => setHeaderEsAfecto(false)}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${!headerEsAfecto
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                Exento 0% IVA
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Modo Precios Ingresados en Desglose *
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setHeaderIncluyeIva(true)}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${headerIncluyeIva
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                Con IVA Incluido
              </button>
              <button
                type="button"
                onClick={() => setHeaderIncluyeIva(false)}
                className={`py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${!headerIncluyeIva
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                Sin IVA (Neto)
              </button>
            </div>
          </div>
        </div>

        {/* Row 5: Monto Total del Documento */}
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Total del Documento ($ IVA Incluido) *
          </label>
          <input
            type="number"
            min="0"
            required
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            placeholder="Ej. 462256"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        {/* Dynamic Alert for Guía de Despacho */}
        {tipoDocumento === 'GUIA_DESPACHO' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Recepción por Guía de Despacho:</p>
              <p className="text-[11px] opacity-90">
                El documento quedará registrado como <span className="font-bold underline">Pendiente de Factura</span>. Podrás enganchar la Factura correspondiente cuando sea emitida por el proveedor.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Desglose Multi-Producto Table (Lightweight Streamlined Rows) */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>2. Desglose Rápido de Productos ({items.length})</span>
          </h3>
        </div>

        {/* Table breakdown */}
        <div className="space-y-3">
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
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Fila #{idx + 1}
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

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Product Search Input */}
                  <div className="md:col-span-6 relative">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Producto *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.searchQuery}
                        onChange={(e) => {
                          updateItemRow(idx, { searchQuery: e.target.value, productoId: '' });
                          setActiveItemSearchIndex(idx);
                        }}
                        onFocus={() => setActiveItemSearchIndex(idx)}
                        placeholder="Escribe código o nombre..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Autocomplete list for item */}
                    {activeItemSearchIndex === idx && (
                      <div className="absolute z-50 left-0 w-full min-w-[340px] sm:min-w-[480px] lg:min-w-[560px] max-w-[92vw] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                        {filteredItemProducts.length > 0 ? (
                          <>
                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredItemProducts.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    updateItemRow(idx, {
                                      productoId: p.id,
                                      searchQuery: `[${p.codigo}] ${p.nombre}`,
                                    });
                                    setActiveItemSearchIndex(null);
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
                                setActiveItemSearchIndex(null);
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
                              ⚠️ El producto "{rawQuery}" no existe en la base de datos.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickCreateModal({ isOpen: true, rowIdx: idx, searchQuery: rawQuery });
                                setActiveItemSearchIndex(null);
                              }}
                              className="w-full py-2 px-3 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active-scale-down cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Crear "{rawQuery}" en el Catálogo</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItemRow(idx, { cantidad: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Precio Unit. ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.precioUnitario}
                      onChange={(e) => updateItemRow(idx, { precioUnitario: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  {/* Subtotal Con IVA */}
                  <div className="md:col-span-2 text-right pt-2 md:pt-0">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Subtotal {headerEsAfecto ? 'con IVA' : 'Exento'}
                    </label>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono py-1.5">
                      ${itemSubtotal.toLocaleString('es-CL', {
                        minimumFractionDigits: itemSubtotal % 1 === 0 ? 0 : 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Button: + Agregar Producto (Bottom Right below Subtotal) */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={addItemRow}
            className="px-4 py-2 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#05b875]/20 active-scale-down transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Producto</span>
          </button>
        </div>

        {/* 4. Live Reconciliation Summary Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold gap-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Calculator className="h-4 w-4 text-teal-600" />
              <span>Total Documento: ${montoDocumentoNum.toLocaleString('es-CL')}</span>
            </div>

            <div className="flex flex-col sm:items-start text-slate-700 dark:text-slate-200">
              <span className="font-bold">
                Suma Desglose: ${totalCalculadoDesgloseExact.toLocaleString('es-CL', {
                  minimumFractionDigits: totalCalculadoDesgloseExact % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2
                })}
              </span>
              {totalCalculadoDesgloseExact % 1 !== 0 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  (Redondeado factura: ${totalCalculadoDesglose.toLocaleString('es-CL')})
                </span>
              )}
            </div>

            <div className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${isDocumentoCuadrado
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
              }`}>
              {isDocumentoCuadrado ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Documento Cuadrado</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Diferencia: ${Math.abs(diferenciaCuadre).toLocaleString('es-CL')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Feedback */}
      {status && (
        <div className={`p-4 text-xs font-bold rounded-2xl border ${status.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
          {status.message}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-[#05b875]/20 active-scale-down cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Procesando Documento de Movimiento...</span>
          </>
        ) : (
          <span>Registrar Movimiento y Documento</span>
        )}
      </button>

      {/* Quick Create Product Popup Modal */}
      <QuickCreateProductModal
        isOpen={quickCreateModal.isOpen}
        initialSearchQuery={quickCreateModal.searchQuery}
        onClose={() => setQuickCreateModal({ isOpen: false, rowIdx: -1, searchQuery: '' })}
        onProductCreated={(newProd) => {
          // Add to local product list options
          setProductsList(prev => [...prev, newProd]);
          // Auto select in row
          if (quickCreateModal.rowIdx >= 0) {
            updateItemRow(quickCreateModal.rowIdx, {
              productoId: newProd.id,
              searchQuery: `[${newProd.codigo}] ${newProd.nombre}`,
            });
          }
        }}
      />
    </form>
  );
}
