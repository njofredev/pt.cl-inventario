import Link from "next/link";
import { getCuadrosAction, deleteCuadroAction } from "./actions";
import { Plus, Eye, Trash2, Calendar, FileSpreadsheet, MapPin } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function CuadrosPage() {
  const cuadros = await getCuadrosAction();

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get("id") as string;
    if (id) {
      await deleteCuadroAction(id);
      revalidatePath("/cuadros");
    }
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 dark:bg-[#0E172E] text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-teal-500/30">Módulo de Compras</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Cuadros Comparativos</h1>
          <p className="text-slate-400 text-xs font-medium">Compara cotizaciones de proveedores y genera órdenes de compra de forma estandarizada.</p>
        </div>
        <div className="z-10">
          <Link
            href="/cuadros/crear"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold transition-all text-xs shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Cuadro Comparativo
          </Link>
        </div>
      </div>

      {/* Historial Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Historial de Comparativas
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{cuadros.length} comparativas guardadas</span>
        </div>

        {cuadros.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No hay cuadros comparativos</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Comienza a registrar y comparar cotizaciones de tus proveedores para evitar el uso de archivos Excel.</p>
            </div>
            <Link
              href="/cuadros/crear"
              className="inline-flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline pt-2"
            >
              Crear el primero ahora →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-5">Sucursal</th>
                  <th className="py-3 px-5">Proveedores Cotizados</th>
                  <th className="py-3 px-5">Adjudicado</th>
                  <th className="py-3 px-5">Artículos</th>
                  <th className="py-3 px-5 text-right">Total Orden</th>
                  <th className="py-3 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {cuadros.map((cuadro: any) => {
                  const itemsCount = cuadro._count.items;
                  const winnerName = cuadro.ganador === 1 
                    ? cuadro.proveedor1 
                    : cuadro.ganador === 2 
                    ? cuadro.proveedor2 
                    : cuadro.ganador === 3 
                    ? cuadro.proveedor3 
                    : "No adjudicado";

                  return (
                    <tr key={cuadro.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(cuadro.fecha).toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              timeZone: "UTC"
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {cuadro.sucursal?.nombre || "General"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 dark:text-slate-200 font-bold">{cuadro.proveedor1}</div>
                          <div className="text-[10px] text-slate-400">vs {cuadro.proveedor2} vs {cuadro.proveedor3}</div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        {cuadro.ganador ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {winnerName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-700 dark:text-slate-300">{itemsCount} artículos</td>
                      <td className="py-3 px-5 text-right font-extrabold text-slate-800 dark:text-slate-100">
                        ${cuadro.totalOrdenCompra.toLocaleString("es-CL")}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/cuadros/${cuadro.id}`}
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Ver / Imprimir"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <form action={handleDelete} className="m-0 p-0 flex">
                            <input type="hidden" name="id" value={cuadro.id} />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (!confirm("¿Está seguro que desea eliminar este cuadro comparativo?")) {
                                  e.preventDefault();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
