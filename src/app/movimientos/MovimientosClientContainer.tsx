'use client';

import { useState } from 'react';
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
  defaultTipo: string;
}

export default function MovimientosClientContainer({
  products,
  bodegas,
  proveedores,
  movements,
  documentosPendientes,
  defaultTipo,
}: Props) {
  const [activeTab, setActiveTab] = useState<'COMPRAS' | 'INGRESO_DIRECTO' | 'EGRESO_DIRECTO' | 'PENDIENTES'>('COMPRAS');

  const guiasPendientesCount = documentosPendientes.filter(d => d.tipoDocumento === 'GUIA_DESPACHO' && d.estadoConciliacion === 'PENDIENTE_FACTURA').length;
  const facturasNotaCreditoCount = documentosPendientes.filter(d => d.tipoDocumento === 'FACTURA' && d.estadoConciliacion === 'REQUIERE_NOTA_CREDITO').length;
  const totalAlertasCount = guiasPendientesCount + facturasNotaCreditoCount;

  return (
    <div className="space-y-6">
      {/* Top Tabs Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('COMPRAS')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'COMPRAS'
                ? 'bg-[#05b875] text-white shadow-md shadow-[#05b875]/25'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Ingreso por Compras & Documentos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INGRESO_DIRECTO')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'INGRESO_DIRECTO'
                ? 'bg-[#227262] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Ingreso Directo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EGRESO_DIRECTO')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'EGRESO_DIRECTO'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Minus className="h-4 w-4" />
            <span>Egreso Directo (Consumo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDIENTES')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'PENDIENTES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Recepciones & Guías Pendientes</span>
            {totalAlertasCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full">
                {totalAlertasCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Section */}
        <div className="lg:col-span-8 space-y-6">
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
        </div>

        {/* Right Section: Bitácora & Histórico Reciente */}
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
      </div>
    </div>
  );
}
