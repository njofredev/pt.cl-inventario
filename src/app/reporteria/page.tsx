import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReporteriaClient from "./ReporteriaClient";

export const revalidate = 0;

export default async function ReporteriaPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // 1. Catálogo completo de Productos y Stocks
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: {
          bodega: {
            include: { sucursal: true },
          },
        },
      },
      cuentaContable: true,
    },
  });

  // 2. Todos los Movimientos históricos (Compras, Consumos, Ajustes, etc.)
  const movimientos = await prisma.movimiento.findMany({
    include: {
      product: true,
      tipoMovimiento: true,
      bodega: {
        include: { sucursal: true },
      },
      centroCosto: true,
      usuario: true,
      proveedor: true,
    },
    orderBy: { fecha: "desc" },
  });

  // 3. Documentos de Compras / Facturas
  const facturas = await prisma.documentoMovimiento.findMany({
    include: {
      proveedor: true,
      items: {
        include: { producto: true },
      },
    },
    orderBy: { fechaDocumento: "desc" },
  });

  // 4. Solicitudes de insumos y sus items
  const solicitudes = await prisma.solicitud.findMany({
    include: {
      centroCosto: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { fecha: "desc" },
  });

  // 5. Sucursales y Bodegas para filtros
  const sucursales = await prisma.sucursal.findMany({
    include: {
      bodegas: true,
    },
    orderBy: { nombre: "asc" },
  });

  // 6. Centros de Costo
  const centrosCosto = await prisma.centroCosto.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            Módulo Exclusivo Administradores
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Reportería y Analítica Estratégica
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas clave, rotación de existencias, comportamiento de solicitudes y rendimiento operativo.
          </p>
        </div>
      </div>

      {/* Interfaz Interactiva de Reportería */}
      <ReporteriaClient
        products={products}
        movimientos={movimientos}
        facturas={facturas}
        solicitudes={solicitudes}
        sucursales={sucursales}
        centrosCosto={centrosCosto}
      />
    </div>
  );
}
