'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Package, Plus } from 'lucide-react';
import QuickCreateProductModal from '@/components/QuickCreateProductModal';

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  unidadCompra?: string | null;
  unidadesPorEnvase?: number | null;
  unidadEnvase?: string | null;
  unidadesPorConsumo?: number | null;
}

interface ProductSearchableInputProps {
  products: Product[];
  selectedProductId: string;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ProductSearchableInput({
  products: initialProducts,
  selectedProductId,
  onSelect,
  placeholder = "Buscar insumo por nombre o código...",
  required = false
}: ProductSearchableInputProps) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
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
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2.5 hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between text-xs font-medium"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/60 px-1.5 py-0.5 rounded shrink-0">
                            {p.codigo}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                            {p.nombre}
                          </span>
                        </div>
                        {p.unidad && (
                          <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                            {p.unidad}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickCreateOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>¿No está en la lista? Crear producto nuevo</span>
                  </button>
                </>
              ) : query.trim().length > 0 ? (
                <div className="p-3 bg-amber-50/80 dark:bg-slate-800/90 text-center space-y-2">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    ⚠️ El insumo "{query}" no existe en el catálogo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickCreateOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full py-2 px-3 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active-scale-down cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear "{query}" en el Catálogo</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Quick Create Product Popup Modal */}
      <QuickCreateProductModal
        isOpen={isQuickCreateOpen}
        initialSearchQuery={query}
        onClose={() => setIsQuickCreateOpen(false)}
        onProductCreated={(newProd) => {
          setProductsList(prev => [...prev, newProd]);
          onSelect(newProd);
          setQuery('');
        }}
      />
    </div>
  );
}

