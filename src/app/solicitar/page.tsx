import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import Link from "next/link";
import { ClipboardList, ArrowLeft, LogOut, User, Bell } from "lucide-react";
import ClientSolicitarForm from "./ClientSolicitarForm";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SolicitarPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialTab = searchParams.tab === "CATALOGO" || searchParams.tab === "HISTORIAL" || searchParams.tab === "BUSCADOR" 
    ? searchParams.tab 
    : "BUSCADOR";

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;
  const dbUser = user?.userId 
    ? await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          nombre: true,
          username: true,
          rut: true,
          areaTrabajo: true,
          cargo: true,
          role: true
        }
      })
    : null;

  // Obtener Centros de Costo, Destinos (boxes / áreas registradas) y Productos para el formulario
  const centrosCosto = await prisma.centroCosto.findMany({
    orderBy: { nombre: "asc" }
  });

  const destinos = await prisma.destino.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" }
  });

  const rawProductos = await prisma.product.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      clasificacion: true,
      tipoProducto: true,
      unidad: true,
      unidadCompra: true,
      unidadesPorEnvase: true,
      unidadEnvase: true,
      unidadesPorConsumo: true,
      stocks: {
        select: {
          cantidad: true
        }
      }
    },
    orderBy: { nombre: "asc" }
  });

  const productos = rawProductos.map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    clasificacion: p.clasificacion,
    tipoProducto: p.tipoProducto,
    unidad: p.unidad,
    unidadCompra: p.unidadCompra,
    unidadesPorEnvase: p.unidadesPorEnvase,
    unidadEnvase: p.unidadEnvase,
    unidadesPorConsumo: p.unidadesPorConsumo,
    stockTotal: p.stocks.reduce((acc, s) => acc + s.cantidad, 0),
  }));

  // Obtener solicitudes previas del usuario si está logueado
  const userSolicitudes = user ? await prisma.solicitud.findMany({
    where: {
      nombre: user.nombre
    },
    include: {
      centroCosto: true,
      items: {
        include: {
          product: {
            include: {
              stocks: {
                select: {
                  cantidad: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      fecha: "desc"
    },
    take: 20
  }) : [];

  const formattedUserSolicitudes = userSolicitudes.map(s => ({
    id: s.id,
    fecha: s.fecha.toISOString(),
    nombre: s.nombre,
    rut: s.rut,
    areaTrabajo: s.areaTrabajo,
    cargo: s.cargo,
    estado: s.estado,
    observacionRespuesta: s.observacionRespuesta,
    centroCosto: {
      codigo: s.centroCosto.codigo,
      nombre: s.centroCosto.nombre,
    },
    items: s.items.map(it => ({
      id: it.id,
      productoId: it.productoId,
      cantidad: it.cantidad,
      cantidadEnviada: it.cantidadEnviada,
      cantidadRecepcionada: it.cantidadRecepcionada,
      product: {
        codigo: it.product.codigo,
        nombre: it.product.nombre,
        unidad: it.product.unidad,
        stockTotal: it.product.stocks.reduce((acc, st) => acc + st.cantidad, 0),
      }
    }))
  }));

  // Action to submit the request
  async function submitRequestAction(data: {
    nombre: string;
    rut: string;
    areaTrabajo: string;
    cargo: string;
    centroCostoId: string;
    items: { productoId: string; cantidad: number }[];
  }) {
    'use server'
    if (!data.nombre || !data.centroCostoId || data.items.length === 0) {
      throw new Error("Datos incompletos.");
    }

    await prisma.solicitud.create({
      data: {
        nombre: data.nombre,
        rut: data.rut || null,
        areaTrabajo: data.areaTrabajo || null,
        cargo: data.cargo || null,
        centroCostoId: data.centroCostoId,
        estado: "PENDIENTE",
        items: {
          create: data.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        }
      }
    });

    return { success: true };
  }

  // Action to confirm reception by consumer
  async function recepcionarSolicitudAction(
    solicitudId: string,
    itemsRecepcionados: { id: string; cantidadRecepcionada: number }[]
  ) {
    'use server'
    if (!solicitudId || !itemsRecepcionados || itemsRecepcionados.length === 0) {
      throw new Error("Datos inválidos.");
    }

    const { recalcularPPPProducto } = await import("@/lib/kardex");
    const { revalidatePath } = await import("next/cache");

    await prisma.$transaction(async (tx) => {
      // 1. Obtener la solicitud con centro de costo e ítems
      const currentSol = await tx.solicitud.findUnique({
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

      if (!currentSol) {
        throw new Error("Solicitud no encontrada.");
      }

      // 2. Buscar TipoMovimiento para ajuste de merma en caso de discrepancia
      let tipoMovMerma = await tx.tipoMovimiento.findFirst({
        where: { nombre: "Dada de Baja" }
      });
      if (!tipoMovMerma) {
        tipoMovMerma = await tx.tipoMovimiento.findFirst({
          where: { nombre: "Ajuste de Salida" }
        });
      }
      if (!tipoMovMerma) {
        tipoMovMerma = await tx.tipoMovimiento.findFirst({
          where: { esEntrada: false }
        });
      }

      const adminOrSystemUser = await tx.user.findFirst({
        where: { role: "ADMIN" }
      });

      const year = new Date().getFullYear();
      const productosModificados = new Set<string>();

      // 3. Actualizar cantidades recepcionadas y registrar discrepancias
      for (const itemRec of itemsRecepcionados) {
        const cantRec = Math.max(0, itemRec.cantidadRecepcionada || 0);

        await tx.solicitudItem.update({
          where: { id: itemRec.id },
          data: {
            cantidadRecepcionada: cantRec
          }
        });

        const itemDb = currentSol.items.find(it => it.id === itemRec.id);
        if (itemDb) {
          const enviada = itemDb.cantidadEnviada || 0;
          // Si el consumidor recepcionó menos de lo que bodega envió (merma o daño en tránsito)
          if (cantRec < enviada && tipoMovMerma) {
            const diferenciaMerma = enviada - cantRec;

            const countThisYear = await tx.movimiento.count({
              where: {
                tipoMovimiento: { esEntrada: false },
                fecha: { gte: new Date(`${year}-01-01T00:00:00.000Z`) }
              }
            });
            const correlativoMerma = `MERMA-${year}-${(countThisYear + 1).toString().padStart(5, '0')}`;

            // Buscar último movimiento de salida de este producto para esta solicitud
            const lastMov = await tx.movimiento.findFirst({
              where: {
                productoId: itemDb.productoId,
                documentoTipo: "SOLICITUD"
              },
              orderBy: { createdAt: "desc" }
            });

            await tx.movimiento.create({
              data: {
                productoId: itemDb.productoId,
                tipoMovimientoId: tipoMovMerma.id,
                cantidad: diferenciaMerma,
                bodegaId: lastMov?.bodegaId || null,
                ubicacionId: lastMov?.ubicacionId || null,
                centroCostoId: currentSol.centroCostoId,
                usuarioId: adminOrSystemUser?.id || "system",
                recibidoPor: `Discrepancia Recepción: ${currentSol.nombre} (Enviado: ${enviada}, Recibido: ${cantRec})`,
                documentoTipo: "AJUSTE_RECEPCION",
                documentoNumero: correlativoMerma,
                pppCalculado: itemDb.product.ppp || 0,
                valorUnitario: 0.0
              }
            });

            productosModificados.add(itemDb.productoId);
          }
        }
      }

      // Recalcular PPP si hubo ajustes
      for (const prodId of productosModificados) {
        await recalcularPPPProducto(tx, prodId);
      }

      await tx.solicitud.update({
        where: { id: solicitudId },
        data: {
          estado: "RECEPCIONADA"
        }
      });
    });

    revalidatePath("/solicitar");
    revalidatePath("/solicitudes");
    revalidatePath("/productos");
    revalidatePath("/movimientos");

    return { success: true };
  }

  // Notificaciones para el portal de solicitudes
  const pendientesDespachoCount = (user?.role === "ADMIN" || user?.role === "OPERADOR")
    ? await prisma.solicitud.count({ where: { estado: "PENDIENTE" } })
    : 0;

  const porRecepcionarCount = (user?.role === "CONSUMIDOR")
    ? await prisma.solicitud.count({
        where: {
          nombre: user.nombre,
          estado: "DESPACHADA"
        }
      })
    : 0;

  const totalNotif = user?.role === "CONSUMIDOR" ? porRecepcionarCount : pendientesDespachoCount;

  return (
    <div className="min-h-screen bg-clinical-bg py-4 px-3 sm:py-8 sm:px-6 lg:px-8 pb-28 sm:pb-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Responsivo Compacto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border-l-4 border-l-[#227262]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-black text-slate-800 dark:text-slate-100 truncate">
                  Portal de Solicitudes
                </h1>
                <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                  Selecciona insumos para enviar tu requerimiento a bodega
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Notificación Campana */}
              {totalNotif > 0 && (
                <Link
                  href={user?.role === "CONSUMIDOR" ? "/solicitar?tab=HISTORIAL" : "/solicitudes"}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black shadow-xs hover:bg-amber-100 transition-all cursor-pointer"
                  title={
                    user?.role === "CONSUMIDOR"
                      ? `Tienes ${totalNotif} solicitud(es) despachada(s) lista(s) para recepcionar`
                      : `Hay ${totalNotif} solicitud(es) pendiente(s) por gestionar en bodega`
                  }
                >
                  <Bell className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                  <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full h-4 min-w-4 px-1 text-[10px] font-black">
                    {totalNotif}
                  </span>
                  <span className="hidden sm:inline text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
                    {user?.role === "CONSUMIDOR" ? "Por recepcionar" : "Pendiente"}
                  </span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <User className="h-3 w-3 text-teal-600" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{user.nombre}</span>
                  </div>
                  <form action={logoutAction} className="m-0 p-0">
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer active:scale-95"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#227262] bg-teal-50 hover:bg-teal-100 rounded-lg transition-all"
                >
                  <ArrowLeft className="h-3 w-3" /> <span className="hidden sm:inline">Acceso</span> Bodega
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Form Container */}
        <ClientSolicitarForm 
          centrosCosto={centrosCosto} 
          destinos={destinos}
          productos={productos} 
          currentUser={dbUser ? {
            id: dbUser.id,
            nombre: dbUser.nombre,
            username: dbUser.username,
            rut: dbUser.rut,
            areaTrabajo: dbUser.areaTrabajo,
            cargo: dbUser.cargo,
            role: dbUser.role
          } : (user ? {
            id: user.userId,
            nombre: user.nombre,
            username: user.username,
            rut: null,
            areaTrabajo: null,
            cargo: null,
            role: user.role
          } : undefined)}
          userSolicitudes={formattedUserSolicitudes}
          initialTab={initialTab}
          submitRequestAction={submitRequestAction} 
          recepcionarSolicitudAction={recepcionarSolicitudAction}
        />
      </div>
    </div>
  );
}
