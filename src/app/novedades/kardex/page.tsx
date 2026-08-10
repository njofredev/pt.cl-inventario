import { prisma } from "@/lib/prisma";
import KardexClient from "./KardexClient";

export const revalidate = 0;

export default async function KardexPage() {
  const productsRaw = await prisma.product.findMany({
    include: {
      cuentaContable: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
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

  const kardexItems = productsRaw.map((p) => {
    const stockTotal = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
    const precioRef = p.ppp || p.costoNeto || 0;
    const valorTotal = stockTotal * precioRef;

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      unidad: p.unidad,
      cuentaContableNombre: p.cuentaContable?.nombre || null,
      cuentaContableCodigo: p.cuentaContable?.codigo || null,
      stockTotal,
      precioRef,
      valorTotal,
    };
  });

  return (
    <div className="space-y-5 w-full">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-black bg-[#05b875] text-white rounded-full uppercase">
            Módulo Novedades 2026
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
          Kardex Valorizado & Valorización de Existencias
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Informe contable de existencias valorizadas al precio promedio ponderado (PPP) por cuenta contable.
        </p>
      </div>

      <KardexClient items={kardexItems} />
    </div>
  );
}
