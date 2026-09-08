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

  // 4. Fetch Destinos Clínicos list (para salidas/consumos)
  const destinos = await prisma.destino.findMany({
    include: {
      sucursal: true,
    },
    orderBy: [
      { sucursal: { nombre: "asc" } },
      { nombre: "asc" },
    ],
  });

  // 4b. Fetch Consumidores registrados para asignación en Salidas
  const consumidores = await prisma.user.findMany({
    where: {
      role: "CONSUMIDOR",
    },
    select: {
      id: true,
      username: true,
      nombre: true,
      rut: true,
      areaTrabajo: true,
      cargo: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  // 5. Fetch recent movements from DB (filtered by permissions)
  const movementsWhere = permissions?.isFiltered
    ? { bodegaId: { in: permissions.bodegasIds } }
    : {};

  const movements = await prisma.movimiento.findMany({
    where: movementsWhere,
    take: 100,
    orderBy: {
      fecha: "desc",
    },
    include: {
      product: {
        select: {
          codigo: true,
          nombre: true,
          unidad: true,
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
      usuario: {
        select: {
          nombre: true,
          username: true,
        },
      },
    },
  });

  // 6. Fetch DocumentoMovimientos for Pending Reconciliation & Alerts
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

  const isSalida = defaultTab === "EGRESO_DIRECTO";
  const isHistorial = defaultTab === "HISTORIAL";

  return (
    <div className="space-y-5 w-full">
      {/* Header Dinámico */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          {isHistorial 
            ? "Histórico y Bitácora de Movimientos" 
            : isSalida 
              ? "Salidas de Bodega: Consumo Clínico y Despachos" 
              : "Entradas de Bodega: Recepción y Compras"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isHistorial 
            ? "Auditoría cronológica y trazabilidad de todos los ingresos y egresos registrados." 
            : isSalida 
              ? "Registra la entrega directa de materiales a profesionales, boxes clínicos y servicios." 
              : "Ingreso de materiales por compras comerciales (Facturas y Guías de Despacho) o ajustes directos."}
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Cargando operaciones...</div>}>
        <MovimientosClientContainer
          products={JSON.parse(JSON.stringify(products))}
          bodegas={JSON.parse(JSON.stringify(bodegas))}
          proveedores={JSON.parse(JSON.stringify(proveedores))}
          destinos={JSON.parse(JSON.stringify(destinos))}
          consumidores={JSON.parse(JSON.stringify(consumidores))}
          movements={JSON.parse(JSON.stringify(movements))}
          documentosPendientes={JSON.parse(JSON.stringify(documentosPendientes))}
          defaultTab={defaultTab}
        />
      </Suspense>
    </div>
  );
}
