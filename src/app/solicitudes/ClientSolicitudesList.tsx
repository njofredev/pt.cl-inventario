'use client';

import { useState } from "react";
import { Check, X, Calendar, User, Briefcase, MapPin, ShoppingBag, AlertTriangle, CheckCircle2, Warehouse, PackageX } from "lucide-react";
import { useRouter } from "next/navigation";

interface SolicitudItem {
  id: string;
  productoId: string;
  cantidad: number;
  product: {
    codigo: string;
    nombre: string;
    unidad: string | null;
    stockTotal?: number;
    stocks?: {
      bodega: string;
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
  centroCosto: {
    codigo: string;
    nombre: string;
  };
  items: SolicitudItem[];
}

interface Props {
  solicitudes: Solicitud[];
  updateStatusAction: (solicitudId: string, status: "APROBADA" | "RECHAZADA") => Promise<{ success: boolean }>;
}

export default function ClientSolicitudesList({ solicitudes, updateStatusAction }: Props) {
  const [filter, setFilter] = useState<"TODAS" | "PENDIENTE" | "APROBADA" | "RECHAZADA">("PENDIENTE");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdateStatus = async (id: string, status: "APROBADA" | "RECHAZADA") => {
    setLoadingId(id);
    try {
      const res = await updateStatusAction(id, status);
      if (res.success) {
        router.refresh();
      }
    } catch (err) {
      alert("Error al actualizar la solicitud");
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
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {(["PENDIENTE", "APROBADA", "RECHAZADA", "TODAS"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 cursor-pointer ${filter === tab
                ? "border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            {tab === "PENDIENTE" && "Pendientes"}
            {tab === "APROBADA" && "Aprobadas"}
            {tab === "RECHAZADA" && "Rechazadas"}
            {tab === "TODAS" && "Todas"}
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
            // Check if every product has enough stock
            const allItemsHaveStock = solicitud.items.every(item => (item.product.stockTotal ?? 0) >= item.cantidad);
            const someItemsHaveZeroStock = solicitud.items.some(item => (item.product.stockTotal ?? 0) === 0);

            return (
              <div
                key={solicitud.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border flex flex-col md:flex-row justify-between gap-5 transition-all ${
                  solicitud.estado === "PENDIENTE" && !allItemsHaveStock
                    ? "border-amber-300 dark:border-amber-900/60 hover:border-amber-400"
                    : "border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-md"
                }`}
              >
                {/* Request details */}
                <div className="space-y-3.5 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        solicitud.estado === "PENDIENTE" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                        solicitud.estado === "APROBADA" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                        "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      }`}>
                        {solicitud.estado}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
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
                        {solicitud.cargo || "Sin cargo"} {solicitud.areaTrabajo ? `| ${solicitud.areaTrabajo}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Items list with detailed stock breakdown */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Insumos solicitados y Disponibilidad de Stock:</p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1">
                      {solicitud.items.map(item => {
                        const stockActual = item.product.stockTotal ?? 0;
                        const tieneStockSuficiente = stockActual >= item.cantidad;

                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-2 text-xs gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                                  {item.product.nombre}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({item.product.codigo})
                                </span>
                              </div>
                              {item.product.stocks && item.product.stocks.length > 0 && (
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <Warehouse className="h-3 w-3 text-slate-400" />
                                  <span>
                                    En bodegas: {item.product.stocks.map(s => `${s.bodega}: ${s.cantidad}`).join(" | ")}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Stock status indicator */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Stock:
                                </span>
                                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                                  tieneStockSuficiente
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    : stockActual > 0
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                    : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                }`}>
                                  {stockActual} disp.
                                </span>
                              </div>

                              {/* Solicitado */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Pedido:
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-md">
                                  {item.cantidad} {item.product.unidad || "UND"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {solicitud.estado === "PENDIENTE" && (
                  <div className="flex md:flex-col justify-end items-stretch gap-2 min-w-[140px]">
                    <button
                      disabled={loadingId !== null}
                      onClick={() => handleUpdateStatus(solicitud.id, "APROBADA")}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all active-scale-down shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Aprobar
                    </button>
                    <button
                      disabled={loadingId !== null}
                      onClick={() => handleUpdateStatus(solicitud.id, "RECHAZADA")}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 font-extrabold rounded-xl text-xs transition-all active-scale-down border border-red-200 dark:border-red-900 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="h-4 w-4" /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
