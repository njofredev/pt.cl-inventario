'use client';

import { useState, useEffect, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { createDocumentoMovimiento, DocumentItemInput } from './docActions';

interface ProductOption {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
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

interface ProveedorOption {
  id: string;
  rut: string;
  razonSocial: string;
}

interface Props {
  products: ProductOption[];
  bodegas: Bodega[];
  proveedores: ProveedorOption[];
  onSuccess?: () => void;
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function MovimientoComprasForm({ products, bodegas, proveedores, onSuccess }: Props) {
  const [categoria, setCategoria] = useState<'COMPRA' | 'OTRO'>('COMPRA');
  const [tipoDocumento, setTipoDocumento] = useState<'FACTURA' | 'GUIA_DESPACHO'>('FACTURA');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState(new Date().toISOString().split('T')[0]);
  
  // Proveedor
  const [rutProveedor, setRutProveedor] = useState('');
  const [razonSocialProveedor, setRazonSocialProveedor] = useState('');
  const [showProvDropdown, setShowProvDropdown] = useState(false);

  // Document Totals & Status
  const [montoTotal, setMontoTotal] = useState('');
  const [esRecepcionIncompleta, setEsRecepcionIncompleta] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  // Default Warehouse for easy selection
  const [defaultBodegaId, setDefaultBodegaId] = useState(bodegas[0]?.id || '');
  const [defaultUbicacionId, setDefaultUbicacionId] = useState(bodegas[0]?.ubicaciones[0]?.id || '');

  // Multi-item Breakdown
  const [items, setItems] = useState<Array<{
    key: string;
    productoId: string;
    searchQuery: string;
    cantidad: string;
    precioUnitario: string;
    esAfecto: boolean;    // true: 19%, false: 0% Exento
    incluyeIva: boolean;  // true: con IVA, false: sin IVA
    bodegaId: string;
    ubicacionId: string;
  }>>([
    {
      key: '1',
      productoId: '',
      searchQuery: '',
      cantidad: '1',
      precioUnitario: '0',
      esAfecto: true,
      incluyeIva: true,
      bodegaId: bodegas[0]?.id || '',
      ubicacionId: bodegas[0]?.ubicaciones[0]?.id || '',
    }
  ]);

  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

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

  // Helper calculations for line item subtotal
  const calculateItemSubtotal = (item: typeof items[0]) => {
    const cant = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precioUnitario) || 0;
    
    if (cant <= 0 || precio <= 0) return 0;

    let subtotalFinal = cant * precio;
    // If entered price does NOT include IVA and is Afecto (19%), add 19% to total
    if (item.esAfecto && !item.incluyeIva) {
      subtotalFinal = subtotalFinal * 1.19;
    }
    return Math.round(subtotalFinal);
  };

  const totalCalculadoDesglose = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const montoDocumentoNum = parseFloat(montoTotal) || 0;
  const diferenciaCuadre = montoDocumentoNum - totalCalculadoDesglose;

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        key: Date.now().toString(),
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '0',
        esAfecto: true,
        incluyeIva: true,
        bodegaId: defaultBodegaId || bodegas[0]?.id || '',
        ubicacionId: defaultUbicacionId || bodegas[0]?.ubicaciones[0]?.id || '',
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

    // Validate products
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productoId) {
        setStatus({ success: false, message: `El producto en la fila #${i + 1} no es válido.` });
        return;
      }
      if ((parseInt(item.cantidad) || 0) <= 0) {
        setStatus({ success: false, message: `Ingresa una cantidad mayor a 0 en la fila #${i + 1}.` });
        return;
      }
      if (!item.bodegaId || !item.ubicacionId) {
        setStatus({ success: false, message: `Selecciona bodega y ubicación para la fila #${i + 1}.` });
        return;
      }
    }

    setLoading(true);
    setStatus(null);

    const payloadItems: DocumentItemInput[] = items.map(item => ({
      productoId: item.productoId,
      cantidad: parseInt(item.cantidad) || 1,
      precioUnitario: parseFloat(item.precioUnitario) || 0,
      esAfecto: item.esAfecto,
      incluyeIva: item.incluyeIva,
      subtotal: calculateItemSubtotal(item),
      bodegaId: item.bodegaId,
      ubicacionId: item.ubicacionId,
    }));

    const res = await createDocumentoMovimiento({
      categoria,
      tipoDocumento,
      numeroDocumento: numeroDocumento.trim(),
      fechaDocumento,
      rutProveedor: rutProveedor.trim(),
      razonSocialProveedor: razonSocialProveedor.trim(),
      montoTotal: montoDocumentoNum,
      esRecepcionIncompleta,
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
      setEsRecepcionIncompleta(false);
      setItems([{
        key: Date.now().toString(),
        productoId: '',
        searchQuery: '',
        cantidad: '1',
        precioUnitario: '0',
        esAfecto: true,
        incluyeIva: true,
        bodegaId: defaultBodegaId || bodegas[0]?.id || '',
        ubicacionId: defaultUbicacionId || bodegas[0]?.ubicaciones[0]?.id || '',
      }]);
      if (onSuccess) onSuccess();
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Categoría Selector */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setCategoria('COMPRA')}
          className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            categoria === 'COMPRA'
              ? 'bg-[#05b875] text-white shadow-md shadow-[#05b875]/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Ingreso por Compras</span>
        </button>
        
        <button
          type="button"
          onClick={() => setCategoria('OTRO')}
          className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            categoria === 'OTRO'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
          }`}
        >
          <ReceiptText className="h-4 w-4" />
          <span>Otro Tipo (Ajuste / Donación)</span>
        </button>
      </div>

      {/* 2. Document Header Info */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>1. Datos del Documento Tributario</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tipo Documento */}
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

          {/* Número Documento */}
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

          {/* Fecha Documento */}
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

        {/* Proveedor RUT & Razón Social */}
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

        {/* Monto Total & Checkbox de Recepción Incompleta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
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
              placeholder="Ej. 150000"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-extrabold focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                ¿Recepción Incompleta / Faltantes?
              </span>
              <span className="text-[10px] text-slate-400 block">
                {tipoDocumento === 'GUIA_DESPACHO' 
                  ? 'Permite recepcionar parcial y enganchar luego.' 
                  : 'Genera aviso de Nota de Crédito por cobrar/recibir.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={esRecepcionIncompleta}
              onChange={(e) => setEsRecepcionIncompleta(e.target.checked)}
              className="h-4 w-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Alerts based on Document Type & Rules */}
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

        {tipoDocumento === 'FACTURA' && esRecepcionIncompleta && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">Alerta de Nota de Crédito Requerida:</p>
              <p className="text-[11px] opacity-90">
                Al indicar recepción incompleta sobre una Factura emitida, el sistema marcará este documento como <span className="font-bold underline">Requiere Nota de Crédito</span> por el valor de los productos faltantes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Desglose Multi-Producto Table */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>2. Desglose de Productos ({items.length})</span>
          </h3>

          <button
            type="button"
            onClick={addItemRow}
            className="px-3 py-1.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active-scale-down transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Producto</span>
          </button>
        </div>

        {/* Table breakdown */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const itemSubtotal = calculateItemSubtotal(item);
            const filteredItemProducts = item.searchQuery.trim() === ''
              ? []
              : products.filter(p =>
                  removeAccents(p.nombre).includes(removeAccents(item.searchQuery)) ||
                  removeAccents(p.codigo).includes(removeAccents(item.searchQuery))
                ).slice(0, 6);

            return (
              <div 
                key={item.key}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
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

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Product Search Input */}
                  <div className="md:col-span-5 relative">
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
                    {activeItemSearchIndex === idx && filteredItemProducts.length > 0 && (
                      <div className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
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
                            className="p-2.5 text-xs hover:bg-teal-50 dark:hover:bg-slate-700 cursor-pointer font-medium text-slate-800 dark:text-slate-200 flex justify-between items-center"
                          >
                            <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">[{p.codigo}]</span>
                            <span className="truncate text-slate-700 dark:text-slate-200 ml-2 font-bold">{p.nombre}</span>
                          </div>
                        ))}
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

                  {/* Subtotal Línea */}
                  <div className="md:col-span-3 text-right">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Subtotal Con IVA
                    </label>
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
                      ${itemSubtotal.toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>

                {/* Line Item Options: IVA & Warehouse */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {/* IVA Affect vs Exento */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Impuesto:</span>
                    <button
                      type="button"
                      onClick={() => updateItemRow(idx, { esAfecto: !item.esAfecto })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                        item.esAfecto
                          ? 'bg-teal-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {item.esAfecto ? 'Afecto (19% IVA)' : 'Exento (0%)'}
                    </button>
                  </div>

                  {/* Prices Include IVA Toggle */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Precio unitario es:</span>
                    <button
                      type="button"
                      onClick={() => updateItemRow(idx, { incluyeIva: !item.incluyeIva })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                        item.incluyeIva
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {item.incluyeIva ? 'Con IVA Inc.' : 'Sin IVA (Neto)'}
                    </button>
                  </div>

                  {/* Destination Warehouse */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <select
                      value={item.bodegaId}
                      onChange={(e) => {
                        const newBodegaId = e.target.value;
                        const b = bodegas.find(b => b.id === newBodegaId);
                        updateItemRow(idx, { 
                          bodegaId: newBodegaId, 
                          ubicacionId: b?.ubicaciones[0]?.id || '' 
                        });
                      }}
                      className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 outline-none"
                    >
                      {bodegas.map(b => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800">{b.nombre}</option>
                      ))}
                    </select>

                    <select
                      value={item.ubicacionId}
                      onChange={(e) => updateItemRow(idx, { ubicacionId: e.target.value })}
                      className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 outline-none"
                    >
                      {(bodegas.find(b => b.id === item.bodegaId)?.ubicaciones || []).map(u => (
                        <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800">{u.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Live Reconciliation Summary Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold gap-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Calculator className="h-4 w-4 text-teal-600" />
              <span>Total Documento: ${montoDocumentoNum.toLocaleString('es-CL')}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span>Suma Desglose: ${totalCalculadoDesglose.toLocaleString('es-CL')}</span>
            </div>

            <div className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              diferenciaCuadre === 0 && montoDocumentoNum > 0
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
            }`}>
              {diferenciaCuadre === 0 && montoDocumentoNum > 0 ? (
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
        <div className={`p-4 text-xs font-bold rounded-2xl border ${
          status.success 
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
    </form>
  );
}
