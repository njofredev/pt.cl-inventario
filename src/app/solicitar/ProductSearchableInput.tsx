'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Package } from 'lucide-react';

import { StockSucursalDetail } from './CatalogoSolicitudPortal';

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  clasificacion?: string | null;
  tipoProducto?: string | null;
  unidad: string | null;
  unidadCompra?: string | null;
  unidadesPorEnvase?: number | null;
  unidadEnvase?: string | null;
  unidadesPorConsumo?: number | null;
  stockTotal?: number;
  stocksBySucursal?: StockSucursalDetail[];
}

interface ProductSearchableInputProps {
  products: Product[];
  selectedProductId: string;
  userSucursalName?: string | null;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ProductSearchableInput({
  products: initialProducts,
  selectedProductId,
  userSucursalName,
  onSelect,
  placeholder = "Buscar insumo por nombre o código...",
  required = false
}: ProductSearchableInputProps) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProductsList(initialProducts);
  }, [initialProducts]);

  const selectedProduct = productsList.find(p => p.id === selectedProductId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  const normQuery = removeAccents(query.trim());

  const filteredProducts = query.trim() === ''
    ? productsList.slice(0, 15)
    : productsList.filter(p =>
        removeAccents(p.nombre).includes(normQuery) ||
        removeAccents(p.codigo).includes(normQuery)
      ).slice(0, 15);

  const handleSelectProduct = (p: Product) => {
    onSelect(p);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={selectedProductId}
          onChange={() => {}}
          required
          tabIndex={-1}
          className="sr-only"
        />
      )}

      {selectedProduct ? (
        <div className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-md shrink-0">
              {selectedProduct.codigo}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
              {selectedProduct.nombre}
            </span>
            {selectedProduct.unidad && (
              <span className="text-[9px] font-extrabold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                {selectedProduct.unidad}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Cambiar insumo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length > 0 ? (
                <>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2.5 hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium gap-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/60 px-1.5 py-0.5 rounded shrink-0">
                              {p.codigo}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                              {p.nombre}
                            </span>
                            {p.unidad && (
                              <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                                {p.unidad}
                              </span>
                            )}
                          </div>

                          {/* Branch stock breakdown tags */}
                          {p.stocksBySucursal && p.stocksBySucursal.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {p.stocksBySucursal.map((st, idx) => {
                                const isLocal = userSucursalName ? st.sucursalNombre.toLowerCase().includes(userSucursalName.toLowerCase()) : false;
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
                                      st.cantidad > 0
                                        ? isLocal
                                          ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
                                        : 'bg-rose-50 text-rose-500 border-rose-200/50'
                                    }`}
                                  >
                                    <span>{st.sucursalNombre.replace('Sucursal ', '')}:</span>
                                    <strong className="font-mono">{st.cantidad}</strong>
                                    {isLocal && <span className="text-[7.5px] text-emerald-700 font-extrabold">(Tu Sede)</span>}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {(p.stockTotal ?? 0) > 0 ? (
                            <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                              Total: {p.stockTotal}
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                              Sin stock (0)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : query.trim().length > 0 ? (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    No se encontró "{query}" en el catálogo
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Solo puedes solicitar insumos previamente ingresados por los encargados de bodega.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

