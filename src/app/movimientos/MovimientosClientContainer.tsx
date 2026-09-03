'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, ReceiptText, Clock, MapPin, Layers, History, Plus, Minus } from 'lucide-react';
import MovimientoComprasForm from './MovimientoComprasForm';
import MovimientoForm from './MovimientoForm';
import RecepcionesPendientesList from './RecepcionesPendientesList';

interface Props {
  products: any[];
  bodegas: any[];
  proveedores: any[];
  movements: any[];
  documentosPendientes: any[];
  defaultTab?: string;
}

export default function MovimientosClientContainer({
  products,
  bodegas,
  proveedores,
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

  return (
    <div className="space-y-6">
      {/* Visual Operational Bar (Entradas vs Salidas vs Gestión) - Visible en Compras/Ingresos/Egresos/Pendientes */}
      {activeTab !== 'HISTORIAL' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Pilar 1: ENTRADAS DE STOCK */}
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

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveTab('COMPRAS'); }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
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
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
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

        {/* Pilar 2: SALIDAS DE STOCK */}
        <div 
          onClick={() => setActiveTab('EGRESO_DIRECTO')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'EGRESO_DIRECTO'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl ${
              activeTab === 'EGRESO_DIRECTO'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
            }`}>
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

          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
            activeTab === 'EGRESO_DIRECTO' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}>
            Despacho
          </span>
        </div>

        {/* Pilar 3: PENDIENTES & AUDITORÍA */}
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
            <span className="text-[11px] text-slate-400 font-medium">Al día</span>
          )}
        </div>
      </div>
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
                defaultTipo="INGRESO"
                forceEsEntrada={true}
              />
            </div>
          )}

          {activeTab === 'EGRESO_DIRECTO' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Egreso Directo de Stock (Consumo / Ajuste)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registra salidas directas de stock por consumo interno, rotura o ajustes negativos.
                </p>
              </div>

              <MovimientoForm
                products={products}
                bodegas={bodegas}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <History className="h-4 w-4 text-teal-600" />
                    Bitácora de Movimientos Registrados
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Historial cronológico de entradas y salidas registradas en las bodegas autorizadas.
                  </p>
                </div>
              </div>

              {movements.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
                  No hay movimientos registrados actualmente.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {movements.map((t) => (
                    <div 
                      key={t.id}
                      className="py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {t.product.nombre}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({t.product.codigo})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>{new Date(t.fecha).toLocaleDateString('es-CL')}</span>
                          {t.documentoTipo && (
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {t.documentoTipo} N° {t.documentoNumero || 'S/N'}
                            </span>
                          )}
                          {t.bodega && (
                            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {t.bodega.nombre} {t.ubicacion && `(${t.ubicacion.nombre})`}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border shrink-0 ${
                        t.tipoMovimiento.esEntrada 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      }`}>
                        {t.tipoMovimiento.esEntrada ? '+' : '-'} {t.cantidad}
                      </span>
                    </div>
                  ))}
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

                      <p className="text-[10px] text-slate-400">
                        Código: <span className="font-mono text-slate-600 dark:text-slate-300">{t.product.codigo}</span>
                        {t.documentoTipo && ` | ${t.documentoTipo} N° ${t.documentoNumero || ''}`}
                      </p>

                      {t.bodega && t.ubicacion && (
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> {t.bodega.nombre} ({t.ubicacion.nombre})
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
