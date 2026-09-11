'use client';

import { useState } from 'react';
import { 
  Receipt, 
  FileText, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Warehouse,
  Tag
} from 'lucide-react';

export interface DocumentoIngreso {
  id: string;
  categoria: string;
  tipoDocumento: string; // 'FACTURA' | 'GUIA_DESPACHO'
  numeroDocumento: string;
  fechaDocumento: string;
  montoTotal: number;
  estadoConciliacion: string;
  esRecepcionIncompleta: boolean;
  observaciones?: string | null;
  createdAt: string;
  proveedor?: {
    rut: string;
    razonSocial: string;
  } | null;
  items: Array<{
    id: string;
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
  movimientos?: Array<{
    id: string;
    bodega?: {
      id: string;
      nombre: string;
    } | null;
    ubicacion?: {
      id: string;
      nombre: string;
    } | null;
    usuario?: {
      nombre: string;
    } | null;
  }>;
}

interface Props {
  documentos: DocumentoIngreso[];
}

const ITEMS_PER_PAGE = 5;

export default function UltimosIngresosFacturasList({ documentos }: Props) {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'FACTURA' | 'GUIA_DESPACHO'>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter documents
  const filteredDocs = documentos.filter((doc) => {
    // Tipo filter
    if (tipoFilter !== 'TODOS' && doc.tipoDocumento !== tipoFilter) return false;

    // Search query filter (numeroDocumento, proveedor RUT, razonSocial, o nombre de producto dentro del desglose)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDocNum = doc.numeroDocumento.toLowerCase().includes(q);
      const matchRut = doc.proveedor?.rut?.toLowerCase().includes(q);
      const matchRazon = doc.proveedor?.razonSocial?.toLowerCase().includes(q);
      const matchItem = doc.items.some(it => 
        it.producto?.nombre?.toLowerCase().includes(q) || 
        it.producto?.codigo?.toLowerCase().includes(q)
      );

      if (!matchDocNum && !matchRut && !matchRazon && !matchItem) {
        return false;
      }
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleExpand = (docId: string) => {
    setExpandedDocId(prev => prev === docId ? null : docId);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por N° factura/guía, proveedor o producto incluido en el desglose..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tipo Filter */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tipoFilter === 'TODOS'
                ? 'bg-[#227262] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Todos ({documentos.length})
          </button>
          <button
            type="button"
            onClick={() => { setTipoFilter('FACTURA'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tipoFilter === 'FACTURA'
                ? 'bg-[#227262] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Facturas ({documentos.filter(d => d.tipoDocumento === 'FACTURA').length})
          </button>
          <button
            type="button"
            onClick={() => { setTipoFilter('GUIA_DESPACHO'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tipoFilter === 'GUIA_DESPACHO'
                ? 'bg-[#227262] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Guías ({documentos.filter(d => d.tipoDocumento === 'GUIA_DESPACHO').length})
          </button>
        </div>
      </div>

      {/* Document List */}
      {paginatedDocs.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No se encontraron facturas o ingresos registrados
          </h3>
          <p className="text-xs text-slate-400">
            Los documentos de compras comerciales ingresados por el formulario aparecerán aquí con su detalle completo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedDocs.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const isFactura = doc.tipoDocumento === 'FACTURA';
            const totalUnits = doc.items.reduce((acc, it) => acc + it.cantidad, 0);
            const sumSubtotalesExact = doc.items.reduce((acc, it) => acc + it.subtotal, 0);
            const sumSubtotalesRedondeado = Math.round(sumSubtotalesExact);
            const sumPrecioUnitario = doc.items.reduce((acc, it) => acc + it.precioUnitario, 0);
            const sumUnitarioBruto = doc.items.reduce((acc, it) => {
              const unitBruto = it.cantidad > 0 ? it.subtotal / it.cantidad : (it.esAfecto ? it.precioUnitario * 1.19 : it.precioUnitario);
              return acc + unitBruto;
            }, 0);
            const bodegaDestino = doc.movimientos?.[0]?.bodega?.nombre || 'Bodega Principal';
            const usuarioOperador = doc.movimientos?.[0]?.usuario?.nombre || 'Operador';

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Card Row */}
                <div 
                  onClick={() => toggleExpand(doc.id)}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isFactura 
                        ? 'bg-teal-500/10 text-[#227262] dark:text-teal-400 border border-teal-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      <Receipt className="h-5 w-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9.5px] font-black rounded-md uppercase tracking-wide border ${
                          isFactura
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-[#227262] dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}>
                          {doc.tipoDocumento === 'FACTURA' ? 'FACTURA' : 'GUÍA DE DESPACHO'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                          N° {doc.numeroDocumento}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {doc.items.length} {doc.items.length === 1 ? 'producto distinto' : 'productos distintos'} ({totalUnits} unidades)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{doc.proveedor?.razonSocial || 'Proveedor'}</span>
                          {doc.proveedor?.rut && (
                            <span className="font-mono text-[10px] text-slate-400 font-normal">({doc.proveedor.rut})</span>
                          )}
                        </span>

                        <span className="flex items-center gap-1 text-[11px]" suppressHydrationWarning>
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(doc.fechaDocumento).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400">
                          <Warehouse className="h-3 w-3 shrink-0" />
                          <span>{bodegaDestino}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount & Expand Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left lg:text-right">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Monto Total ({doc.items[0]?.esAfecto ? 'IVA Incl.' : 'Exento'})
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                        ${Math.round(doc.montoTotal).toLocaleString('es-CL')}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                        isExpanded
                          ? 'bg-[#227262] text-white border-[#227262]'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isExpanded ? 'Ocultar Detalle' : 'Ver Detalle Completo'}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Table */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <h5 className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-teal-600" />
                        <span>Detalle Completo de Productos Ingresados en esta {isFactura ? 'Factura' : 'Guía'}:</span>
                      </h5>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Registrado por: <strong className="text-slate-700 dark:text-slate-300">{usuarioOperador}</strong>
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                              <th className="py-2.5 px-3">Código</th>
                              <th className="py-2.5 px-3">Producto / Insumo</th>
                              <th className="py-2.5 px-3 text-center min-w-[110px]">Cantidad</th>
                              <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                              <th className="py-2.5 px-3 text-right w-28 text-emerald-700 dark:text-emerald-400">Unit. Bruto</th>
                              <th className="py-2.5 px-3 text-center w-24">Tratamiento</th>
                              <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                            {doc.items.map((item, idx) => {
                              // Valor unitario bruto (con IVA incluido):
                              // Corresponde al subtotal dividido por la cantidad (es decir, precioUnitario * 1.19 si es afecto).
                              const valorUnitarioBruto = item.cantidad > 0 
                                ? item.subtotal / item.cantidad 
                                : (item.esAfecto ? item.precioUnitario * 1.19 : item.precioUnitario);

                              return (
                                <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[11px] text-[#227262] dark:text-teal-400 whitespace-nowrap">
                                    {item.producto?.codigo || 'S/C'}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                                    {item.producto?.nombre}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-black font-mono whitespace-nowrap">
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] whitespace-nowrap">
                                      +{item.cantidad} {item.producto?.unidad || 'UND'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    ${item.precioUnitario.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                    ${valorUnitarioBruto.toLocaleString('es-CL', {
                                      minimumFractionDigits: valorUnitarioBruto % 1 === 0 ? 0 : 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      item.esAfecto 
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {item.esAfecto ? 'Afecto 19%' : 'Exento'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                    ${item.subtotal.toLocaleString('es-CL', {
                                      minimumFractionDigits: item.subtotal % 1 === 0 ? 0 : 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                              <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider text-slate-500">
                                Total Calculado del Desglose:
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-xs text-emerald-700 dark:text-emerald-400">
                                {totalUnits} u.
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-xs font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                ${sumPrecioUnitario.toLocaleString('es-CL', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                ${sumUnitarioBruto.toLocaleString('es-CL', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                              <td></td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                                <div className="text-sm font-black text-[#227262] dark:text-teal-300">
                                  ${sumSubtotalesExact.toLocaleString('es-CL', {
                                    minimumFractionDigits: sumSubtotalesExact % 1 === 0 ? 0 : 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                                {sumSubtotalesExact % 1 !== 0 && (
                                  <div className="text-[10px] font-bold text-slate-400">
                                    Redondeo Factura: ${sumSubtotalesRedondeado.toLocaleString('es-CL')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Observaciones si existen */}
                    {doc.observaciones && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs flex items-start gap-2 text-amber-900 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Observaciones de la Entrada:
                          </span>
                          <p className="font-medium italic text-[11px] whitespace-pre-wrap break-words">
                            &ldquo;{doc.observaciones}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            Mostrando <strong className="text-slate-800 dark:text-slate-200 font-bold">{startIndex + 1}</strong> a <strong className="text-slate-800 dark:text-slate-200 font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredDocs.length}</strong> documentos
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Anterior</span>
            </button>

            <span className="px-3 py-1 font-black rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-[#227262] dark:text-teal-300">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
