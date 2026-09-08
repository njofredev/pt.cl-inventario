'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, ReceiptText, Clock, MapPin, Layers, History, Plus, Minus, Search, Tag, ArrowDownLeft, ArrowUpRight, Calendar, Receipt, FileCheck2 } from 'lucide-react';
import MovimientoComprasForm from './MovimientoComprasForm';
import MovimientoForm from './MovimientoForm';
import RecepcionesPendientesList from './RecepcionesPendientesList';
import UltimosIngresosFacturasList from './UltimosIngresosFacturasList';

interface Props {
  products: any[];
  bodegas: any[];
  proveedores: any[];
  destinos?: any[];
  consumidores?: any[];
  movements: any[];
  documentosPendientes: any[];
  defaultTab?: string;
}

export default function MovimientosClientContainer({
  products,
  bodegas,
  proveedores,
  destinos = [],
  consumidores = [],
  movements,
  documentosPendientes,
  defaultTab = 'COMPRAS',
}: Props) {
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get('tab') || searchParams?.get('tipo');

  const resolveTab = (val?: string | null) => {
    if (val === 'EGRESO_DIRECTO' || val === 'EGRESO') return 'EGRESO_DIRECTO';
    if (val === 'INGRESO_DIRECTO') return 'INGRESO_DIRECTO';
    if (val === 'PENDIENTES') return 'PENDIENTES';
    if (val === 'HISTORIAL') return 'HISTORIAL';
    return 'COMPRAS';
  };

  const [activeTab, setActiveTab] = useState<'COMPRAS' | 'INGRESO_DIRECTO' | 'EGRESO_DIRECTO' | 'PENDIENTES' | 'HISTORIAL'>(() => {
    return resolveTab(queryTab || defaultTab);
  });

  // Bitácora view toggle: individual movements vs complete invoices
  const [historialView, setHistorialView] = useState<'MOVIMIENTOS' | 'FACTURAS_COMPLETAS'>('MOVIMIENTOS');

  // Bitácora filtering states
  const [historialFilter, setHistorialFilter] = useState<'TODOS' | 'ENTRADAS' | 'SALIDAS'>('TODOS');
  const [searchBitacora, setSearchBitacora] = useState('');
  const [bodegaFilter, setBodegaFilter] = useState('TODAS');

  // Keep state in sync if URL query parameter changes via Sidebar clicks
  useEffect(() => {
    if (queryTab) {
      setActiveTab(resolveTab(queryTab));
    } else if (defaultTab) {
      setActiveTab(resolveTab(defaultTab));
    }
  }, [queryTab, defaultTab]);

  const guiasPendientesCount = documentosPendientes.filter(d => d.tipoDocumento === 'GUIA_DESPACHO' && d.estadoConciliacion === 'PENDIENTE_FACTURA').length;
  const facturasNotaCreditoCount = documentosPendientes.filter(d => d.tipoDocumento === 'FACTURA' && d.estadoConciliacion === 'REQUIERE_NOTA_CREDITO').length;
  const totalAlertasCount = guiasPendientesCount + facturasNotaCreditoCount;

  // Bitacora counts and filtered list
  const totalEntradas = movements.filter(m => m.tipoMovimiento.esEntrada).length;
  const totalSalidas = movements.filter(m => !m.tipoMovimiento.esEntrada).length;

  const filteredMovements = movements.filter(m => {
    // 1. Tipo filter
    if (historialFilter === 'ENTRADAS' && !m.tipoMovimiento.esEntrada) return false;
    if (historialFilter === 'SALIDAS' && m.tipoMovimiento.esEntrada) return false;

    // 2. Bodega filter
    if (bodegaFilter !== 'TODAS' && m.bodegaId !== bodegaFilter) return false;

    // 3. Search query filter (producto, codigo, correlativo, receptor, doc)
    if (searchBitacora.trim()) {
      const q = searchBitacora.toLowerCase();
      const matchName = m.product?.nombre?.toLowerCase().includes(q);
      const matchCode = m.product?.codigo?.toLowerCase().includes(q);
      const matchCorrelativo = m.documentoNumero?.toLowerCase().includes(q);
      const matchDocTipo = m.documentoTipo?.toLowerCase().includes(q);
      const matchReceptor = m.recibidoPor?.toLowerCase().includes(q);
      const matchBodega = m.bodega?.nombre?.toLowerCase().includes(q);
      const matchUser = m.usuario?.nombre?.toLowerCase().includes(q);

      if (!matchName && !matchCode && !matchCorrelativo && !matchDocTipo && !matchReceptor && !matchBodega && !matchUser) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Visual Operational Bar dedicada: Exclusiva para ENTRADAS o para SALIDAS */}
      {activeTab !== 'HISTORIAL' && (
        <>
          {/* Si estamos en ENTRADAS (COMPRAS o INGRESO_DIRECTO) */}
          {(activeTab === 'COMPRAS' || activeTab === 'INGRESO_DIRECTO' || activeTab === 'PENDIENTES') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Pilar 1: RECEPCIÓN & COMPRAS / AJUSTE DE ENTRADA */}
              <div 
                onClick={() => setActiveTab(activeTab === 'INGRESO_DIRECTO' ? 'INGRESO_DIRECTO' : 'COMPRAS')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'COMPRAS' || activeTab === 'INGRESO_DIRECTO'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${
                    activeTab === 'COMPRAS' || activeTab === 'INGRESO_DIRECTO'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  }`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Aumenta Stock (+)
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Recepción & Compras
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveTab('COMPRAS'); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'COMPRAS'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title="Facturas y Guías de Proveedores"
                  >
                    Factura / Guía
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveTab('INGRESO_DIRECTO'); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'INGRESO_DIRECTO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title="Ajuste manual de entrada"
                  >
                    Ajuste Directo
                  </button>
                </div>
              </div>

              {/* Pilar 2: CONTROL Y CONCILIACIÓN (Guías Pendientes) */}
              <div 
                onClick={() => setActiveTab('PENDIENTES')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === 'PENDIENTES'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${
                    activeTab === 'PENDIENTES'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Control & Conciliación
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Guías Pendientes
                    </h3>
                  </div>
                </div>

                {totalAlertasCount > 0 ? (
                  <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {totalAlertasCount} por facturar
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    Al día
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Si estamos en SALIDAS (EGRESO_DIRECTO) */}
          {activeTab === 'EGRESO_DIRECTO' && (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3.5">
              <div 
                className="p-4 rounded-2xl border bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 shadow-md shadow-amber-500/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                    <Minus className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Descuenta Stock (-)
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Salida / Consumo Clínico
                    </h3>
                  </div>
                </div>

                <span className="px-3.5 py-1 text-xs font-black rounded-lg bg-amber-600 text-white shadow-xs">
                  Egreso Directo
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Section */}
        <div className={`${activeTab === 'HISTORIAL' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {activeTab === 'COMPRAS' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Registro de Ingreso por Compras (Facturas & Guías de Despacho)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingresa RUT del proveedor, tipo de documento, montos totales y el desglose de productos con IVA afecto o exento.
                </p>
              </div>

              <MovimientoComprasForm
                products={products}
                bodegas={bodegas}
                proveedores={proveedores}
              />
            </div>
          )}

          {activeTab === 'INGRESO_DIRECTO' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Ingreso Directo Rápido (Ajuste de Inventario)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registra entradas directas de stock por ajuste de inventario sin documento tributario.
                </p>
              </div>

              <MovimientoForm
                products={products}
                bodegas={bodegas}
                destinos={destinos}
                defaultTipo="INGRESO"
                forceEsEntrada={true}
              />
            </div>
          )}

          {activeTab === 'EGRESO_DIRECTO' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Egreso Directo de Stock (Consumo Clínico / Ajuste)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registra salidas directas de stock por consumo interno, asignación a Box/Servicio o mermas con generación de identificador correlativo.
                </p>
              </div>

              <MovimientoForm
                products={products}
                bodegas={bodegas}
                destinos={destinos}
                consumidores={consumidores}
                defaultTipo="EGRESO"
                forceEsEntrada={false}
              />
            </div>
          )}

          {activeTab === 'PENDIENTES' && (
            <RecepcionesPendientesList
              documentosPendientes={documentosPendientes}
            />
          )}

          {activeTab === 'HISTORIAL' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              {/* Header Principal de la Bitácora */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-teal-600" />
                    Histórico y Bitácora de Movimientos
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {historialView === 'MOVIMIENTOS'
                      ? "Auditoría cronológica por producto individual con identificadores correlativos (N° SAL- / ING-)."
                      : "Visualización íntegra de facturas y guías ingresadas con su detalle completo de productos desglosados."}
                  </p>
                </div>

                {/* Selector de Sub-pestañas: Movimientos vs Facturas Completas */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistorialView('MOVIMIENTOS')}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      historialView === 'MOVIMIENTOS'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-teal-600" />
                    <span>Movimientos por Producto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistorialView('FACTURAS_COMPLETAS')}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      historialView === 'FACTURAS_COMPLETAS'
                        ? 'bg-[#227262] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Facturas & Guías Completas ({documentosPendientes.length})</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: FACTURAS & GUÍAS COMPLETAS INGRESADAS */}
              {historialView === 'FACTURAS_COMPLETAS' && (
                <UltimosIngresosFacturasList documentos={documentosPendientes} />
              )}

              {/* VISTA 2: MOVIMIENTOS POR PRODUCTO INDIVIDUAL */}
              {historialView === 'MOVIMIENTOS' && (
                <div className="space-y-4">
                  {/* Filtro Rápido Tipo (Todos / Entradas / Salidas) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Filtrar flujo de movimientos:
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                      <button
                        onClick={() => setHistorialFilter('TODOS')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          historialFilter === 'TODOS'
                            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        Todos ({movements.length})
                      </button>
                      <button
                        onClick={() => setHistorialFilter('ENTRADAS')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          historialFilter === 'ENTRADAS'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <ArrowDownLeft className="h-3 w-3" /> Entradas (+{totalEntradas})
                      </button>
                      <button
                        onClick={() => setHistorialFilter('SALIDAS')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          historialFilter === 'SALIDAS'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        <ArrowUpRight className="h-3 w-3" /> Salidas (-{totalSalidas})
                      </button>
                    </div>
                  </div>

              {/* Barra de Filtro y Búsqueda */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchBitacora}
                    onChange={(e) => setSearchBitacora(e.target.value)}
                    placeholder="Buscar por producto, código, correlativo (N° SAL-... / ING-...), documento o personal..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  {searchBitacora && (
                    <button
                      onClick={() => setSearchBitacora('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {bodegas.length > 1 && (
                  <select
                    value={bodegaFilter}
                    onChange={(e) => setBodegaFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium shrink-0"
                  >
                    <option value="TODAS">Todas las Bodegas</option>
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                )}
              </div>

              {filteredMovements.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <History className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No se encontraron movimientos con los filtros aplicados.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Prueba cambiando el criterio de búsqueda o seleccionando "Todos".
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
                  {filteredMovements.map((t) => {
                    const isEntrada = t.tipoMovimiento.esEntrada;
                    const correlativo = t.documentoNumero || (t.id ? `#${t.id.slice(-6).toUpperCase()}` : 'S/N');
                    const isSystemCorrelative = t.documentoNumero && (t.documentoNumero.startsWith('SAL-') || t.documentoNumero.startsWith('ING-'));

                    return (
                      <div 
                        key={t.id}
                        className="py-3 px-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Badge Correlativo */}
                            <span className={`inline-flex items-center gap-1 font-mono text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-md ${
                              isEntrada 
                                ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70' 
                                : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70'
                            }`}>
                              <Tag className="h-2.5 w-2.5" />
                              {correlativo}
                            </span>

                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {t.product.nombre}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400">
                              ({t.product.codigo})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400">
                            <span className="font-medium text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                              {new Date(t.fecha).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>

                            {t.documentoTipo && !isSystemCorrelative && (
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {t.documentoTipo} N° {t.documentoNumero}
                              </span>
                            )}

                            {t.bodega && (
                              <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
                                <MapPin className="h-3 w-3 shrink-0" /> {t.bodega.nombre} {t.ubicacion && `(${t.ubicacion.nombre})`}
                              </span>
                            )}

                            {t.recibidoPor && (
                              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                Destino: <strong className="font-bold">{t.recibidoPor}</strong>
                              </span>
                            )}

                            {t.usuario?.nombre && (
                              <span className="text-slate-400 text-[9.5px]">
                                Por: {t.usuario.nombre}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cantidad Flotante */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pl-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black border ${
                            isEntrada 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {isEntrada ? '+' : '-'} {t.cantidad} {t.product.unidad || 'Unid.'}
                          </span>
                          <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                            {t.tipoMovimiento.nombre || (isEntrada ? 'Entrada' : 'Salida')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </div>
          )}
        </div>

        {/* Right Section: Bitácora & Histórico Reciente (Visible en operaciones de registro) */}
        {activeTab !== 'HISTORIAL' && (
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Histórico Reciente
                </h2>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                Últimos 15
              </span>
            </div>

            <div className="overflow-hidden">
              {movements.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                  No se han registrado movimientos de inventario todavía.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[620px] overflow-y-auto pr-1 hide-scrollbar space-y-1">
                  {movements.map((t) => (
                    <div 
                      key={t.id}
                      className="py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {t.product.nombre}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold border shrink-0 ${
                          t.tipoMovimiento.esEntrada 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        }`}>
                          {t.tipoMovimiento.esEntrada ? '+' : '-'} {t.cantidad}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Fecha del movimiento */}
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                          <Calendar className="h-2.5 w-2.5 text-slate-400" />
                          {new Date(t.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>

                        {t.documentoNumero && (
                          <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                            {t.documentoNumero}
                          </span>
                        )}
                        <span className="font-mono text-[9.5px] text-slate-400">
                          {t.product.codigo}
                        </span>
                        {t.recibidoPor && (
                          <span className="text-[9.5px] text-teal-600 dark:text-teal-400 font-medium truncate max-w-[130px]">
                            • {t.recibidoPor}
                          </span>
                        )}
                      </div>

                      {t.bodega && t.ubicacion && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400 shrink-0" /> {t.bodega.nombre} ({t.ubicacion.nombre})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
