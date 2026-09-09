'use client';

import { useState } from "react";
import { Check, X, Calendar, User, Briefcase, MapPin, ShoppingBag, AlertTriangle, CheckCircle2, Warehouse, PackageX, MessageSquare, Clock, Truck, Layers, XCircle, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface SolicitudItem {
  id: string;
  productoId: string;
  cantidad: number; // 1. Solicitado
  cantidadEnviada: number | null; // 2. Enviado
  cantidadRecepcionada: number | null; // 3. Recepcionado
  product: {
    codigo: string;
    nombre: string;
    unidad: string | null;
    stockTotal?: number;
    stocks?: {
      bodegaId?: string;
      bodega: string;
      sucursalId?: string;
      sucursalNombre?: string;
      cantidad: number;
    }[];
  };
}

interface Solicitud {
  id: string;
  fecha: string;
  nombre: string;
  rut: string | null;
  areaTrabajo: string | null;
  cargo: string | null;
  estado: string;
  observacionRespuesta?: string | null;
  sucursal?: {
    id: string;
    nombre: string;
  } | null;
  centroCosto: {
    codigo: string;
    nombre: string;
  };
  items: SolicitudItem[];
}

interface Props {
  solicitudes: Solicitud[];
  currentUser?: {
    id: string;
    nombre: string;
    role: string;
    sucursales: { id: string; nombre: string }[];
    bodegas: { id: string; nombre: string }[];
  } | null;
  updateStatusAction: (
    solicitudId: string, 
    status: "DESPACHADA" | "RECHAZADA", 
    observacion?: string,
    itemsEnviados?: { id: string; cantidadEnviada: number }[]
  ) => Promise<{ success: boolean }>;
}

export default function ClientSolicitudesList({ solicitudes, currentUser, updateStatusAction }: Props) {
  const [filter, setFilter] = useState<"TODAS" | "PENDIENTE" | "DESPACHADA" | "RECEPCIONADA" | "RECHAZADA">("PENDIENTE");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Estado para el modal de contestación y digitación de insumos enviados
  const [actionModal, setActionModal] = useState<{
    solicitud: Solicitud;
    status: "DESPACHADA" | "RECHAZADA";
  } | null>(null);
  const [cantidadesEnviadas, setCantidadesEnviadas] = useState<{ [itemId: string]: string }>({});
  const [comentario, setComentario] = useState("");

  const router = useRouter();

  const handleOpenActionModal = (solicitud: Solicitud, status: "DESPACHADA" | "RECHAZADA") => {
    setActionModal({ solicitud, status });
    setComentario("");
    // Iniciar campos vacíos para que el bodeguero digite lo que envía
    const initEnv: { [itemId: string]: string } = {};
    solicitud.items.forEach(it => {
      initEnv[it.id] = it.cantidadEnviada !== null && it.cantidadEnviada !== undefined 
        ? it.cantidadEnviada.toString() 
        : "";
    });
    setCantidadesEnviadas(initEnv);
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setLoadingId(actionModal.solicitud.id);
    try {
      const itemsPayload = actionModal.status === "DESPACHADA" 
        ? actionModal.solicitud.items.map(it => ({
            id: it.id,
            cantidadEnviada: parseInt(cantidadesEnviadas[it.id] || "0") || 0
          }))
        : undefined;

      const res = await updateStatusAction(
        actionModal.solicitud.id, 
        actionModal.status, 
        comentario,
        itemsPayload
      );
      if (res.success) {
        setActionModal(null);
        setComentario("");
        router.refresh();
      }
    } catch (err) {
      alert("Error al responder la solicitud");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = solicitudes.filter(s => {
    if (filter === "TODAS") return true;
    return s.estado === filter;
  });

  return (
    <div className="space-y-5">
      {/* Tabs / Filters */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {(["PENDIENTE", "DESPACHADA", "RECEPCIONADA", "RECHAZADA", "TODAS"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${filter === tab
                ? "border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            {tab === "PENDIENTE" && (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>Pendientes de Despacho</span>
              </>
            )}
            {tab === "DESPACHADA" && (
              <>
                <Truck className="h-3.5 w-3.5" />
                <span>Despachadas (En Tránsito)</span>
              </>
            )}
            {tab === "RECEPCIONADA" && (
              <>
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Recepcionadas por Consumidor</span>
              </>
            )}
            {tab === "RECHAZADA" && (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Rechazadas</span>
              </>
            )}
            {tab === "TODAS" && (
              <>
                <Layers className="h-3.5 w-3.5" />
                <span>Todas</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No hay solicitudes en esta sección</p>
          </div>
        ) : (
          filtered.map(solicitud => {
            const allItemsHaveStock = solicitud.items.every(item => (item.product.stockTotal ?? 0) >= item.cantidad);
            const someItemsHaveZeroStock = solicitud.items.some(item => (item.product.stockTotal ?? 0) === 0);

            return (
              <div
                key={solicitud.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border flex flex-col justify-between gap-5 transition-all ${
                  solicitud.estado === "PENDIENTE" && !allItemsHaveStock
                    ? "border-amber-300 dark:border-amber-900/60 hover:border-amber-400"
                    : "border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-md"
                }`}
              >
                {/* Request details */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        solicitud.estado === "PENDIENTE" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                        solicitud.estado === "DESPACHADA" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                        solicitud.estado === "RECEPCIONADA" ? (
                          solicitud.items.some(it => typeof it.cantidadRecepcionada === "number" && typeof it.cantidadEnviada === "number" && it.cantidadRecepcionada < it.cantidadEnviada)
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        ) :
                        "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      }`}>
                        {solicitud.estado === "PENDIENTE" ? (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Pendiente</span>
                          </>
                        ) : solicitud.estado === "DESPACHADA" ? (
                          <>
                            <Truck className="h-3 w-3" />
                            <span>Despachada</span>
                          </>
                        ) : solicitud.estado === "RECEPCIONADA" ? (
                          solicitud.items.some(it => typeof it.cantidadRecepcionada === "number" && typeof it.cantidadEnviada === "number" && it.cantidadRecepcionada < it.cantidadEnviada) ? (
                            <>
                              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              <span>Recepcionada con Diferencia</span>
                            </>
                          ) : (
                            <>
                              <PackageCheck className="h-3 w-3" />
                              <span>Recepcionada</span>
                            </>
                          )
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Rechazada</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1" suppressHydrationWarning>
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(solicitud.fecha).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    {/* Stock Feasibility Badge for Bodeguero */}
                    {solicitud.estado === "PENDIENTE" && (
                      <div className="flex items-center gap-1.5">
                        {allItemsHaveStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Stock Disponible Completo
                          </span>
                        ) : someItemsHaveZeroStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <PackageX className="h-3.5 w-3.5" /> Quiebre / Sin Stock en Bodega
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5" /> Stock Parcial / Insuficiente
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Branch Matching Warning Banner if request belongs to another sucursal */}
                  {(() => {
                    if (!currentUser || currentUser.role === 'ADMIN') return null;
                    if (!solicitud.sucursal) return null;
                    const userSucursalIds = currentUser.sucursales.map(s => s.id);
                    const isMismatched = userSucursalIds.length > 0 && !userSucursalIds.includes(solicitud.sucursal.id);
                    if (!isMismatched) return null;

                    return (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-semibold">
                          ⚠️ Solicitud originada para <strong className="underline">{solicitud.sucursal.nombre}</strong>. Tus permisos de operador están configurados para {currentUser.sucursales.map(s => s.nombre).join(', ')}.
                        </span>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{solicitud.nombre}</span>
                      {solicitud.rut && <span className="text-[10px] text-slate-400">({solicitud.rut})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="truncate font-semibold">CC: {solicitud.centroCosto.codigo} - {solicitud.centroCosto.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="truncate font-medium">
                        {solicitud.cargo || "Personal Clínico"} {solicitud.areaTrabajo ? `| ${solicitud.areaTrabajo}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-[#227262] dark:text-teal-400 flex-shrink-0" />
                      <span className="truncate font-bold text-slate-700 dark:text-slate-200">
                        {solicitud.sucursal?.nombre || "Sucursal General"}
                      </span>
                    </div>
                  </div>

                  {/* TABLA DE 5 COLUMNAS DEL BODEGUERO */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Detalle y Control de 5 Columnas (Despacho vs Recepción):
                      </p>
                      {solicitud.estado === "PENDIENTE" && (
                        <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                          Presiona &ldquo;Despachar Pedido&rdquo; para digitar insumos enviados
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3">Producto / Código</th>
                            <th className="py-2.5 px-2.5 text-center w-28 bg-slate-200/50 dark:bg-slate-700/50">
                              1. Insumo Solicitado
                            </th>
                            <th className="py-2.5 px-2.5 text-center w-28 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                              2. Insumo Enviado
                            </th>
                            <th className="py-2.5 px-2.5 text-center w-28 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                              3. Recepcionado por Consumidor
                            </th>
                            <th className="py-2.5 px-2.5 text-center w-24">
                              4. Saldo Entrada
                            </th>
                            <th className="py-2.5 px-2.5 text-center w-24">
                              5. Saldo Solicitud
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {solicitud.items.map(item => {
                            const solicitado = item.cantidad;
                            const enviado = item.cantidadEnviada;
                            const recepcionado = item.cantidadRecepcionada;

                            // 4. Saldo por Entrada: Enviado - Recepcionado (si ya se recepcionó)
                            const saldoEntrada = (enviado !== null && recepcionado !== null) 
                              ? enviado - recepcionado 
                              : null;

                            // 5. Saldo por Solicitud: Solicitado - Enviado (lo que quedó pendiente de entrega)
                            const saldoSolicitud = enviado !== null 
                              ? solicitado - enviado 
                              : null;

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-sm">
                                    {item.product.nombre}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                    <span>[{item.product.codigo}]</span>
                                    <span>•</span>
                                    <span>{item.product.unidad || "UND"}</span>
                                    {item.product.stockTotal !== undefined && (
                                      <>
                                        <span>•</span>
                                        <span className={item.product.stockTotal >= item.cantidad ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                          Stock disp: {item.product.stockTotal}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </td>

                                {/* 1. Insumo Solicitado */}
                                <td className="py-2.5 px-2.5 text-center font-mono font-black text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30">
                                  {solicitado}
                                </td>

                                {/* 2. Insumo Enviado */}
                                <td className="py-2.5 px-2.5 text-center font-mono font-black bg-blue-50/30 dark:bg-blue-950/20">
                                  {enviado !== null ? (
                                    <span className="text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                                      {enviado}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic text-[11px]">-</span>
                                  )}
                                </td>

                                {/* 3. Recepcionado por Consumidor */}
                                <td className="py-2.5 px-2.5 text-center font-mono font-black bg-emerald-50/30 dark:bg-emerald-950/20">
                                  {recepcionado !== null ? (
                                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                                      {recepcionado}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic text-[11px]">Pendiente</span>
                                  )}
                                </td>

                                {/* 4. Saldo por Entrada (Diferencia de Recepción) */}
                                <td className="py-2.5 px-2.5 text-center font-mono font-black">
                                  {saldoEntrada !== null ? (
                                    <span className={`px-2 py-0.5 rounded-md ${
                                      saldoEntrada === 0 
                                        ? "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" 
                                        : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70"
                                    }`}>
                                      {saldoEntrada > 0 ? `+${saldoEntrada}` : saldoEntrada}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">-</span>
                                  )}
                                </td>

                                {/* 5. Saldo por Solicitud (Pendiente de Despacho) */}
                                <td className="py-2.5 px-2.5 text-center font-mono font-black">
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
                  </div>

                  {/* Observación previa del bodeguero si ya fue respondida */}
                  {solicitud.observacionRespuesta && (
                    <div className="mt-2 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-2.5 text-xs text-teal-900 dark:text-teal-200">
                      <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                          Comentario registrado para el solicitante:
                        </span>
                        <p className="font-medium italic text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                          &ldquo;{solicitud.observacionRespuesta}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {solicitud.estado === "PENDIENTE" && (
                  <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled={loadingId !== null}
                      onClick={() => handleOpenActionModal(solicitud, "RECHAZADA")}
                      className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 font-extrabold rounded-xl text-xs transition-all active-scale-down border border-red-200 dark:border-red-900 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="h-4 w-4 inline mr-1" /> Rechazar Solicitud
                    </button>
                    <button
                      disabled={loadingId !== null}
                      onClick={() => handleOpenActionModal(solicitud, "DESPACHADA")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all active-scale-down shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Despachar Insumos (Digitar Enviado)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL INTERACTIVO PARA DIGITAR INSUMOS ENVIADOS Y DESPACHAR O RECHAZAR */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-2xl w-full space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  actionModal.status === "DESPACHADA"
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                }`}>
                  {actionModal.status === "DESPACHADA" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {actionModal.status === "DESPACHADA" ? "Despachar y Digitar Insumos Enviados" : "Rechazar Solicitud de Materiales"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Solicitante: <strong className="text-slate-700 dark:text-slate-200">{actionModal.solicitud.nombre}</strong> ({actionModal.solicitud.centroCosto.codigo})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TABLA DE DIGITACIÓN DE INSUMOS ENVIADOS */}
            {actionModal.status === "DESPACHADA" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                    Digita la cantidad exacta enviada para cada insumo:
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Los saldos por solicitud se actualizarán automáticamente)
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-3">Insumo</th>
                        <th className="py-2 px-2.5 text-center w-24">1. Solicitado</th>
                        <th className="py-2 px-2.5 text-center w-32 bg-blue-100/50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200">
                          2. Insumo Enviado *
                        </th>
                        <th className="py-2 px-2.5 text-center w-24">5. Saldo Solicitud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {actionModal.solicitud.items.map(item => {
                        const valEnv = cantidadesEnviadas[item.id] !== undefined ? cantidadesEnviadas[item.id] : "";
                        const numEnv = parseInt(valEnv) || 0;
                        const saldo = item.cantidad - numEnv;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs">
                                {item.product.nombre}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                [{item.product.codigo}] • Disp. Total: {item.product.stockTotal ?? 0} {item.product.unidad || "UND"}
                              </div>
                              {/* Desglose por Bodega para máxima transparencia */}
                              {item.product.stocks && item.product.stocks.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {item.product.stocks.map((st, idx) => {
                                    const isPermittedBodega = currentUser?.role === 'ADMIN' || 
                                      currentUser?.bodegas.some(b => b.id === st.bodegaId) ||
                                      currentUser?.sucursales.some(s => s.id === st.sucursalId);

                                    return (
                                      <span 
                                        key={idx}
                                        className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${
                                          isPermittedBodega
                                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 font-bold'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                        }`}
                                      >
                                        <span>{st.bodega}:</span>
                                        <strong>{st.cantidad}</strong>
                                        {isPermittedBodega && <span className="text-[7.5px] text-teal-600 font-extrabold">(Tu Bodega)</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-2.5 text-center font-mono font-black text-slate-700 dark:text-slate-300">
                              {item.cantidad}
                            </td>

                            {/* Campo editable digitado por el bodeguero */}
                            <td className="py-2 px-2.5 text-center bg-blue-50/30 dark:bg-blue-950/20">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.cantidad}
                                  placeholder="0"
                                  value={valEnv}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCantidadesEnviadas(prev => ({
                                      ...prev,
                                      [item.id]: val
                                    }));
                                  }}
                                  className="w-20 px-2 py-1.5 text-xs text-center font-mono font-black bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                                />
                                <span className="text-[10px] text-slate-400">
                                  {item.product.unidad || "UND"}
                                </span>
                              </div>
                            </td>

                            {/* Saldo de la solicitud en tiempo real */}
                            <td className="py-2 px-2.5 text-center font-mono font-black">
                              <span className={`px-2 py-0.5 rounded-md ${
                                saldo === 0 
                                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50" 
                                  : saldo > 0 
                                  ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50" 
                                  : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50"
                              }`}>
                                {valEnv === "" ? "-" : saldo}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Campo de Comentario / Observación */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Observación para el solicitante (Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={
                  actionModal.status === "DESPACHADA"
                    ? "Ej: Se entregan 8 unidades debido a que el saldo restante viene en camino con proveedor..."
                    : "Ej: Solicitud rechazada por falta de justificación o quiebre total del insumo..."
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Botones de Confirmación */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={loadingId !== null}
                className="px-4 py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={loadingId !== null}
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 text-xs font-black rounded-xl text-white shadow-sm transition-all active-scale-down cursor-pointer flex items-center gap-2 ${
                  actionModal.status === "DESPACHADA"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {loadingId ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    {actionModal.status === "DESPACHADA" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Confirmar {actionModal.status === "DESPACHADA" ? "Despacho de Insumos" : "Rechazo"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
