import { prisma } from "@/lib/prisma";
import MovimientoForm from "./MovimientoForm";
import { MapPin } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    tipo?: string;
  }>;
}

export const revalidate = 0;

export default async function MovimientosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const defaultTipo = searchParams.tipo || "INGRESO";

  // Fetch products for autocomplete search
  const products = await prisma.product.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      unidad: true,
      unidadCompra: true,
      unidadesPorEnvase: true,
      unidadEnvase: true,
      unidadesPorConsumo: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // Fetch bodegas and their ubicaciones
  const bodegas = await prisma.bodega.findMany({
    include: {
      ubicaciones: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // Fetch recent movements from DB
  const movements = await prisma.movimiento.findMany({
    take: 15,
    orderBy: {
      fecha: "desc",
    },
    include: {
      product: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
      tipoMovimiento: true,
      bodega: {
        select: {
          nombre: true,
        },
      },
      ubicacion: {
        select: {
          nombre: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Movimientos de Inventario
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Registra ingresos de compras o egresos por consumo, y visualiza la bitácora de transacciones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
            Registrar Movimiento
          </h2>
          <MovimientoForm 
            products={products}
            bodegas={JSON.parse(JSON.stringify(bodegas))}
            defaultTipo={defaultTipo}
          />
        </div>

        {/* Bitacora / Recent transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
            Historial de Movimientos Recientes
          </h2>
          
          <div className="overflow-hidden">
            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                No se han registrado movimientos de inventario todavía.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1">
                {movements.map((t) => (
                  <div 
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {t.product.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                        Código: <span className="font-mono text-slate-600 dark:text-slate-300">{t.product.codigo}</span> | Tipo: {t.tipoMovimiento.nombre} | Fecha: {new Date(t.fecha).toLocaleString('es-CL')}
                      </p>
                      {t.bodega && t.ubicacion && (
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Ubicación: {t.bodega.nombre} ({t.ubicacion.nombre})
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end mt-2 sm:mt-0 ml-0 sm:ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                        t.tipoMovimiento.esEntrada 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      }`}>
                        {t.tipoMovimiento.esEntrada ? '+' : '-'} {t.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
