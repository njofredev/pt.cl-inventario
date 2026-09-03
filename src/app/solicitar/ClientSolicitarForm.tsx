'use client'

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ClipboardList, 
  Eye, 
  Edit3, 
  Send, 
  Sparkles, 
  PackageCheck, 
  AlertCircle,
  FolderTree,
  ListPlus,
  ShoppingCart,
  Building2,
  User,
  MapPin,
  Check,
  X,
  ChevronUp,
  Minus,
  Search,
  History,
  Clock,
  PackageX,
  AlertTriangle
} from "lucide-react";
import CatalogoSolicitudPortal, { ProductCatalogItem } from "./CatalogoSolicitudPortal";
import ProductSearchableInput from "./ProductSearchableInput";

interface CC {
  id: string;
  codigo: string;
  nombre: string;
}

export interface UserSolicitudItem {
  id: string;
  productoId: string;
  cantidad: number;
  product: {
    codigo: string;
    nombre: string;
    unidad: string | null;
    stockTotal?: number;
  };
}

export interface UserSolicitud {
  id: string;
  fecha: string;
  nombre: string;
  rut: string | null;
  areaTrabajo: string | null;
  cargo: string | null;
  estado: string;
  centroCosto: {
    codigo: string;
    nombre: string;
  };
  items: UserSolicitudItem[];
}

interface Props {
  centrosCosto: CC[];
  productos: ProductCatalogItem[];
  currentUser?: {
    nombre: string;
    username: string;
    role: string;
  };
  userSolicitudes?: UserSolicitud[];
  initialTab?: 'BUSCADOR' | 'CATALOGO' | 'HISTORIAL';
  submitRequestAction: (data: {
    nombre: string;
    rut: string;
    areaTrabajo: string;
    cargo: string;
    centroCostoId: string;
    items: { productoId: string; cantidad: number }[];
  }) => Promise<{ success: boolean }>;
}

export default function ClientSolicitarForm({ centrosCosto, productos, currentUser, userSolicitudes = [], initialTab = 'BUSCADOR', submitRequestAction }: Props) {
  // Datos del Solicitante (Pre-llenado automático si ha iniciado sesión)
  const [nombre, setNombre] = useState(currentUser?.nombre || "");
  const [rut, setRut] = useState("");
  const [areaTrabajo, setAreaTrabajo] = useState("");
  const [cargo, setCargo] = useState(currentUser?.role === 'CONSUMIDOR' ? 'Personal Clínico' : "");
  const [centroCostoId, setCentroCostoId] = useState("");
  
  // Canasta unificada de la solicitud
  const [items, setItems] = useState<{ productoId: string; cantidad: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile Cart Drawer State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // View Tab Toggle: 'BUSCADOR' | 'CATALOGO' | 'HISTORIAL'
  const [activeTab, setActiveTab] = useState<'BUSCADOR' | 'CATALOGO' | 'HISTORIAL'>(initialTab);

  // Sincronizar activeTab si la URL cambia a través del Sidebar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Cart operations for Catalog & Instant Search
  const handleAddToCart = (product: ProductCatalogItem, cantidad: number) => {
    setItems(prev => {
      const clean = prev.filter(i => i.productoId !== "");
      const existing = clean.find(i => i.productoId === product.id);
      if (existing) {
        return clean.map(i => i.productoId === product.id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      }
      return [...clean, { productoId: product.id, cantidad: Math.max(1, cantidad) }];
    });
  };

  const handleRemoveFromCart = (productoId: string) => {
    setItems(prev => prev.filter(i => i.productoId !== productoId));
  };

  const handleUpdateCartQuantity = (productoId: string, cantidad: number) => {
    setItems(prev => prev.map(i => i.productoId === productoId ? { ...i, cantidad: Math.max(1, cantidad) } : i));
  };

  // Step 1: Trigger Review Mode (Solicita / confirma los datos y el payload)
  const handleStartReview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const validItems = items.filter(item => item.productoId !== "");
    if (validItems.length === 0) {
      setError("Debe agregar al menos un producto a la canasta de solicitud.");
      return;
    }

    setError(null);
    setIsReviewing(true);
    setIsMobileCartOpen(false);
  };

  // Step 2: Final Submit Action (Valida datos del solicitante y envía payload)
  const handleFinalSubmit = async () => {
    if (!nombre.trim()) {
      setError("Por favor, ingresa tu Nombre Completo para identificar la solicitud.");
      return;
    }
    if (!centroCostoId) {
      setError("Por favor, selecciona el Centro de Costo Destino.");
      return;
    }

    const validItems = items.filter(item => item.productoId !== "");
    if (validItems.length === 0) {
      setError("La canasta de solicitud no contiene productos válidos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await submitRequestAction({
        nombre,
        rut,
        areaTrabajo,
        cargo,
        centroCostoId,
        items: validItems
      });
      if (res.success) {
        setIsReviewing(false);
        setSuccess(true);
      } else {
        setError("Ocurrió un error al procesar tu solicitud.");
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCC = centrosCosto.find(cc => cc.id === centroCostoId);
  const validItemsWithProduct = items
    .filter(item => item.productoId !== "")
    .map(item => ({
      ...item,
      product: productos.find(p => p.id === item.productoId)
    }));

  const totalSelectedUnits = validItemsWithProduct.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Unified Layout Grid: Mainframe (Búsqueda o Catálogo o Historial) + Canasta de Solicitud */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Selection Area */}
          <div className="lg:col-span-8 space-y-5">

            {/* VISTA 1: BUSCADOR RÁPIDO INSTANTÁNEO */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5 ${
              activeTab === 'BUSCADOR' ? 'block' : 'hidden'
            }`}>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                      Búsqueda Rápida de Insumos
                    </h2>
                    <p className="text-[10px] text-slate-400 hidden sm:block">
                      Escribe el nombre o código para seleccionar y agregar directamente al pedido.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5 text-teal-600" />
                  <span>{validItemsWithProduct.length} ({totalSelectedUnits} u.)</span>
                </div>
              </div>

              {/* Input de Búsqueda Rápida Instantánea */}
              <div className="pt-0.5">
                <ProductSearchableInput
                  products={productos}
                  selectedProductId=""
                  onSelect={(p) => {
                    if (p) {
                      handleAddToCart(p, 1);
                    }
                  }}
                  placeholder="Escribe código o nombre (ej: guantes, suero...)"
                />
              </div>
            </div>

            {/* VISTA 2: CATÁLOGO JERÁRQUICO POR CATEGORÍA Y TIPO */}
            <div className={`space-y-3 ${
              activeTab === 'CATALOGO' ? 'block' : 'hidden'
            }`}>
              <CatalogoSolicitudPortal
                productos={productos}
                cart={items.filter(i => i.productoId !== "")}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
              />
            </div>

            {/* VISTA 3: ESTADO DE MIS SOLICITUDES Y CUMPLIMIENTO DE STOCK */}
            <div className={`space-y-3 ${
              activeTab === 'HISTORIAL' ? 'block' : 'hidden'
            }`}>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span>Estado de tus Solicitudes Anteriores</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Revisa el estado de aprobación por el bodeguero y si el stock se cumple para tu despacho.
                  </p>
                </div>
              </div>

              {userSolicitudes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <History className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No tienes solicitudes registradas aún
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Usa el buscador o el catálogo para enviar tu primer pedido a bodega.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userSolicitudes.map((sol) => {
                    const allHaveStock = sol.items.every(it => (it.product.stockTotal ?? 0) >= it.cantidad);
                    const someHaveZero = sol.items.some(it => (it.product.stockTotal ?? 0) === 0);

                    return (
                      <div
                        key={sol.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Status Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              sol.estado === "PENDIENTE" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                              sol.estado === "APROBADA" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                              "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            }`}>
                              {sol.estado === "PENDIENTE" ? "⏳ Pendiente Bodega" :
                               sol.estado === "APROBADA" ? "✅ Aprobada" : "❌ Rechazada"}
                            </span>

                            <span className="text-[10px] font-mono text-slate-400" suppressHydrationWarning>
                              {new Date(sol.fecha).toLocaleDateString("es-CL", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          {/* Cumplimiento de Stock Indicator */}
                          <div>
                            {allHaveStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Stock Disponible
                              </span>
                            ) : someHaveZero ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <PackageX className="h-3 w-3" /> Sin Stock Suficiente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="h-3 w-3" /> Stock Parcial
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items in this request */}
                        <div className="space-y-1.5">
                          {sol.items.map((it) => {
                            const stockAct = it.product.stockTotal ?? 0;
                            const seCumple = stockAct >= it.cantidad;

                            return (
                              <div
                                key={it.id}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    {it.product.nombre}
                                  </p>
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {it.product.codigo}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {it.cantidad} {it.product.unidad || 'UND'}
                                  </span>

                                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                    seCumple
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                  }`}>
                                    {seCumple ? "Cumple" : `Falta (${stockAct} disp.)`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-1 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                          <span>Destino: [{sol.centroCosto.codigo}] {sol.centroCosto.nombre}</span>
                          <span>{sol.items.length} {sol.items.length === 1 ? 'insumo' : 'insumos'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Canasta / Envío (Desktop / Tablet view) */}
          <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-6">

            {/* Tarjeta de Canasta de Pedido */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Canasta de Solicitud
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {validItemsWithProduct.length} materiales agregados
                    </p>
                  </div>
                </div>
              </div>

              {validItemsWithProduct.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="h-6 w-6 mx-auto opacity-40" />
                  <p className="text-xs">Aún no has agregado insumos a la solicitud.</p>
                  <p className="text-[10px]">Navega en el catálogo de la izquierda y haz clic en &ldquo;Agregar al Pedido&rdquo;.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1 hide-scrollbar space-y-1">
                  {validItemsWithProduct.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px]">
                          {item.product?.nombre}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-mono">
                          <span>{item.product?.codigo}</span>
                          <span>•</span>
                          <span className="font-sans font-medium text-slate-500">{item.product?.unidad || 'UND'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stepper de Cantidad Desktop */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.cantidad > 1) {
                                handleUpdateCartQuantity(item.productoId, item.cantidad - 1);
                              } else {
                                handleRemoveFromCart(item.productoId);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-90"
                            title="Disminuir"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleUpdateCartQuantity(item.productoId, isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            className="w-8 h-6 text-center text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent border-0 focus:outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item.productoId, item.cantidad + 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-90"
                            title="Aumentar"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.productoId)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Quitar de la canasta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={validItemsWithProduct.length === 0}
                onClick={() => handleStartReview()}
                className="w-full py-3 bg-[#227262] hover:bg-[#1a5b4e] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>Revisar y Enviar Solicitud</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* FLOATING ACTION BAR FOR MOBILE (Permite ver el pedido y enviar en smartphone sin scroll) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all active:scale-95 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                <ShoppingCart className="h-4 w-4 text-teal-600" />
                {validItemsWithProduct.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-teal-600 text-white font-bold text-[9px] flex items-center justify-center">
                    {validItemsWithProduct.length}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                  {validItemsWithProduct.length === 0 ? 'Canasta Vacía' : `${totalSelectedUnits} unidades`}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {nombre ? nombre : 'Toca para datos y pedido'}
                </p>
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            disabled={validItemsWithProduct.length === 0}
            onClick={() => handleStartReview()}
            className="px-4 py-2.5 bg-[#227262] hover:bg-[#1a5b4e] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Enviar ({validItemsWithProduct.length})</span>
          </button>
        </div>
      </div>

      {/* BOTTOM SHEET DRAWER FOR MOBILE CART & SOLICITANTE */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Tu Pedido de Insumos
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {validItemsWithProduct.length} productos ({totalSelectedUnits} unid.)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de productos Mobile */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Insumos Seleccionados ({validItemsWithProduct.length})
              </h4>

              {validItemsWithProduct.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="h-6 w-6 mx-auto opacity-40" />
                  <p className="text-xs">Aún no has añadido productos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                  {validItemsWithProduct.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
                          {item.product?.nombre}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>{item.product?.codigo}</span>
                          <span>•</span>
                          <span className="font-sans font-medium text-slate-500">{item.product?.unidad || 'UND'}</span>
                        </div>
                      </div>

                      {/* Control Interactivo de Cantidad en Mobile */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.cantidad > 1) {
                                handleUpdateCartQuantity(item.productoId, item.cantidad - 1);
                              } else {
                                handleRemoveFromCart(item.productoId);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-colors cursor-pointer"
                            title="Disminuir"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleUpdateCartQuantity(item.productoId, isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            className="w-10 h-8 text-center text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item.productoId, item.cantidad + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-colors cursor-pointer"
                            title="Aumentar"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.productoId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar de la canasta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                disabled={validItemsWithProduct.length === 0}
                onClick={() => handleStartReview()}
                className="w-full py-3 bg-[#227262] hover:bg-[#1a5b4e] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>Revisar y Enviar Solicitud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REVISIÓN ANTES DE ENVIAR */}
      {isReviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Confirmar Pedido de Insumos
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Verifica la información antes de enviar a bodega.
                  </p>
                </div>
              </div>
            </div>

            {/* Datos Solicitante & Destino para el Payload */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <User className="h-4 w-4 text-teal-600" />
                <span>Datos del Solicitante y Destino</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Valeria Martínez"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Centro de Costo Destino *
                  </label>
                  <select
                    required
                    value={centroCostoId}
                    onChange={(e) => setCentroCostoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] font-semibold"
                  >
                    <option value="">Selecciona centro de costo...</option>
                    {centrosCosto.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.codigo} - {cc.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    RUT (Opcional)
                  </label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Box / Área de Trabajo
                  </label>
                  <input
                    type="text"
                    value={areaTrabajo}
                    onChange={(e) => setAreaTrabajo(e.target.value)}
                    placeholder="Box Dental 2 / Pabellón"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262]"
                  />
                </div>
              </div>
            </div>

            {/* Materiales List Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                📦 Detalle de Materiales ({validItemsWithProduct.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 max-h-56 overflow-y-auto pr-1 hide-scrollbar">
                {validItemsWithProduct.map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md shrink-0">
                        {item.product?.codigo || 'COD'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.product?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {item.cantidad} {item.product?.unidad || 'UND'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error inside modal */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-800 dark:text-red-300 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Action Buttons inside modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                <span>Volver a Editar</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinalSubmit}
                className="py-3 px-4 bg-[#227262] hover:bg-[#1a5b4e] text-white font-black text-xs rounded-xl transition-all active-scale-down shadow-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? "Enviando Solicitud..." : "Confirmar y Enviar Solicitud"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN EXITOSA */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
              <PackageCheck className="h-8 w-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Solicitud Procesada
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ¡Solicitud Enviada con Éxito!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tu requerimiento fue registrado en la base de datos y un operador de bodega lo procesará a la brevedad.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setNombre("");
                setRut("");
                setAreaTrabajo("");
                setCargo("");
                setCentroCostoId("");
                setItems([{ productoId: "", cantidad: 1 }]);
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md active-scale-down cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Crear Nueva Solicitud</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
