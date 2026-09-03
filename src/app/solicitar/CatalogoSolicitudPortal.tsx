'use client';

import { useState, useMemo } from 'react';
import { 
  Folder, 
  Layers, 
  Package, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Sparkle,
  Briefcase,
  FileText,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';

export interface ProductCatalogItem {
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
}

interface Props {
  productos: ProductCatalogItem[];
  cart: { productoId: string; cantidad: number }[];
  onAddToCart: (product: ProductCatalogItem, cantidad: number) => void;
  onRemoveFromCart: (productoId: string) => void;
  onUpdateCartQuantity: (productoId: string, cantidad: number) => void;
}

// Map known classifications to friendly icon and color theme
const CATEGORY_STYLES: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  'ELEMENTOS DE PROTECCIÓN PERSONAL': {
    icon: ShieldCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/60'
  },
  'INSUMOS CLÍNICOS DENTALES': {
    icon: Stethoscope,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/60'
  },
  'INSUMOS CLÍNICOS TRANSVERSALES': {
    icon: Stethoscope,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60'
  },
  'INSUMOS DE ASEO Y DESINFECCIÓN': {
    icon: Sparkles,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/60'
  },
  'INSUMOS DE ESTERILIZACIÓN': {
    icon: Layers,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/60'
  },
  'INSUMOS DE ADMINISTRACIÓN Y OFICINA': {
    icon: Briefcase,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/60'
  },
  'INSUMOS DE FARMACIA Y MEDICAMENTOS': {
    icon: Package,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60'
  },
};

export default function CatalogoSolicitudPortal({
  productos,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
}: Props) {
  // Navigation states
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  // Track local counter for adding items before pushing to cart
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // 1. Group hierarchy: Categoría -> Tipos -> Productos
  const hierarchy = useMemo(() => {
    const catsMap: Record<string, { tipos: Record<string, ProductCatalogItem[]>; count: number }> = {};

    for (const p of productos) {
      const cat = p.clasificacion?.trim() || 'OTROS INSUMOS';
      const tipo = p.tipoProducto?.trim() || 'General';

      if (!catsMap[cat]) {
        catsMap[cat] = { tipos: {}, count: 0 };
      }
      catsMap[cat].count++;

      if (!catsMap[cat].tipos[tipo]) {
        catsMap[cat].tipos[tipo] = [];
      }
      catsMap[cat].tipos[tipo].push(p);
    }

    return catsMap;
  }, [productos]);

  const categoriasList = useMemo(() => {
    return Object.keys(hierarchy).sort((a, b) => a.localeCompare(b));
  }, [hierarchy]);

  // Tipos list for the currently selected category
  const tiposList = useMemo(() => {
    if (!selectedCategoria || !hierarchy[selectedCategoria]) return [];
    return Object.keys(hierarchy[selectedCategoria].tipos).sort((a, b) => a.localeCompare(b));
  }, [hierarchy, selectedCategoria]);

  // Filtered products list when a Tipo is selected
  const filteredProducts = useMemo(() => {
    if (!selectedCategoria || !selectedTipo) return [];
    const prods = hierarchy[selectedCategoria]?.tipos[selectedTipo] || [];
    return prods;
  }, [hierarchy, selectedCategoria, selectedTipo]);

  const getItemQuantity = (id: string) => {
    return quantities[id] || 1;
  };

  const setItemQuantity = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const handleSelectCategoria = (cat: string) => {
    setSelectedCategoria(cat);
    setSelectedTipo(null);
  };

  const handleSelectTipo = (tipo: string) => {
    setSelectedTipo(tipo);
  };

  const handleResetNavigation = () => {
    setSelectedCategoria(null);
    setSelectedTipo(null);
  };

  const isItemInCart = (productId: string) => {
    return cart.some(c => c.productoId === productId);
  };

  const getCartItemQty = (productId: string) => {
    return cart.find(c => c.productoId === productId)?.cantidad || 0;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation Bar (Solo visible al navegar dentro de una categoría o tipo) */}
      {(selectedCategoria || selectedTipo) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <nav className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={handleResetNavigation}
                className="hover:text-teal-700 transition-colors flex items-center gap-1 cursor-pointer text-slate-400"
              >
                <Folder className="h-3.5 w-3.5" /> Categorías
              </button>

              {selectedCategoria && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                  <button
                    type="button"
                    onClick={() => setSelectedTipo(null)}
                    className={`hover:text-teal-700 transition-colors cursor-pointer ${
                      !selectedTipo ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {selectedCategoria}
                  </button>
                </>
              )}

              {selectedTipo && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                  <span className="text-teal-600 dark:text-teal-400 font-extrabold">
                    {selectedTipo}
                  </span>
                </>
              )}
            </nav>

            <button
              type="button"
              onClick={handleResetNavigation}
              className="text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="h-3 w-3" /> <span className="hidden sm:inline">Ver todas</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: NIVEL 1 - CATEGORÍAS */}
      {!selectedCategoria && (
            <div className="space-y-3">
              <div className="hidden sm:block">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Paso 1: Selecciona una Categoría de Insumos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Explora las familias de materiales disponibles en el catálogo del policlínico.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {categoriasList.map((cat) => {
                  const style = CATEGORY_STYLES[cat] || {
                    icon: Folder,
                    color: 'text-teal-600 dark:text-teal-400',
                    bg: 'bg-teal-50 dark:bg-teal-950/30',
                    border: 'border-teal-200 dark:border-teal-800/60'
                  };
                  const Icon = style.icon;
                  const catData = hierarchy[cat];
                  const tiposCount = Object.keys(catData.tipos).length;

                  return (
                    <div
                      key={cat}
                      onClick={() => handleSelectCategoria(cat)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between sm:flex-col sm:justify-between sm:space-y-4 active:scale-[0.98]"
                    >
                      <div className="flex items-center sm:items-start sm:justify-between w-full gap-3 sm:gap-0">
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center ${style.color} group-hover:scale-105 transition-transform shrink-0`}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1 sm:hidden">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 transition-colors">
                            {cat}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {tiposCount} tipos • {catData.count} ítems
                          </span>
                        </div>
                        <span className="hidden sm:inline-block text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {catData.count} ítems
                        </span>
                      </div>

                      <div className="hidden sm:block w-full">
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 transition-colors leading-snug">
                          {cat}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">
                          {tiposCount} {tiposCount === 1 ? 'tipo específico' : 'tipos específicos'} de insumo
                        </p>
                      </div>

                      <div className="hidden sm:flex w-full items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>Ver tipos</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>

                      <ChevronRight className="sm:hidden h-4 w-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: NIVEL 2 - TIPOS DENTRO DE LA CATEGORÍA */}
          {selectedCategoria && !selectedTipo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    type="button"
                    onClick={handleResetNavigation}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver a todas las categorías
                  </button>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    Paso 2: Tipos en {selectedCategoria}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    Selecciona el tipo exacto para desplegar todos sus productos filtrados.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {tiposList.map((tipo) => {
                  const prodsCount = hierarchy[selectedCategoria]?.tipos[tipo]?.length || 0;

                  return (
                    <div
                      key={tipo}
                      onClick={() => handleSelectTipo(tipo)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-600 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 transition-colors">
                            {tipo}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {prodsCount} {prodsCount === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: NIVEL 3 - LISTADO COMPLETO DE PRODUCTOS FILTRADOS */}
          {selectedCategoria && selectedTipo && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedTipo(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver a tipos de {selectedCategoria}
                  </button>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedTipo}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {filteredProducts.length} productos
                    </span>
                  </h3>
                </div>
              </div>

              <ProductsListGrid 
                products={filteredProducts}
                cart={cart}
                getItemQuantity={getItemQuantity}
                setItemQuantity={setItemQuantity}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                onUpdateCartQuantity={onUpdateCartQuantity}
                isItemInCart={isItemInCart}
                getCartItemQty={getCartItemQty}
              />
            </div>
          )}
    </div>
  );
}

/**
 * Grid component that renders products with quantity controllers and cart actions
 */
function ProductsListGrid({
  products,
  cart,
  getItemQuantity,
  setItemQuantity,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  isItemInCart,
  getCartItemQty
}: {
  products: ProductCatalogItem[];
  cart: { productoId: string; cantidad: number }[];
  getItemQuantity: (id: string) => number;
  setItemQuantity: (id: string, qty: number) => void;
  onAddToCart: (product: ProductCatalogItem, cantidad: number) => void;
  onRemoveFromCart: (productoId: string) => void;
  onUpdateCartQuantity: (productoId: string, cantidad: number) => void;
  isItemInCart: (id: string) => boolean;
  getCartItemQty: (id: string) => number;
}) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
        <Package className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          No se encontraron insumos en esta selección.
        </p>
        <p className="text-xs text-slate-400">
          Prueba seleccionando otro tipo de insumo o usando el buscador general.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
      {products.map((p) => {
        const inCart = isItemInCart(p.id);
        const currentCartQty = getCartItemQty(p.id);
        const inputQty = getItemQuantity(p.id);

        return (
          <div
            key={p.id}
            className={`p-3 sm:px-4 sm:py-2.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 ${
              inCart 
                ? 'bg-teal-50/30 dark:bg-teal-950/20' 
                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
            }`}
          >
            {/* Product Details (Linear) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {p.nombre}
                </h4>
                {inCart && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 shrink-0">
                    <Check className="h-2.5 w-2.5" /> En Pedido ({currentCartQty})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1 flex-wrap">
                <span>CÓD: {p.codigo}</span>
                <span>•</span>
                <span className="font-sans font-medium text-slate-600 dark:text-slate-300">
                  {p.unidad || 'UND'}
                </span>
                <span>•</span>
                {(p.stockTotal ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 font-sans font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Stock: {p.stockTotal} {p.unidad || 'UND'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-sans font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Sin stock (A pedido: 0)
                  </span>
                )}
              </div>
            </div>

            {/* Stepper + Action Button (Inline & Compact) */}
            <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 h-8">
                <button
                  type="button"
                  onClick={() => {
                    if (inCart) {
                      if (currentCartQty > 1) {
                        onUpdateCartQuantity(p.id, currentCartQty - 1);
                      } else {
                        onRemoveFromCart(p.id);
                      }
                    } else {
                      setItemQuantity(p.id, inputQty - 1);
                    }
                  }}
                  className="w-7 h-8 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-90 select-none"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                  {inCart ? currentCartQty : inputQty}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (inCart) {
                      onUpdateCartQuantity(p.id, currentCartQty + 1);
                    } else {
                      setItemQuantity(p.id, inputQty + 1);
                    }
                  }}
                  className="w-7 h-8 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-90 select-none"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {inCart ? (
                <button
                  type="button"
                  onClick={() => onRemoveFromCart(p.id)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 h-8 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAddToCart(p, inputQty)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-extrabold text-white bg-[#227262] hover:bg-[#1a5b4e] transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> Agregar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
