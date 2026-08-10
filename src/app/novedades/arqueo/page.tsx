import { prisma } from "@/lib/prisma";
import ArqueoClient from "./ArqueoClient";

export const revalidate = 0;

export default async function ArqueoPage() {
  const stocksRaw = await prisma.stock.findMany({
    include: {
      product: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          unidad: true,
        },
      },
      bodega: {
        select: {
          id: true,
          nombre: true,
        },
      },
      ubicacion: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: {
      product: {
        nombre: "asc",
      },
    },
  });

  const bodegas = await prisma.bodega.findMany({
    include: {
      ubicaciones: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  const stocks = stocksRaw.map(s => ({
    productId: s.product.id,
    codigo: s.product.codigo,
    nombre: s.product.nombre,
    unidad: s.product.unidad,
    bodegaId: s.bodega.id,
    bodegaNombre: s.bodega.nombre,
    ubicacionId: s.ubicacion.id,
    ubicacionNombre: s.ubicacion.nombre,
    cantidadActual: s.cantidad,
  }));

  return (
    <div className="space-y-5 w-full">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-black bg-teal-600 text-white rounded-full uppercase">
            Módulo Novedades 2026
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
          Toma Física de Inventario & Control de Mermas
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Auditoría de bodega, registro de diferencias por arqueo físico y justificación de mermas o roturas.
        </p>
      </div>

      <ArqueoClient
        stocks={stocks}
        bodegas={JSON.parse(JSON.stringify(bodegas))}
      />
    </div>
  );
}
