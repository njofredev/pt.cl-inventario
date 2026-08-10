'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Building2, 
  Search, 
  Copy, 
  Check,
  Calculator,
  PieChart
} from 'lucide-react';

interface KardexItem {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
  cuentaContableNombre?: string | null;
  cuentaContableCodigo?: string | null;
  stockTotal: number;
  precioRef: number;
  valorTotal: number;
}

interface Props {
  items: KardexItem[];
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function KardexClient({ items }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState<string>('TODAS');
  const [copied, setCopied] = useState(false);

  const totalValorInventario = items.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalUnidadesStock = items.reduce((acc, curr) => acc + curr.stockTotal, 0);
  
  // Extract unique accounts
  const cuentasMap = new Map<string, number>();
  items.forEach(item => {
    const cuentaName = item.cuentaContableNombre || 'Sin Cuenta Contable';
    cuentasMap.set(cuentaName, (cuentasMap.get(cuentaName) || 0) + item.valorTotal);
  });

  const normSearch = removeAccents(search.trim());
  const filteredItems = items.filter(item => {
    const cuentaName = item.cuentaContableNombre || 'Sin Cuenta Contable';
    if (selectedCuenta !== 'TODAS' && cuentaName !== selectedCuenta) return false;
    if (!normSearch) return true;
    return (
      removeAccents(item.nombre).includes(normSearch) ||
      removeAccents(item.codigo).includes(normSearch) ||
      removeAccents(cuentaName).includes(normSearch)
    );
  });

  function handleCopyKardex() {
    const textLines = [
      `=== INFORME DE KARDEX VALORIZADO DE INVENTARIO - POLICLÍNICO TABANCURA ===`,
      `Fecha: ${new Date().toLocaleDateString('es-CL')}`,
      `Valor Total Inventario: $${totalValorInventario.toLocaleString('es-CL')}`,
      `Total Unidades: ${totalUnidadesStock.toLocaleString('es-CL')}`,
      ``,
      ...filteredItems.map((item, i) => `${i + 1}. [${item.codigo}] ${item.nombre} | Cuenta: ${item.cuentaContableNombre || 'N/A'} | Stock: ${item.stockTotal} ${item.unidad} | PPP: $${item.precioRef.toLocaleString('es-CL')} | VALOR TOTAL: $${item.valorTotal.toLocaleString('es-CL')}`),
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
              Valor Total Inventario (PPP)
            </span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            ${totalValorInventario.toLocaleString('es-CL')}
          </p>
          <p className="text-[10px] text-slate-400">Suma total valorizada de existencias</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
              Total Unidades Guardadas
            </span>
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {totalUnidadesStock.toLocaleString('es-CL')} Unid.
          </p>
          <p className="text-[10px] text-slate-400">Distribuidas en todas las bodegas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400">
              Cuentas Contables Activas
            </span>
            <PieChart className="h-5 w-5 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {cuentasMap.size} Cuentas
          </p>
          <p className="text-[10px] text-slate-400">Clasificación contable de existencias</p>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <PieChart className="h-4 w-4 text-teal-600 shrink-0" />
          <select
            value={selectedCuenta}
            onChange={(e) => setSelectedCuenta(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
          >
            <option value="TODAS">Todas las Cuentas Contables</option>
            {Array.from(cuentasMap.keys()).map(cName => (
              <option key={cName} value={cName}>{cName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o cuenta..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyKardex}
            className="px-4 py-2 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#05b875]/20 transition-all active-scale-down cursor-pointer shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copiado' : 'Exportar Resumen'}</span>
          </button>
        </div>
      </div>

      {/* Kardex Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cuenta Contable</th>
                <th className="py-3 px-4 text-right">Precio Ref / PPP</th>
                <th className="py-3 px-4 text-center">Stock Físico Total</th>
                <th className="py-3 px-4 text-right">Valor Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron productos registrados en el Kardex.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {item.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                      {item.codigo}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.cuentaContableNombre ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold">
                          {item.cuentaContableCodigo ? `${item.cuentaContableCodigo} - ` : ''}{item.cuentaContableNombre}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin Cuenta</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${item.precioRef.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                      {item.stockTotal} {item.unidad}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ${item.valorTotal.toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
