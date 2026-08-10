'use client';

import { useState } from 'react';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowRight, 
  Scale, 
  Package, 
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

interface ProductReorder {
  id: string;
  codigo: string;
  nombre: string;
  unidad?: string | null;
  unidadCompra?: string | null;
  unidadesPorEnvase?: number | null;
  stockCritico: number;
  stockTotal: number;
  precioRef: number;
  diferencia: number;
  sugerido: number;
}

interface Props {
  items: ProductReorder[];
}

export default function ReposicionClient({ items }: Props) {
  const [copied, setCopied] = useState(false);

  const totalProductosSugeridos = items.length;
  const montoEstimadoReorden = items.reduce((acc, curr) => acc + (curr.sugerido * curr.precioRef), 0);

  function handleCopySummary() {
    const textLines = [
      `=== PROPUESTA DE REPOSICIÓN DE STOCK - POLICLÍNICO TABANCURA ===`,
      `Fecha: ${new Date().toLocaleDateString('es-CL')}`,
      `Total Ítems a Reponer: ${totalProductosSugeridos}`,
      ``,
      ...items.map((item, i) => `${i + 1}. [${item.codigo}] ${item.nombre} -> Actual: ${item.stockTotal} | Crítico: ${item.stockCritico} | SUGERIDO A COMPRAR: ${item.sugerido} ${item.unidad}`),
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Cálculo Automático de Reposición
          </span>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {totalProductosSugeridos} Productos Requieren Reposición Inmediata
          </h2>
          <p className="text-xs text-slate-400">
            Generado según el umbral de stock crítico registrado en el catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Resumen de Pedido'}</span>
          </button>

          <Link
            href="/cuadros/crear"
            className="px-4 py-2.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#05b875]/20 transition-all active-scale-down"
          >
            <Scale className="h-4 w-4" />
            <span>Crear Cuadro Comparativo</span>
          </Link>
        </div>
      </div>

      {/* Suggested Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Stock Crítico</th>
                <th className="py-3 px-4 text-center">Déficit</th>
                <th className="py-3 px-4 text-center">Cantidad Sugerida</th>
                <th className="py-3 px-4 text-right">Precio Ref. Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    ✨ ¡Excelente! Todos los productos están por encima de su nivel de stock crítico.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {item.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                      {item.codigo}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                      {item.stockTotal} {item.unidad}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.stockCritico} {item.unidad}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        -{item.diferencia} {item.unidad}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.sugerido} {item.unidad}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${item.precioRef.toLocaleString('es-CL')}
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
