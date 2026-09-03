import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import MovimientosClientContainer from "./MovimientosClientContainer";

interface PageProps {
  searchParams: Promise<{
    tipo?: string;
    tab?: string;
  }>;
}

export const revalidate = 0;

export default async function MovimientosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const defaultTab = searchParams.tab || (searchParams.tipo === "EGRESO" ? "EGRESO_DIRECTO" : "COMPRAS");

  // 1. Fetch products for autocomplete search
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

  // 2. Fetch bodegas and their ubicaciones (filtered by permissions)
  const { getUserPermissions } = await import("@/lib/permissions");
  const permissions = await getUserPermissions();

  const bodegasWhere = permissions?.isFiltered
    ? { id: { in: permissions.bodegasIds } }
    : {};

  const bodegas = await prisma.bodega.findMany({
    where: bodegasWhere,
    include: {
      ubicaciones: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // 3. Fetch Proveedores list
  const proveedores = await prisma.proveedor.findMany({
    select: {
      id: true,
      rut: true,
      razonSocial: true,
    },
    orderBy: {
      razonSocial: "asc",
    },
  });

  // 4. Fetch recent movements from DB (filtered by permissions)
  const movementsWhere = permissions?.isFiltered
    ? { bodegaId: { in: permissions.bodegasIds } }
    : {};

  const movements = await prisma.movimiento.findMany({
    where: movementsWhere,
    take: 20,
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

  // 5. Fetch DocumentoMovimientos for Pending Reconciliation & Alerts
  const documentosPendientes = await prisma.documentoMovimiento.findMany({
    orderBy: {
      fechaDocumento: "desc",
    },
    include: {
      proveedor: {
        select: {
          rut: true,
          razonSocial: true,
        },
      },
      items: {
        include: {
          producto: {
            select: {
              codigo: true,
              nombre: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Operaciones de Inventario: Entradas & Salidas
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gestiona ingresos por compras comerciales (Facturas y Guías), salidas para consumo clínico o consultas de bitácora.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando operaciones...</div>}>
        <MovimientosClientContainer
          products={JSON.parse(JSON.stringify(products))}
          bodegas={JSON.parse(JSON.stringify(bodegas))}
          proveedores={JSON.parse(JSON.stringify(proveedores))}
          movements={JSON.parse(JSON.stringify(movements))}
          documentosPendientes={JSON.parse(JSON.stringify(documentosPendientes))}
          defaultTab={defaultTab}
        />
      </Suspense>
    </div>
  );
}
