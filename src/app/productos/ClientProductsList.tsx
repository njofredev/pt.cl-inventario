'use client';

import { useState } from "react";
import Link from "next/link";
import { Eye, Database, Search } from "lucide-react";
import ProductDetailModal from "./ProductDetailModal";

interface ProductWithStock {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  stockCritico: number | null;
  stockTotal: number;
  cuentaContable: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
}

interface ClientProductsListProps {
  products: ProductWithStock[];
  cuentasContables: { id: string; codigo: string; nombre: string }[];
  unidadesMedida?: { id: string; nombre: string }[];
  search: string;
  page: number;
  totalPages: number;
}

export default function ClientProductsList({
  products,
  cuentasContables,
  unidadesMedida = [],
  search,
  page,
  totalPages,
}: ClientProductsListProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <>
      {/* Search Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
        <form method="GET" action="/productos" className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 dark:bg-teal-600 hover:bg-black dark:hover:bg-teal-500 text-white font-extrabold rounded-xl text-xs transition-all active-scale-down shadow-sm cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="p-3 pl-5">Código</th>
                <th className="p-3">Nombre del Material</th>
                <th className="p-3">Cuenta Contable</th>
                <th className="p-3">Unidad</th>
                <th className="p-3 text-right">Stock Físico</th>
                <th className="p-3 text-center pr-5">Acciones DB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => setSelectedProductId(product.id)}
                    className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400 pl-5">
                      {product.codigo}
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {product.nombre}
                    </td>
                    <td className="p-3">
                      {product.cuentaContable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {product.cuentaContable.codigo}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Sin cuenta</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">{product.unidad || "UND"}</td>
                    <td className="p-3 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        product.stockTotal === 0 
                          ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" 
                          : product.stockTotal < (product.stockCritico || 5) 
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" 
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}>
                        {product.stockTotal}
                      </span>
                    </td>
                    <td className="p-3 text-center pr-5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer"
                        title="Inspeccionar en DB"
                      >
                        <Database className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                        <span>Ficha DB</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (() => {
          const visiblePages = [];
          visiblePages.push(1);
          
          let startPage = Math.max(2, page - 2);
          let endPage = Math.min(totalPages - 1, page + 2);
          
          if (page <= 3) {
            endPage = Math.min(totalPages - 1, 5);
          }
          if (page >= totalPages - 2) {
            startPage = Math.max(2, totalPages - 4);
          }
          
          if (startPage > 2) {
            visiblePages.push(-1);
          }
          
          for (let i = startPage; i <= endPage; i++) {
            visiblePages.push(i);
          }
          
          if (endPage < totalPages - 1) {
            visiblePages.push(-2);
          }
          
          if (totalPages > 1) {
            visiblePages.push(totalPages);
          }

          return (
            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <span className="text-[10px] font-extrabold text-slate-400">
                PÁGINA {page} DE {totalPages}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/productos?search=${search}&page=${page - 1}`}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                    page <= 1
                      ? "pointer-events-none opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Anterior
                </Link>

                {visiblePages.map((p, idx) => {
                  if (p < 0) {
                    return (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-[10px] text-slate-400 font-bold select-none">
                        ...
                      </span>
                    );
                  }
                  const isActive = p === page;
                  return (
                    <Link
                      key={`page-${p}`}
                      href={`/productos?search=${search}&page=${p}`}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        isActive
                          ? "bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-500"
                          : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}

                <Link
                  href={`/productos?search=${search}&page=${page + 1}`}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                    page >= totalPages
                      ? "pointer-events-none opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Siguiente
                </Link>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          cuentasContables={cuentasContables}
          unidadesMedida={unidadesMedida}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </>
  );
}
