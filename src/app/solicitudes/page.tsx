import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import ClientSolicitudesList from "./ClientSolicitudesList";

export const revalidate = 0;

export default async function SolicitudesPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;

  if (!user || (user.role !== "ADMIN" && user.role !== "OPERADOR")) {
    redirect("/");
  }

  const { getUserPermissions } = await import("@/lib/permissions");
  const permissions = await getUserPermissions();

  // Obtener sucursales y bodegas del usuario operador/admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      nombre: true,
      role: true,
      sucursales: { select: { id: true, nombre: true } },
      bodegas: { select: { id: true, nombre: true } }
    }
  });

  // Obtener todos los destinos con su sucursal para asociar solicitudes a sus sucursales
  const destinos = await prisma.destino.findMany({
    include: {
      sucursal: { select: { id: true, nombre: true } }
    }
  });

  // Fetch all solicitudes with their items, products (with stocks), and cost centers
  const rawSolicitudes = await prisma.solicitud.findMany({
    include: {
      centroCosto: true,
      items: {
        include: {
          product: {
            include: {
              stocks: {
                select: {
                  cantidad: true,
                  bodega: {
                    select: {
                      id: true,
                      nombre: true,
                      sucursal: {
                        select: {
                          id: true,
                          nombre: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      fecha: "desc"
    }
  });

  const solicitudes = rawSolicitudes.map(s => {
    // Inferir sucursal de la solicitud a través del destino registrado en s.areaTrabajo
    const matchingDestino = destinos.find(d => d.nombre.trim().toLowerCase() === (s.areaTrabajo || "").trim().toLowerCase());
    const sucursalSolicitud = matchingDestino?.sucursal || null;

    return {
      ...s,
      sucursal: sucursalSolicitud,
      items: s.items.map(item => ({
        id: item.id,
        productoId: item.productoId,
        cantidad: item.cantidad,
        cantidadEnviada: item.cantidadEnviada,
        cantidadRecepcionada: item.cantidadRecepcionada,
        product: {
          codigo: item.product.codigo,
          nombre: item.product.nombre,
          unidad: item.product.unidad,
          stockTotal: item.product.stocks.reduce((acc, st) => acc + st.cantidad, 0),
          stocks: item.product.stocks.map(st => ({
            bodegaId: st.bodega.id,
            bodega: st.bodega.nombre,
            sucursalId: st.bodega.sucursal?.id,
            sucursalNombre: st.bodega.sucursal?.nombre || 'General',
            cantidad: st.cantidad
          }))
        }
      }))
    };
  });

  // Server action to approve/dispatch or reject a request with item quantities and comment
  async function updateStatusAction(
    solicitudId: string, 
    status: "DESPACHADA" | "RECHAZADA", 
    observacion?: string,
    itemsEnviados?: { id: string; cantidadEnviada: number }[]
  ) {
    'use server'
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const adminOrOp = session ? await verifyJWT(session) : null;

    if (!adminOrOp || (adminOrOp.role !== "ADMIN" && adminOrOp.role !== "OPERADOR")) {
      throw new Error("No autorizado");
    }

    const { getUserPermissions } = await import("@/lib/permissions");
    const userPerms = await getUserPermissions();

    const { recalcularPPPProducto } = await import("@/lib/kardex");

    await prisma.$transaction(async (tx) => {
      // Si se rechaza, solo actualizamos el estado y la observación
      if (status === "RECHAZADA") {
        await tx.solicitud.update({
          where: { id: solicitudId },
          data: { 
            estado: "RECHAZADA",
            observacionRespuesta: observacion?.trim() || null
          }
        });
        return;
      }

      // Si se despacha:
      // 1. Obtener la solicitud con sus datos y centro de costo
      const currentSolicitud = await tx.solicitud.findUnique({
        where: { id: solicitudId },
        include: {
          centroCosto: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!currentSolicitud) {
        throw new Error("Solicitud no encontrada.");
      }

      // 2. Resolver TipoMovimiento de salida (Consumo Clínico Directo o Salida por Consumo)
      let tipoMov = await tx.tipoMovimiento.findFirst({
        where: { nombre: "Consumo Clínico Directo" }
      });
      if (!tipoMov) {
        tipoMov = await tx.tipoMovimiento.findFirst({
          where: { nombre: "Salida por Consumo" }
        });
      }
      if (!tipoMov) {
        tipoMov = await tx.tipoMovimiento.findFirst({
          where: { esEntrada: false }
        });
      }
      if (!tipoMov) {
        throw new Error("No se encontró un tipo de movimiento de salida configurado.");
      }

      // 3. Generar número de correlativo de salida/solicitud
      const year = new Date().getFullYear();
      const countThisYear = await tx.movimiento.count({
        where: {
          tipoMovimiento: { esEntrada: false },
          fecha: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
          }
        }
      });
      const correlativoMov = `SAL-${year}-${(countThisYear + 1).toString().padStart(5, '0')}`;

      // Nombre del receptor con Centro de Costo
      const solicitante = currentSolicitud.nombre?.trim() || "Consumidor";
      const ccNombre = currentSolicitud.centroCosto?.nombre || currentSolicitud.centroCosto?.codigo || "";
      const receptorDesc = ccNombre ? `${solicitante} (${ccNombre})` : solicitante;

      // 4. Actualizar cada ítem con la cantidad enviada digitada por el bodeguero
      const productosModificados = new Set<string>();

      // Filtro de bodegas autorizadas para el usuario despachador
      const bodegaFilter = (userPerms && userPerms.isFiltered && userPerms.bodegasIds.length > 0)
        ? { in: userPerms.bodegasIds }
        : undefined;

      if (itemsEnviados && itemsEnviados.length > 0) {
        for (const itemEnv of itemsEnviados) {
          const qtyEnviada = Math.max(0, itemEnv.cantidadEnviada || 0);

          await tx.solicitudItem.update({
            where: { id: itemEnv.id },
            data: {
              cantidadEnviada: qtyEnviada
            }
          });

          // Si se envió cantidad > 0, registrar el movimiento de salida y descontar stock
          if (qtyEnviada > 0) {
            const itemDb = currentSolicitud.items.find(it => it.id === itemEnv.id);
            if (itemDb) {
              // Buscar bodega con stock suficiente dentro de las bodegas autorizadas del operador
              const whereCondition: any = {
                productoId: itemDb.productoId,
                cantidad: { gte: qtyEnviada }
              };
              if (bodegaFilter) {
                whereCondition.bodegaId = bodegaFilter;
              }

              let stockEntry = await tx.stock.findFirst({
                where: whereCondition,
                orderBy: { cantidad: 'desc' },
                include: { bodega: { include: { sucursal: true } }, ubicacion: true }
              });

              // Si no hay con stock suficiente en una sola bodega autorizada, buscar la que tenga mayor existencia
              if (!stockEntry) {
                const partialWhere: any = {
                  productoId: itemDb.productoId,
                  cantidad: { gt: 0 }
                };
                if (bodegaFilter) {
                  partialWhere.bodegaId = bodegaFilter;
                }

                stockEntry = await tx.stock.findFirst({
                  where: partialWhere,
                  orderBy: { cantidad: 'desc' },
                  include: { bodega: { include: { sucursal: true } }, ubicacion: true }
                });
              }

              const stockDisponible = stockEntry?.cantidad || 0;
              if (!stockEntry || stockDisponible < qtyEnviada) {
                const bodegaAviso = bodegaFilter 
                  ? "en las bodegas autorizadas de tu sucursal" 
                  : "en bodega";
                throw new Error(
                  `Stock insuficiente para "${itemDb.product.nombre}". Disponible ${bodegaAviso}: ${stockDisponible} ${itemDb.product.unidad || "UND"}, pero intentas enviar: ${qtyEnviada}. No se permite descontar de otras sedes no autorizadas.`
                );
              }

              const bodegaId = stockEntry.bodegaId;
              const ubicacionId = stockEntry.ubicacionId;

              // Crear el registro de Movimiento en Kardex
              await tx.movimiento.create({
                data: {
                  productoId: itemDb.productoId,
                  tipoMovimientoId: tipoMov.id,
                  cantidad: qtyEnviada,
                  bodegaId,
                  ubicacionId,
                  centroCostoId: currentSolicitud.centroCostoId,
                  usuarioId: adminOrOp.userId,
                  recibidoPor: receptorDesc,
                  documentoTipo: "SOLICITUD",
                  documentoNumero: correlativoMov,
                  pppCalculado: itemDb.product?.ppp || 0,
                  valorUnitario: 0.0
                }
              });

              // Descontar del inventario físico
              await tx.stock.update({
                where: {
                  productoId_bodegaId_ubicacionId: {
                    productoId: itemDb.productoId,
                    bodegaId,
                    ubicacionId
                  }
                },
                data: {
                  cantidad: {
                    decrement: qtyEnviada
                  }
                }
              });

              productosModificados.add(itemDb.productoId);
            }
          }
        }
      }

      // Recalcular PPP para los productos modificados
      for (const prodId of productosModificados) {
        await recalcularPPPProducto(tx, prodId);
      }

      // Marcar solicitud como DESPACHADA
      await tx.solicitud.update({
        where: { id: solicitudId },
        data: { 
          estado: "DESPACHADA",
          observacionRespuesta: observacion?.trim() || null
        }
      });
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/solicitudes");
    revalidatePath("/productos");
    revalidatePath("/movimientos");

    return { success: true };
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Solicitudes de Materiales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Bandeja de entrada y gestión de requerimientos enviados por el personal clínico.
          </p>
        </div>

        <Link
          href="/solicitar"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#227262] hover:bg-[#1a5b4e] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Abrir Portal de Solicitud (Consumidor)
        </Link>
      </div>

      <ClientSolicitudesList 
        solicitudes={JSON.parse(JSON.stringify(solicitudes))} 
        currentUser={dbUser ? JSON.parse(JSON.stringify(dbUser)) : null}
        updateStatusAction={updateStatusAction} 
      />
    </div>
  );
}
