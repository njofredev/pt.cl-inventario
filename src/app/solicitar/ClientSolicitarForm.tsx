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
  AlertTriangle,
  MessageSquare,
  Truck,
  XCircle,
  Bell,
  Warehouse
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
  cantidad: number; // 1. Cantidad Solicitada
  cantidadEnviada?: number | null; // 2. Enviado por bodega
  cantidadRecepcionada?: number | null; // 3. Recepcionado por consumidor
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
  observacionRespuesta?: string | null;
  centroCosto: {
    codigo: string;
    nombre: string;
  };
  items: UserSolicitudItem[];
}

interface DestinoItem {
  id: string;
  nombre: string;
  sucursalId?: string;
  sucursalNombre?: string;
}

interface SucursalItem {
  id: string;
  nombre: string;
}

interface Props {
  centrosCosto: CC[];
  destinos?: DestinoItem[];
  sucursales?: SucursalItem[];
  productos: ProductCatalogItem[];
  currentUser?: {
    id?: string;
    nombre: string;
    username: string;
    rut?: string | null;
    areaTrabajo?: string | null;
    cargo?: string | null;
    role: string;
    sucursales?: { id: string; nombre: string }[];
    bodegas?: { id: string; nombre: string }[];
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
  recepcionarSolicitudAction?: (
    solicitudId: string,
    itemsRecepcionados: { id: string; cantidadRecepcionada: number }[]
  ) => Promise<{ success: boolean }>;
}

export default function ClientSolicitarForm({ 
  centrosCosto, 
  destinos = [],
  sucursales = [],
  productos, 
  currentUser, 
  userSolicitudes = [], 
  initialTab = 'BUSCADOR', 
  submitRequestAction,
  recepcionarSolicitudAction
}: Props) {
  // Datos del Solicitante (Pre-llenado automático con RUT y Área si ha iniciado sesión)
  const [nombre, setNombre] = useState(currentUser?.nombre || "");
  const [rut, setRut] = useState(currentUser?.rut || "");
  const [areaTrabajo, setAreaTrabajo] = useState(currentUser?.areaTrabajo || "");
  const [cargo, setCargo] = useState(currentUser?.cargo || (currentUser?.role === 'CONSUMIDOR' ? 'Personal Clínico' : ""));
  const [centroCostoId, setCentroCostoId] = useState("");
  
  // Canasta unificada de la solicitud
  const [items, setItems] = useState<{ productoId: string; cantidad: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identificación de Sucursal (pre-seleccionada por sucursal del usuario o por defecto)
  const defaultSucursalId = currentUser?.sucursales && currentUser.sucursales.length > 0 
    ? currentUser.sucursales[0].id 
    : (sucursales[0]?.id || "");
  const [selectedSucursalId, setSelectedSucursalId] = useState<string>(defaultSucursalId);

  // Sincronizar datos de usuario si cambian o cargan
  useEffect(() => {
    if (currentUser) {
      if (currentUser.nombre && !nombre) setNombre(currentUser.nombre);
      if (currentUser.rut && !rut) setRut(currentUser.rut);
      if (currentUser.areaTrabajo && !areaTrabajo) setAreaTrabajo(currentUser.areaTrabajo);
      if (currentUser.cargo && !cargo) setCargo(currentUser.cargo);
      if (currentUser.sucursales && currentUser.sucursales.length > 0 && !selectedSucursalId) {
        setSelectedSucursalId(currentUser.sucursales[0].id);
      }
    }
  }, [currentUser]);

  // Estado para la digitación de recepción por el consumidor
  const [recepcionValues, setRecepcionValues] = useState<{ [itemId: string]: string }>({});
  const [loadingRecepcionId, setLoadingRecepcionId] = useState<string | null>(null);

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
  const activeSucursal = sucursales.find(s => s.id === selectedSucursalId) || (currentUser?.sucursales?.[0]);
  const activeSucursalName = activeSucursal?.nombre || "";
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
                  userSucursalName={activeSucursalName}
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
                userSucursalName={activeSucursalName}
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
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              sol.estado === "PENDIENTE" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                              sol.estado === "DESPACHADA" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                              sol.estado === "RECEPCIONADA" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                              "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            }`}>
                              {sol.estado === "PENDIENTE" ? (
                                <>
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>Pendiente Bodega</span>
                                </>
                              ) : sol.estado === "DESPACHADA" ? (
                                <>
                                  <Truck className="h-2.5 w-2.5" />
                                  <span>Despachada (En Tránsito)</span>
                                </>
                              ) : sol.estado === "RECEPCIONADA" ? (
                                <>
                                  <PackageCheck className="h-2.5 w-2.5" />
                                  <span>Recepción Conforme</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-2.5 w-2.5" />
                                  <span>Rechazada</span>
                                </>
                              )}
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
                            {sol.estado === "DESPACHADA" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <Bell className="h-3 w-3" /> Insumos despachados: digita lo recibido
                              </span>
                            ) : allHaveStock ? (
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

                        {/* TABLA DE 5 COLUMNAS DEL CONSUMIDOR */}
                        <div className="space-y-2">
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                  <th className="py-2 px-3">Producto</th>
                                  <th className="py-2 px-2 text-center w-24 bg-slate-200/50 dark:bg-slate-700/50">
                                    1. Cant. Solicitada
                                  </th>
                                  <th className="py-2 px-2 text-center w-24 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                                    2. Enviado x Bodega
                                  </th>
                                  <th className="py-2 px-2 text-center w-32 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                                    3. Recepcionado
                                  </th>
                                  <th className="py-2 px-2 text-center w-24">
                                    4. Saldo Recepción
                                  </th>
                                  <th className="py-2 px-2 text-center w-24">
                                    5. Saldo Solicitud
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                {sol.items.map((it) => {
                                  const solicitada = it.cantidad;
                                  const enviada = it.cantidadEnviada;
                                  const estaDespachada = sol.estado === "DESPACHADA";
                                  const estaRecepcionada = sol.estado === "RECEPCIONADA";

                                  // Valor actual digitado o registrado
                                  const currentVal = recepcionValues[it.id] !== undefined
                                    ? recepcionValues[it.id]
                                    : it.cantidadRecepcionada !== null && it.cantidadRecepcionada !== undefined
                                    ? it.cantidadRecepcionada.toString()
                                    : "";

                                  const numRecepcionado = parseInt(currentVal) || 0;

                                  // 4. Saldo por Recepción: Enviado - Recepcionado
                                  const saldoRecepcion = enviada !== null && enviada !== undefined
                                    ? (currentVal !== "" ? enviada - numRecepcionado : null)
                                    : null;

                                  // 5. Saldo de Solicitud: Solicitada - Enviada (lo que bodega debió entregar y no envió)
                                  const saldoSolicitud = enviada !== null && enviada !== undefined
                                    ? solicitada - enviada
                                    : null;

                                  return (
                                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                                      <td className="py-2 px-3">
                                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs text-[11px]">
                                          {it.product.nombre}
                                        </p>
                                        <span className="text-[9px] font-mono text-slate-400">
                                          [{it.product.codigo}] • {it.product.unidad || 'UND'}
                                        </span>
                                      </td>

                                      {/* 1. Cantidad Solicitada */}
                                      <td className="py-2 px-2 text-center font-mono font-black text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30">
                                        {solicitada}
                                      </td>

                                      {/* 2. Enviado por Bodega */}
                                      <td className="py-2 px-2 text-center font-mono font-black bg-blue-50/30 dark:bg-blue-950/20">
                                        {enviada !== null && enviada !== undefined ? (
                                          <span className="text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                                            {enviada}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal italic text-[11px]">-</span>
                                        )}
                                      </td>

                                      {/* 3. Cantidad Recepcionada (digitada por el consumidor si está despachada) */}
                                      <td className="py-2 px-2 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                                        {estaDespachada ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              max={enviada ?? solicitada}
                                              placeholder="0"
                                              value={currentVal}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setRecepcionValues(prev => ({
                                                  ...prev,
                                                  [it.id]: val
                                                }));
                                              }}
                                              className="w-16 px-1.5 py-1 text-xs text-center font-mono font-black bg-white dark:bg-slate-800 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                                            />
                                          </div>
                                        ) : estaRecepcionada ? (
                                          <span className="text-emerald-700 dark:text-emerald-300 font-mono font-black bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                                            {it.cantidadRecepcionada ?? "-"}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal italic text-[11px]">En espera</span>
                                        )}
                                      </td>

                                      {/* 4. Saldo por Recepción */}
                                      <td className="py-2 px-2 text-center font-mono font-black">
                                        {saldoRecepcion !== null ? (
                                          <span className={`px-2 py-0.5 rounded-md ${
                                            saldoRecepcion === 0 
                                              ? "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" 
                                              : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70"
                                          }`}>
                                            {saldoRecepcion > 0 ? `+${saldoRecepcion}` : saldoRecepcion}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">-</span>
                                        )}
                                      </td>

                                      {/* 5. Saldo de la Solicitud */}
                                      <td className="py-2 px-2 text-center font-mono font-black">
                                        {saldoSolicitud !== null ? (
                                          <span className={`px-2 py-0.5 rounded-md ${
                                            saldoSolicitud === 0 
                                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" 
                                              : "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70"
                                          }`}>
                                            {saldoSolicitud}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* BOTÓN DE CONFIRMAR RECEPCIÓN POR EL CONSUMIDOR */}
                          {sol.estado === "DESPACHADA" && (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 font-medium">
                                Digita la cantidad física que te llegó en cada insumo y presiona Confirmar:
                              </span>
                              <button
                                type="button"
                                disabled={loadingRecepcionId === sol.id}
                                onClick={async () => {
                                  if (!recepcionarSolicitudAction) return;
                                  setLoadingRecepcionId(sol.id);
                                  try {
                                    const itemsPayload = sol.items.map(it => ({
                                      id: it.id,
                                      cantidadRecepcionada: parseInt(recepcionValues[it.id] || "0") || 0
                                    }));
                                    const res = await recepcionarSolicitudAction(sol.id, itemsPayload);
                                    if (res.success) {
                                      window.location.reload();
                                    }
                                  } catch (err) {
                                    alert("Error al confirmar la recepción");
                                  } finally {
                                    setLoadingRecepcionId(null);
                                  }
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="h-4 w-4" />
                                <span>{loadingRecepcionId === sol.id ? "Guardando..." : "Confirmar Recepción de Insumos"}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Observación / Comentario del Bodeguero si fue respondida */}
                        {sol.observacionRespuesta && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs flex items-start gap-2 text-teal-900 dark:text-teal-200">
                            <MessageSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 block">
                                Respuesta de Bodega:
                              </span>
                              <p className="font-medium italic text-slate-700 dark:text-slate-200 text-[11px] whitespace-pre-wrap break-words">
                                &ldquo;{sol.observacionRespuesta}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

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

            {/* Datos Solicitante & Destino Simplificado y Claro */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
              {/* Tarjeta de Identificación del Solicitante (Autocargado) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[#227262] dark:text-teal-400 flex items-center justify-center font-black text-xs shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                      {nombre || currentUser?.nombre || "Usuario Solicitante"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {cargo || (currentUser?.role === 'CONSUMIDOR' ? 'Personal Clínico' : 'Solicitante')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">RUT</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-[11px] font-mono font-black text-[#227262] dark:text-teal-300">
                    {rut || currentUser?.rut || "No registrado"}
                  </span>
                </div>
              </div>

              {/* Selector / Indicador de Sucursal Destino */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-[#227262] dark:text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                      Sucursal del Requerimiento:
                    </span>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Los inventarios y cajas de destino se calibran según esta sede.
                    </p>
                  </div>
                </div>

                {/* Sucursal fija preasignada al usuario */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-100/80 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700">
                  <CheckCircle2 className="h-4 w-4 text-[#227262] dark:text-teal-300 shrink-0" />
                  <span className="text-xs font-black text-[#227262] dark:text-teal-200">
                    {activeSucursalName || "Sucursal Asignada"}
                  </span>
                  <span className="text-[10px] font-bold text-teal-700/80 dark:text-teal-300/80 bg-teal-200/60 dark:bg-teal-800/60 px-1.5 py-0.5 rounded-md ml-0.5">
                    (Asignada por Sistema)
                  </span>
                </div>
              </div>

              {/* Selección de Destino: Box y Centro de Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Box / Área de Trabajo con Destinos Registrados y Filtrados por Sucursal */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-teal-600" />
                    Box / Área de Trabajo *
                  </label>
                  <select
                    required
                    value={areaTrabajo}
                    onChange={(e) => setAreaTrabajo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] font-semibold text-slate-800 dark:text-slate-100 shadow-sm"
                  >
                    <option value="">Selecciona Box o Lugar registrado...</option>
                    {/* Filtramos destinos por la sucursal activa */}
                    {(() => {
                      const branchDestinos = destinos.filter(d => !d.sucursalId || d.sucursalId === selectedSucursalId);
                      if (branchDestinos.length > 0) {
                        return branchDestinos.map(d => (
                          <option key={d.id} value={d.nombre}>
                            {d.nombre} {d.sucursalNombre ? `(${d.sucursalNombre})` : ''}
                          </option>
                        ));
                      }
                      if (destinos.length > 0) {
                        return destinos.map(d => (
                          <option key={d.id} value={d.nombre}>
                            {d.nombre}
                          </option>
                        ));
                      }
                      return (
                        <>
                          <option value="Box dental 1 - 1er piso">Box dental 1 - 1er piso</option>
                          <option value="Box dental 2 - 1er piso">Box dental 2 - 1er piso</option>
                          <option value="Box dental 3 - 1er piso">Box dental 3 - 1er piso</option>
                          <option value="Sala esterilización - 1er piso">Sala esterilización - 1er piso</option>
                          <option value="Sala Laboratorio - 1er piso">Sala Laboratorio - 1er piso</option>
                          <option value="Recepción 1">Recepción 1</option>
                        </>
                      );
                    })()}
                  </select>
                </div>

                {/* Centro de Costo Destino */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-teal-600" />
                    Centro de Costo Destino *
                  </label>
                  <select
                    required
                    value={centroCostoId}
                    onChange={(e) => setCentroCostoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] font-semibold text-slate-800 dark:text-slate-100 shadow-sm"
                  >
                    <option value="">Selecciona centro de costo...</option>
                    {centrosCosto.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.codigo} - {cc.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Materiales List Summary con Transparencia de Stock por Sucursal */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-teal-600" />
                Detalle de Materiales ({validItemsWithProduct.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                {validItemsWithProduct.map((item, i) => {
                  const currentSucursalStock = item.product?.stocksBySucursal?.find(s => s.sucursalId === selectedSucursalId)?.cantidad ?? 0;
                  const isStockShortageInBranch = currentSucursalStock < item.cantidad;

                  return (
                    <div key={i} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md shrink-0">
                            {item.product?.codigo || 'COD'}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
                            {item.product?.nombre}
                          </span>
                        </div>

                        {/* Breakdown de stock transparente */}
                        {item.product?.stocksBySucursal && item.product.stocksBySucursal.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                            <span className="text-slate-400 font-medium">Stock disponible:</span>
                            {item.product.stocksBySucursal.map(s => {
                              const isSelectedBranch = s.sucursalId === selectedSucursalId;
                              return (
                                <span
                                  key={s.sucursalId}
                                  className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                                    isSelectedBranch
                                      ? s.cantidad >= item.cantidad
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {s.sucursalNombre}: {s.cantidad}
                                  {isSelectedBranch ? ' (Esta Sede)' : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          {item.cantidad} {item.product?.unidad || 'UND'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerta de advertencia si algún producto no tiene stock suficiente en la sucursal seleccionada */}
            {(() => {
              const shortageItems = validItemsWithProduct.filter(item => {
                const curStock = item.product?.stocksBySucursal?.find(s => s.sucursalId === selectedSucursalId)?.cantidad ?? 0;
                return curStock < item.cantidad;
              });

              if (shortageItems.length > 0) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <strong className="block font-black text-[11px] text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                        Aviso de Stock en {activeSucursalName || 'tu sucursal'}
                      </strong>
                      <p className="text-[11px] leading-relaxed">
                        {shortageItems.length === 1
                          ? `El producto "${shortageItems[0].product?.nombre}" supera el stock local disponible en ${activeSucursalName || 'esta sede'}.`
                          : `Hay ${shortageItems.length} insumos que superan el stock local en ${activeSucursalName || 'esta sede'}.`
                        } Bodega podrá despachar parcialmente o coordinar traslado desde otra sede si corresponde.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

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
