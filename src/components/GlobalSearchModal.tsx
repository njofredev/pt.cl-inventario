'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Package, 
  Compass, 
  ArrowRight, 
  X, 
  Loader2, 
  Command, 
  CornerDownLeft, 
  Building2,
  ExternalLink
} from 'lucide-react';
import { globalSearchAction, GlobalSearchResultItem } from './globalSearchAction';
import ProductDetailModal from '@/app/productos/ProductDetailModal';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuentasContables?: { id: string; codigo: string; nombre: string }[];
  unidadesMedida?: { id: string; nombre: string }[];
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  cuentasContables = [],
  unidadesMedida = [],
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const resetSearchState = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    setSelectedProductId(null);
  };

  const handleClose = () => {
    resetSearchState();
    onClose();
  };

  // Focus input and cleanly reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      resetSearchState();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search execution with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await globalSearchAction(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Handle item selection
  const handleSelectItem = (item: GlobalSearchResultItem) => {
    if (item.type === 'PAGE' && item.href) {
      handleClose();
      router.push(item.href);
    } else if (item.type === 'PRODUCT') {
      // Clear previous search query so that next time it opens it starts from scratch
      setQuery('');
      setResults([]);
      setSelectedProductId(item.id);
    }
  };

  // Global window Escape key listener when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If ProductDetailModal is open on top, don't close GlobalSearchModal simultaneously
        if (selectedProductId) return;
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => window.removeEventListener('keydown', handleWindowKeyDown, true);
  }, [isOpen, selectedProductId]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-[12vh] animate-in fade-in duration-150"
        onClick={handleClose}
      >
        <div 
          className="bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col font-sans animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <Search className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
            
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe el nombre o código del producto, o una sección (ej. compras, usuarios)..."
              className="flex-1 bg-transparent border-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />

            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-teal-600 shrink-0" />
            )}

            {query ? (
              <button 
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {/* Explicit Close Button with ESC badge */}
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-200/70 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-500 transition-all cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800 shrink-0 group"
              title="Cerrar buscador (ESC)"
            >
              <span className="text-[10px] font-mono font-black group-hover:hidden">ESC</span>
              <X className="h-3.5 w-3.5 hidden group-hover:block" />
              <span className="text-[10px] font-bold hidden group-hover:inline">Cerrar</span>
            </button>
          </div>

          {/* Results List or Quick Guides */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 hide-scrollbar">
            {query.trim().length < 2 ? (
              <div className="py-10 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Buscador Rápido de Inventario
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Escribe para buscar cualquier producto en tiempo real, consultar su stock por bodega o saltar directamente a una sección del sistema.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-slate-500">
                    💡 Tip: Navega con ↑ ↓ y presiona Enter
                  </span>
                </div>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-slate-400">
                  Revisa que el nombre o código esté bien escrito.
                </p>
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.type === 'PRODUCT' ? Package : Compass;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        item.type === 'PRODUCT'
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </h4>
                          {item.badge && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.type === 'PRODUCT' ? (
                        <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          Ver Ficha <ExternalLink className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          Ir a Sección <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Shortcuts Legend */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0a1120] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] font-bold">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] font-bold">↓</kbd>
                <span>Navegar</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] font-bold">↵</kbd>
                <span>Seleccionar</span>
              </span>
            </div>

            <span className="font-semibold text-teal-600 dark:text-teal-400">
              Atajo: Alt + J
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Product Detail Modal when a product is clicked */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          cuentasContables={cuentasContables}
          unidadesMedida={unidadesMedida}
          onClose={() => {
            setSelectedProductId(null);
            handleClose();
          }}
        />
      )}
    </>
  );
}
