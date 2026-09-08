'use client';

import { useState, useEffect } from "react";
import {
  X,
  Database,
  MapPin,
  History,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Save,
  ArrowRightLeft,
  Calendar,
  Layers,
  DollarSign,
  Building2,
  FileText,
  Truck,
  User,
  Hash,
  Tag,
  Warehouse,
  ArrowUpDown,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getProductDetailsAction, updateProductAction, deleteProductAction } from "./actions";
import Link from "next/link";
import UnitSelect from "@/components/UnitSelect";

interface ProductDetailModalProps {
  productId: string;
  cuentasContables: { id: string; codigo: string; nombre: string }[];
  unidadesMedida?: { id: string; nombre: string }[];
  onClose: () => void;
}

export default function ProductDetailModal({ productId, cuentasContables, unidadesMedida = [], onClose }: ProductDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"INSPECTION" | "LOCATIONS" | "MOVEMENTS" | "EDIT">("INSPECTION");
  const [copiedId, setCopiedId] = useState(false);
  const [movementsSortOrder, setMovementsSortOrder] = useState<"asc" | "desc">("desc");
  const [movementsPage, setMovementsPage] = useState(1);
  const MOVEMENTS_PER_PAGE = 4;

  // Edit states
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("UND");
  const [stockCritico, setStockCritico] = useState("5");
  const [cuentaContableId, setCuentaContableId] = useState("");

  // Unit conversion edit states
  const [unidadCompra, setUnidadCompra] = useState("");
  const [unidadesPorEnvase, setUnidadesPorEnvase] = useState("1");
  const [unidadEnvase, setUnidadEnvase] = useState("");
  const [unidadesPorConsumo, setUnidadesPorConsumo] = useState("1");

  const [actionStatus, setActionStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getProductDetailsAction(productId);
      if (res.product) {
        setProductData(res.product);
        setNombre(res.product.nombre || "");
        setUnidad(res.product.unidad || "UND");
        setStockCritico(res.product.stockCritico?.toString() || "5");
        setCuentaContableId(res.product.cuentaContableId || "");

        // Load units
        setUnidadCompra(res.product.unidadCompra || "");
        setUnidadesPorEnvase(res.product.unidadesPorEnvase?.toString() || "1");
        setUnidadEnvase(res.product.unidadEnvase || "");
        setUnidadesPorConsumo(res.product.unidadesPorConsumo?.toString() || "1");
      }
      setLoading(false);
    }
    loadData();
  }, [productId]);

  const handleCopyId = () => {
    if (productData?.id) {
      navigator.clipboard.writeText(productData.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionStatus(null);

    const formData = new FormData();
    formData.append("id", productId);
    formData.append("nombre", nombre);
    formData.append("unidad", unidad);
    formData.append("stockCritico", stockCritico);
    formData.append("cuentaContableId", cuentaContableId);

    // Conversión de Unidades
    formData.append("unidadCompra", unidadCompra);
    formData.append("unidadesPorEnvase", unidadesPorEnvase);
    formData.append("unidadEnvase", unidadEnvase);
    formData.append("unidadesPorConsumo", unidadesPorConsumo);

    const res = await updateProductAction(formData);
    setSaving(false);

    if (res.success) {
      setActionStatus({ success: true });
      // Reload details
      const detailRes = await getProductDetailsAction(productId);
      if (detailRes.product) setProductData(detailRes.product);
    } else {
      setActionStatus({ error: res.error });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto [${productData?.codigo}] ${productData?.nombre}?`)) {
      return;
    }
    setSaving(true);
    const res = await deleteProductAction(productId);
    setSaving(false);
    if (res.success) {
      onClose();
    } else {
      setActionStatus({ error: res.error });
    }
  };

  const stockTotal = productData?.stocks?.reduce((acc: number, curr: any) => acc + curr.cantidad, 0) || 0;
  const valorizacionTotal = stockTotal * (productData?.ppp || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E172E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-[95vw] xl:max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 font-sans transition-all">

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0B1326]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 font-bold shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  {productData?.codigo || "Cargando..."}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Inspección de Registro DB</span>
                {productData && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-md border ${
                    stockTotal > 0
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                  }`}>
                    Stock Real: <strong className="font-mono">{stockTotal} {productData.unidad || "UND"}</strong>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                {productData?.nombre || "Cargando producto..."}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E172E] px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("INSPECTION")}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === "INSPECTION"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <Database className="h-3.5 w-3.5" /> Ficha Técnica DB
          </button>

          <button
            onClick={() => setActiveTab("LOCATIONS")}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === "LOCATIONS"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <MapPin className="h-3.5 w-3.5" /> Desglose Físico ({productData?.stocks?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("MOVEMENTS")}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === "MOVEMENTS"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <History className="h-3.5 w-3.5" /> Histórico Movimientos
          </button>

          <button
            onClick={() => setActiveTab("EDIT")}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeTab === "EDIT"
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <Edit3 className="h-3.5 w-3.5" /> Editar / Eliminar
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              Cargando información técnica de la base de datos...
            </div>
          ) : (
            <>
              {/* TAB 1: INSPECCIÓN DB */}
              {activeTab === "INSPECTION" && (
                <div className="space-y-5">

                  {/* Stock Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-[#131E3A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stock Físico Total</span>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{stockTotal}</span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{productData.unidad || "UND"}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#131E3A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stock Crítico Definido</span>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{productData.stockCritico}</span>
                        <span className="text-xs font-bold text-slate-400">UND mínimo</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#131E3A] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valor PPP Calculado</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">
                          ${(productData.ppp || 0).toLocaleString("es-CL", {
                            minimumFractionDigits: (productData.ppp || 0) % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">/ unidad</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Stock en Dinero
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          (Stock × PPP)
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          ${valorizacionTotal.toLocaleString("es-CL", {
                            minimumFractionDigits: valorizacionTotal % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        {valorizacionTotal % 1 !== 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            (~${Math.round(valorizacionTotal).toLocaleString("es-CL")})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Database Fields Technical Sheet */}
                  <div className="bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                      Campos de Registro Prisma Database
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* UUID */}
                      <div className="p-3 bg-slate-50 dark:bg-[#131E3A] rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID Único de Base de Datos (UUID)</span>
                        <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="truncate pr-2">{productData.id}</span>
                          <button
                            onClick={handleCopyId}
                            className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer shrink-0"
                            title="Copiar ID"
                          >
                            {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Cuenta Contable */}
                      <div className="p-3 bg-slate-50 dark:bg-[#131E3A] rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cuenta de Existencias Asignada</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {productData.cuentaContable
                            ? `${productData.cuentaContable.codigo} - ${productData.cuentaContable.nombre}`
                            : "Sin cuenta contable asignada"}
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="p-3 bg-slate-50 dark:bg-[#131E3A] rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha de Creación DB</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(productData.createdAt).toLocaleString("es-CL")}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-[#131E3A] rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Última Actualización DB</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(productData.updatedAt).toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Action Link */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/movimientos?productoId=${productData.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Registrar Movimiento para este Producto</span>
                    </Link>
                  </div>

                </div>
              )}

              {/* TAB 2: DESGLOSE FÍSICO */}
              {activeTab === "LOCATIONS" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Ubicaciones Físicas y Existencias
                  </h3>
                  {productData.stocks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-[#131E3A] rounded-2xl text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
                      Este producto no cuenta con existencias registradas en ninguna bodega.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-[#0B1326] text-[9px] font-extrabold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3 pl-4">Sucursal</th>
                            <th className="p-3">Bodega</th>
                            <th className="p-3">Ubicación Física</th>
                            <th className="p-3 text-right pr-4">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {productData.stocks.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3 pl-4 font-bold text-slate-700 dark:text-slate-300">
                                {s.bodega?.sucursal?.nombre || "General"}
                              </td>
                              <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                                {s.bodega?.nombre || "—"}
                              </td>
                              <td className="p-3 text-teal-600 dark:text-teal-400 font-medium">
                                {s.ubicacion?.nombre || "—"}
                              </td>
                              <td className="p-3 text-right pr-4 font-black text-slate-900 dark:text-white">
                                {s.cantidad} {productData.unidad || "UND"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HISTÓRICO MOVIMIENTOS */}
              {activeTab === "MOVEMENTS" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Historial Detallado de Movimientos & Compras
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Trazabilidad cronológica completa con documento de origen, proveedor, valor neto unitario y PPP resultante.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Botón de alternar orden cronológico */}
                      <button
                        type="button"
                        onClick={() => setMovementsSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
                        title="Cambiar dirección de orden cronológico"
                      >
                        <ArrowUpDown className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                        <span>Orden: {movementsSortOrder === "asc" ? "Cronológico Ascendente (Antiguo → Reciente)" : "Descendente (Reciente → Antiguo)"}</span>
                      </button>
                      <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 w-fit">
                        {productData.movimientos.length} transacciones registradas
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const sortedMovimientos = [...productData.movimientos].sort((a: any, b: any) => {
                      const timeA = new Date(a.fecha).getTime();
                      const timeB = new Date(b.fecha).getTime();
                      if (timeA !== timeB) {
                        return movementsSortOrder === "asc" ? timeA - timeB : timeB - timeA;
                      }
                      const createdA = new Date(a.createdAt || a.fecha).getTime();
                      const createdB = new Date(b.createdAt || b.fecha).getTime();
                      return movementsSortOrder === "asc" ? createdA - createdB : createdB - createdA;
                    });

                    const totalMovs = sortedMovimientos.length;
                    const totalPages = Math.ceil(totalMovs / MOVEMENTS_PER_PAGE) || 1;
                    const currentPage = Math.min(Math.max(1, movementsPage), totalPages);
                    const startIndex = (currentPage - 1) * MOVEMENTS_PER_PAGE;
                    const paginatedMovimientos = sortedMovimientos.slice(startIndex, startIndex + MOVEMENTS_PER_PAGE);

                    if (totalMovs === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 dark:bg-[#131E3A] rounded-2xl text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
                          No hay transacciones registradas para este producto.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[840px]">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-[#0B1326] text-[9.5px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                  <th className="py-3 px-3.5 pl-4">
                                    <button
                                      type="button"
                                      onClick={() => setMovementsSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                                      className="inline-flex items-center gap-1 hover:text-teal-600 transition-colors uppercase font-black cursor-pointer"
                                    >
                                      <span>Fecha & Hora</span>
                                      <ArrowUpDown className="h-2.5 w-2.5" />
                                    </button>
                                  </th>
                                  <th className="py-3 px-3.5">Documento & Origen</th>
                                  <th className="py-3 px-3 text-right">Cantidad</th>
                                  <th className="py-3 px-3 text-right">Valor Unit. Neto</th>
                                  <th className="py-3 px-3 text-right">Total Neto</th>
                                  <th className="py-3 px-3 text-right">PPP en Fecha</th>
                                  <th className="py-3 px-3.5">Bodega / Destino</th>
                                  <th className="py-3 px-3.5 text-right pr-4">Operador</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {paginatedMovimientos.map((m: any) => {
                                  const isEntrada = m.tipoMovimiento?.esEntrada ?? true;
                                  const prov = m.proveedor || m.documentoMovimiento?.proveedor;
                                  const valUnit = m.valorUnitario || 0;
                                  const totalNeto = valUnit * m.cantidad;

                                  return (
                                    <tr key={m.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                                      {/* Fecha & Tipo */}
                                      <td className="py-3 px-3.5 pl-4">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex flex-col">
                                            <span className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap" suppressHydrationWarning>
                                              {new Date(m.fecha).toLocaleDateString("es-CL", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric"
                                              })}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1" suppressHydrationWarning>
                                              <Clock className="h-2.5 w-2.5" />
                                              {new Date(m.fecha).toLocaleTimeString("es-CL", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                              })}
                                            </span>
                                          </div>
                                          <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-[9px] font-black border tracking-wide uppercase ${
                                            isEntrada
                                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800"
                                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800"
                                          }`}>
                                            {m.tipoMovimiento?.nombre || (isEntrada ? "Ingreso" : "Egreso")}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Documento & Proveedor */}
                                      <td className="py-3 px-3.5">
                                        <div className="space-y-1">
                                          {m.documentoNumero ? (
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                              {m.documentoTipo === "GUIA_DESPACHO" ? (
                                                <span className="px-1.5 py-0.5 text-[8.5px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                                                  GUÍA
                                                </span>
                                              ) : m.documentoTipo === "SOLICITUD" ? (
                                                <span className="px-1.5 py-0.5 text-[8.5px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                                                  SOLICITUD
                                                </span>
                                              ) : m.documentoTipo === "AJUSTE_RECEPCION" ? (
                                                <span className="px-1.5 py-0.5 text-[8.5px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                                                  MERMA / RECHAZO
                                                </span>
                                              ) : (
                                                <span className="px-1.5 py-0.5 text-[8.5px] font-black bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                                                  {m.documentoTipo === "FACTURA" ? "FACTURA" : m.documentoTipo || "DOC"}
                                                </span>
                                              )}
                                              <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                                N° {m.documentoNumero}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[11px]">Sin doc. (Ajuste)</span>
                                          )}

                                          {prov ? (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold" title={prov.razonSocial}>
                                              <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                              <span className="truncate max-w-[190px]">
                                                {prov.razonSocial}
                                              </span>
                                            </div>
                                          ) : m.centroCosto ? (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                              <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                                              <span className="truncate max-w-[190px]">{m.centroCosto.nombre}</span>
                                            </div>
                                          ) : null}
                                        </div>
                                      </td>

                                      {/* Cantidad */}
                                      <td className="py-3 px-3 text-right whitespace-nowrap">
                                        <span className={`font-black text-sm ${
                                          isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                        }`}>
                                          {isEntrada ? "+" : "-"}{m.cantidad}
                                        </span>
                                        <span className="text-[10px] text-slate-400 ml-1 font-bold">
                                          {productData.unidad || "UND"}
                                        </span>
                                      </td>

                                      {/* Valor Unitario Neto */}
                                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                        {valUnit > 0 ? (
                                          `$${valUnit.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        ) : (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </td>

                                      {/* Total Neto */}
                                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                                        {totalNeto > 0 ? (
                                          `$${Math.round(totalNeto).toLocaleString("es-CL")}`
                                        ) : (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </td>

                                      {/* PPP en Fecha */}
                                      <td className="py-3 px-3 text-right font-mono font-black text-teal-700 dark:text-teal-300 bg-teal-50/30 dark:bg-teal-950/30 whitespace-nowrap">
                                        {m.pppCalculado ? (
                                          `$${m.pppCalculado.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        ) : (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </td>

                                      {/* Bodega / Destino */}
                                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                                        <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                          {m.bodega?.nombre || "Bodega General"}
                                        </div>
                                        {m.ubicacion && (
                                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                            <MapPin className="h-2.5 w-2.5 text-teal-600 shrink-0" />
                                            <span>{m.ubicacion.nombre}</span>
                                          </div>
                                        )}
                                        {m.recibidoPor && (
                                          <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1 font-medium bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md w-fit whitespace-nowrap">
                                            <span className="text-slate-400 font-bold">Destino:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{m.recibidoPor}</span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Operador */}
                                      <td className="py-3 px-3.5 text-right pr-4 whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                                          <span>{m.usuario?.nombre || "Sistema"}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Barra de Paginación de 4 elementos */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-2 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Mostrando <strong className="font-bold text-slate-700 dark:text-slate-200">{startIndex + 1}</strong> a <strong className="font-bold text-slate-700 dark:text-slate-200">{Math.min(startIndex + MOVEMENTS_PER_PAGE, totalMovs)}</strong> de <strong className="font-bold text-slate-700 dark:text-slate-200">{totalMovs}</strong> transacciones
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setMovementsPage(prev => Math.max(1, prev - 1))}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Anterior</span>
                              </button>

                              <span className="px-3 py-1 text-xs font-black rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-[#227262] dark:text-teal-300">
                                {currentPage} / {totalPages}
                              </span>

                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setMovementsPage(prev => Math.min(totalPages, prev + 1))}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>Siguiente</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: EDITAR / ELIMINAR */}
              {activeTab === "EDIT" && (
                <div className="space-y-6">

                  {/* Form */}
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                      Editar Ficha del Producto
                    </h3>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Código del Producto (No editable)</label>
                      <input
                        type="text"
                        disabled
                        value={productData.codigo}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-mono font-bold cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre Producto *</label>
                      <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                    </div>

                    {/* SECCIÓN CONVERSIÓN DE UNIDADES (EDICIÓN) */}
                    <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/40 pb-2">
                        <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                          📦 Conversión de Unidades
                        </span>
                        <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
                          Jerarquía 3 Niveles
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">1. Unidad Compra</label>
                          <UnitSelect
                            value={unidadCompra}
                            onChange={setUnidadCompra}
                            options={unidadesMedida}
                            placeholder="Ej. CAJA, BIDÓN..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Contenido</label>
                          <input
                            type="number"
                            min="1"
                            value={unidadesPorEnvase}
                            onChange={(e) => setUnidadesPorEnvase(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">2. Unidad Envase</label>
                          <UnitSelect
                            value={unidadEnvase}
                            onChange={setUnidadEnvase}
                            options={unidadesMedida}
                            placeholder="Ej. BOLSA, SACHET..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Contenido x Envase</label>
                          <input
                            type="number"
                            min="1"
                            value={unidadesPorConsumo}
                            onChange={(e) => setUnidadesPorConsumo(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-teal-200/50 dark:border-teal-800/30">
                        <label className="text-[9px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">3. Unidad Mínima de Consumo (Stock Real) *</label>
                        <UnitSelect
                          value={unidad}
                          onChange={setUnidad}
                          options={unidadesMedida}
                          placeholder="Ej. LANCETA, AGUJA, UNIDAD..."
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Stock Crítico Mínimo ({unidad || "Unidades"})</label>
                        <input
                          type="number"
                          min="0"
                          value={stockCritico}
                          onChange={(e) => setStockCritico(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Cuenta Contable</label>
                      <select
                        value={cuentaContableId}
                        onChange={(e) => setCuentaContableId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      >
                        <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Sin cuenta asignada</option>
                        {cuentasContables.map((cc) => (
                          <option key={cc.id} value={cc.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                            {cc.codigo} - {cc.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {actionStatus?.success && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Ficha del producto actualizada correctamente.</span>
                      </div>
                    )}

                    {actionStatus?.error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>{actionStatus.error}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
                      </button>
                    </div>
                  </form>

                  {/* Danger Zone: Delete Product */}
                  <div className="pt-4 border-t border-red-200 dark:border-red-900/60 space-y-2">
                    <h4 className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Zona de Peligro: Eliminar Registro
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      La eliminación solo está permitida para productos sin movimientos en la bitácora.
                    </p>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar Producto de la Base de Datos</span>
                    </button>
                  </div>

                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
