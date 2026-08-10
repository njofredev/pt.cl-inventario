import { prisma } from "@/lib/prisma";
import ReposicionClient from "./ReposicionClient";

export const revalidate = 0;

export default async function ReposicionPage() {
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        select: {
          cantidad: true,
        },
      },
    },
    orderBy: {
      nombre: "asc",
    },
  });

  const lowStockItems = products
    .map((p) => {
      const stockTotal = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
      const stockCritico = p.stockCritico || 0;
      const diferencia = stockCritico - stockTotal;
      // Target reorder level: 2 * stockCritico or at least stockCritico + 10
      const sugerido = Math.max(diferencia, (stockCritico * 2) - stockTotal);

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        unidad: p.unidad,
        unidadCompra: p.unidadCompra,
        unidadesPorEnvase: p.unidadesPorEnvase,
        stockCritico,
        stockTotal,
        precioRef: p.costoNeto || p.ppp || 0,
        diferencia,
        sugerido: sugerido > 0 ? sugerido : 0,
      };
    })
    .filter((item) => item.stockTotal <= item.stockCritico && item.stockCritico > 0);

  return (
    <div className="space-y-5 w-full">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-600 text-white rounded-full uppercase">
            Módulo Novedades 2026
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
          Sugerido de Compras & Reorden Automático
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Detección proactiva de déficit de inventario y estimación de volúmenes de compra requeridos.
        </p>
      </div>

      <ReposicionClient items={lowStockItems} />
    </div>
  );
}
