'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Package } from 'lucide-react';

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
  products,
  selectedProductId,
  onSelect,
  placeholder = "Buscar insumo por nombre o código...",
  required = false
}: ProductSearchableInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = query.trim() === ''
    ? products.slice(0, 15)
    : products.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo.toLowerCase().includes(query.toLowerCase())
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
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0"
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
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-[11px] text-slate-400 text-center font-medium">
                  No se encontraron insumos que coincidan.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="p-2.5 hover:bg-teal-50 dark:hover:bg-teal-950/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
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
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
