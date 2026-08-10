'use client';

import { useState } from 'react';
import { 
  FileText, 
  Link2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  X, 
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { engancharFacturaAGuia } from './docActions';

interface Documento {
  id: string;
  categoria: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaDocumento: string;
  montoTotal: number;
  estadoConciliacion: string;
  facturaEnganchadaNumero?: string | null;
  facturaEnganchadaFecha?: string | null;
  esRecepcionIncompleta: boolean;
  observaciones?: string | null;
  proveedor?: {
    rut: string;
    razonSocial: string;
  } | null;
  items: Array<{
    id: string;
    cantidad: number;
    subtotal: number;
    producto: {
      codigo: string;
      nombre: string;
    };
  }>;
}

interface Props {
  documentosPendientes: Documento[];
}

export default function RecepcionesPendientesList({ documentosPendientes }: Props) {
  const [selectedGuia, setSelectedGuia] = useState<Documento | null>(null);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const guiasPendientes = documentosPendientes.filter(d => d.tipoDocumento === 'GUIA_DESPACHO' && d.estadoConciliacion === 'PENDIENTE_FACTURA');
  const facturasNotaCredito = documentosPendientes.filter(d => d.tipoDocumento === 'FACTURA' && d.estadoConciliacion === 'REQUIERE_NOTA_CREDITO');

  async function handleEngancharSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGuia) return;
    if (!numeroFactura.trim()) {
      setError('El número de factura es obligatorio.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await engancharFacturaAGuia(selectedGuia.id, numeroFactura.trim(), fechaFactura);
    setLoading(false);

    if (res.success) {
      setSelectedGuia(null);
      setNumeroFactura('');
    } else {
      setError(res.error || 'Error al enganchar factura.');
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Recepciones Pendientes de Enganche (Guías de Despacho sin Factura) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Recepciones Pendientes de Enganche a Factura ({guiasPendientes.length})
            </h2>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Guías sin Factura
          </span>
        </div>

        {guiasPendientes.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center font-medium">
            ✨ No hay Guías de Despacho pendientes por enganchar a Factura.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guiasPendientes.map((doc) => (
              <div 
                key={doc.id}
                className="p-4 rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md uppercase">
                      Guía N° {doc.numeroDocumento}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {doc.proveedor?.razonSocial || 'Proveedor no especificado'}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      RUT: {doc.proveedor?.rut || 'N/A'} | Fecha: {new Date(doc.fechaDocumento).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    ${doc.montoTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-amber-200/40 dark:border-amber-900/40">
                  <p className="font-extrabold text-slate-700 dark:text-slate-300">Ítems Recepcionados:</p>
                  {doc.items.map(item => (
                    <p key={item.id} className="truncate">
                      • {item.cantidad}x <span className="font-semibold">{item.producto.nombre}</span> (${item.subtotal.toLocaleString('es-CL')})
                    </p>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGuia(doc)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active-scale-down transition-colors cursor-pointer"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Enganchar Factura Correspondiente</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Facturas con Nota de Crédito Pendiente */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Facturas con Nota de Crédito Pendiente ({facturasNotaCredito.length})
            </h2>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Faltantes / Conciliación
          </span>
        </div>

        {facturasNotaCredito.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center font-medium">
            ✨ No hay Facturas con recepción incompleta ni notas de crédito pendientes.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {facturasNotaCredito.map((doc) => (
              <div 
                key={doc.id}
                className="p-4 rounded-2xl border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-md uppercase">
                      Factura N° {doc.numeroDocumento}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {doc.proveedor?.razonSocial || 'Proveedor no especificado'}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      RUT: {doc.proveedor?.rut || 'N/A'} | Fecha: {new Date(doc.fechaDocumento).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    ${doc.montoTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200/50 text-[11px] text-rose-800 dark:text-rose-300 font-semibold space-y-1">
                  <p className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Requiere Nota de Crédito por Faltantes</span>
                  </p>
                  {doc.observaciones && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">
                      Obs: {doc.observaciones}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal para Enganchar Factura a Guía */}
      {selectedGuia && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Enganchar Factura a Guía N° {selectedGuia.numeroDocumento}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuia(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEngancharSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  Proveedor: {selectedGuia.proveedor?.razonSocial} ({selectedGuia.proveedor?.rut})
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Total Recepcionado por Guía: <span className="font-black">${selectedGuia.montoTotal.toLocaleString('es-CL')}</span>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Número de Factura Emitida *
                </label>
                <input
                  type="text"
                  required
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej. FACT-98451"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Fecha de la Factura *
                </label>
                <input
                  type="date"
                  required
                  value={fechaFactura}
                  onChange={(e) => setFechaFactura(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {error && (
                <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGuia(null)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Confirmar Enganche</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
