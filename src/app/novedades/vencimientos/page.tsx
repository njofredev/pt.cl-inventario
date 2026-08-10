import { prisma } from "@/lib/prisma";
import VencimientosClient from "./VencimientosClient";

export const revalidate = 0;

export default async function VencimientosPage() {
  const productsRaw = await prisma.product.findMany({
    include: {
      stocks: {
        select: {
          cantidad: true,
        },
      },
    },
    orderBy: {
      fechaVencimiento: "asc",
    },
  });

  const products = productsRaw.map((p) => {
    const stockTotal = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      unidad: p.unidad,
      lote: p.lote,
      fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.toISOString() : null,
      tieneVencimiento: p.tieneVencimiento,
      stockTotal,
    };
  });

  return (
    <div className="space-y-5 w-full">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-full uppercase">
            Módulo Novedades 2026
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
          Control de Lotes & Caducidad de Insumos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Semáforo sanitario de vencimientos, gestión de lotes y despacho prioritario FEFO.
        </p>
      </div>

      <VencimientosClient products={products} />
    </div>
  );
}
