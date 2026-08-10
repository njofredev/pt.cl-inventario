'use client';

import { useState } from 'react';
import { 
  ClipboardCheck, 
  Warehouse, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Loader2, 
  RefreshCw,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import { registrarAjusteInventario } from './actions';

interface StockRow {
  productId: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
  bodegaId: string;
  bodegaNombre: string;
  ubicacionId: string;
  ubicacionNombre: string;
  cantidadActual: number;
}

interface BodegaOption {
  id: string;
  nombre: string;
  ubicaciones: Array<{ id: string; nombre: string }>;
}

interface Props {
  stocks: StockRow[];
  bodegas: BodegaOption[];
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ArqueoClient({ stocks, bodegas }: Props) {
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>('TODAS');
  const [search, setSearch] = useState<string>('');
  
  // Active editing row state
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);
  const [cantidadContada, setCantidadContada] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Merma / Rotura');
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success?: boolean; text?: string } | null>(null);

  const normSearch = removeAccents(search.trim());
  const filteredStocks = stocks.filter(s => {
    if (selectedBodegaId !== 'TODAS' && s.bodegaId !== selectedBodegaId) return false;
    if (!normSearch) return true;
    return (
      removeAccents(s.nombre).includes(normSearch) ||
      removeAccents(s.codigo).includes(normSearch) ||
      removeAccents(s.bodegaNombre).includes(normSearch)
    );
  });

  function handleSelectRow(row: StockRow) {
    setSelectedRow(row);
    setCantidadContada(row.cantidadActual.toString());
    setMotivo('Merma / Rotura');
    setObservaciones('');
    setStatusMsg(null);
  }

  async function handleAjustarSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRow) return;

    const cantNum = parseInt(cantidadContada);
    if (isNaN(cantNum) || cantNum < 0) {
      setStatusMsg({ success: false, text: 'Ingresa una cantidad contada válida.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const res = await registrarAjusteInventario({
      productoId: selectedRow.productId,
      bodegaId: selectedRow.bodegaId,
      ubicacionId: selectedRow.ubicacionId,
      cantidadActual: selectedRow.cantidadActual,
      cantidadContada: cantNum,
      motivo,
      observaciones,
    });

    setLoading(false);

    if (res.success) {
      setStatusMsg({ success: true, text: 'Ajuste de inventario aplicado exitosamente.' });
      setTimeout(() => {
        setSelectedRow(null);
      }, 1000);
    } else {
      setStatusMsg({ success: false, text: res.error });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Warehouse className="h-4 w-4 text-teal-600 shrink-0" />
          <select
            value={selectedBodegaId}
            onChange={(e) => setSelectedBodegaId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="TODAS">Todas las Bodegas</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o bodega..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Bodega / Ubicación</th>
                <th className="py-3 px-4 text-right">Stock en Sistema</th>
                <th className="py-3 px-4 text-center">Acción Conteo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No se encontraron registros para auditar.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((row) => (
                  <tr key={`${row.productId}-${row.bodegaId}-${row.ubicacionId}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {row.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                      {row.codigo}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {row.bodegaNombre}
                      </span>
                      <span className="text-slate-400 text-[10px] block">
                        ({row.ubicacionNombre})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">
                      {row.cantidadActual} {row.unidad}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSelectRow(row)}
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:hover:bg-teal-900 dark:text-teal-300 font-extrabold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-teal-200 dark:border-teal-800"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Ingresar Conteo Real</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ajuste por Conteo Físico */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Registrar Arqueo / Toma Física
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAjustarSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">{selectedRow.nombre}</p>
                <p className="text-[11px] text-slate-500">
                  Ubicación: <span className="font-bold text-teal-600">{selectedRow.bodegaNombre} ({selectedRow.ubicacionNombre})</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Stock actual en sistema: <span className="font-black text-slate-800 dark:text-slate-100">{selectedRow.cantidadActual} {selectedRow.unidad}</span>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Cantidad Contada Realmente *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={cantidadContada}
                  onChange={(e) => setCantidadContada(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono font-black focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Difference Preview */}
              {cantidadContada !== '' && !isNaN(parseInt(cantidadContada)) && (
                <div className="p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold">
                  <span>Diferencia a Ajustar:</span>
                  {parseInt(cantidadContada) - selectedRow.cantidadActual < 0 ? (
                    <span className="text-rose-600 flex items-center gap-1">
                      <MinusCircle className="h-4 w-4" /> Merma/Faltante de {Math.abs(parseInt(cantidadContada) - selectedRow.cantidadActual)} {selectedRow.unidad}
                    </span>
                  ) : parseInt(cantidadContada) - selectedRow.cantidadActual > 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <PlusCircle className="h-4 w-4" /> Sobrante de {parseInt(cantidadContada) - selectedRow.cantidadActual} {selectedRow.unidad}
                    </span>
                  ) : (
                    <span className="text-slate-400">Sin diferencia (Cuadrado)</span>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Motivo del Ajuste
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer"
                >
                  <option value="Merma / Rotura">Merma / Rotura por Manipulación</option>
                  <option value="Vencimiento de Producto">Vencimiento de Producto</option>
                  <option value="Pérdida o Extravío">Pérdida o Extravío</option>
                  <option value="Ajuste Arqueo Trimestral">Ajuste por Arqueo Físico Auditado</option>
                  <option value="Error de Digitalización">Correction / Error de Digitalización</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Observaciones Adicionales
                </label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Revisado con enfermera jefa..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none"
                />
              </div>

              {statusMsg && (
                <div className={`p-3 text-xs font-bold rounded-xl border ${
                  statusMsg.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {statusMsg.text}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Confirmar Ajuste</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
