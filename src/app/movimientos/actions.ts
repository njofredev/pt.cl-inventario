'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { verifyJWT } from "@/lib/auth"

export async function createTransaction(formData: FormData) {
  const productoId = formData.get('productoId') as string;
  const cantidad = parseInt(formData.get('cantidad') as string);
  const esEntrada = formData.get('esEntrada') === 'true';
  const bodegaId = (formData.get('bodegaId') as string) || null;
  const ubicacionId = (formData.get('ubicacionId') as string) || null;
  const recibidoPor = (formData.get('recibidoPor') as string)?.trim() || null;
  const destinoNombre = (formData.get('destinoNombre') as string)?.trim() || null;

  if (!productoId || isNaN(cantidad) || cantidad <= 0) {
    return { error: "Datos de formulario inválidos." };
  }

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const user = session ? await verifyJWT(session) : null;
    if (!user) {
      return { error: "No autorizado. Inicie sesión." };
    }

    const { getUserPermissions } = await import("@/lib/permissions");
    const permissions = await getUserPermissions();
    if (permissions?.isFiltered && bodegaId && !permissions.bodegasIds.includes(bodegaId)) {
      return { error: "No tienes permisos para registrar movimientos en la bodega seleccionada." };
    }

    let correlativoGenerado = '';

    await prisma.$transaction(async (tx) => {
      // 1. Fetch Product
      const product = await tx.product.findUnique({
        where: { id: productoId },
        include: { stocks: true }
      });

      if (!product) {
        throw new Error("El producto seleccionado no existe.");
      }

      // Check default movement type
      let defaultTipoMovName = esEntrada ? "Ajuste de Entrada" : "Consumo Clínico Directo";
      let tipoMov = await tx.tipoMovimiento.findFirst({
        where: { nombre: defaultTipoMovName }
      });

      if (!tipoMov) {
        tipoMov = await tx.tipoMovimiento.findFirst({
          where: { esEntrada }
        });
      }

      if (!tipoMov) {
        throw new Error("No se encontró un tipo de movimiento configurado.");
      }

      // If exit, verify we have enough stock in that bodega/ubicacion
      if (!esEntrada && bodegaId && ubicacionId) {
        const currentStock = await tx.stock.findUnique({
          where: {
            productoId_bodegaId_ubicacionId: {
              productoId,
              bodegaId,
              ubicacionId
            }
          }
        });
        const stockQty = currentStock?.cantidad || 0;
        if (stockQty < cantidad) {
          throw new Error(`Stock insuficiente en la ubicación seleccionada. Solo quedan ${stockQty} unidades.`);
        }
      }

      // Resolve Ubicacion fallback if bodegaId is provided without ubicacionId
      let finalUbicacionId = ubicacionId;
      if (bodegaId && !finalUbicacionId) {
        const defaultUbi = await tx.ubicacion.findFirst({
          where: { bodegaId },
          orderBy: { nombre: 'asc' },
        });
        if (defaultUbi) {
          finalUbicacionId = defaultUbi.id;
        } else {
          const newDefault = await tx.ubicacion.create({
            data: {
              nombre: 'General / Principal',
              bodegaId,
            },
          });
          finalUbicacionId = newDefault.id;
        }
      }

      // Generate Clean Correlative Identifier
      const prefix = esEntrada ? 'ING' : 'SAL';
      const year = new Date().getFullYear();
      const countThisYear = await tx.movimiento.count({
        where: {
          tipoMovimiento: { esEntrada },
          fecha: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
          }
        }
      });
      correlativoGenerado = `${prefix}-${year}-${(countThisYear + 1).toString().padStart(5, '0')}`;

      // Build receptor or destination string
      let receptorFinal = recibidoPor;
      if (destinoNombre) {
        receptorFinal = recibidoPor ? `${recibidoPor} (${destinoNombre})` : destinoNombre;
      }

      // Create movement record with Correlative
      await tx.movimiento.create({
        data: {
          productoId,
          tipoMovimientoId: tipoMov.id,
          cantidad,
          bodegaId,
          ubicacionId: finalUbicacionId || null,
          usuarioId: user.userId,
          recibidoPor: receptorFinal,
          documentoTipo: esEntrada ? 'INGRESO_DIRECTO' : 'SALIDA_DIRECTA',
          documentoNumero: correlativoGenerado,
          pppCalculado: product.ppp,
          valorUnitario: 0.0
        }
      });

      // Update or create stock entry
      if (bodegaId && finalUbicacionId) {
        const stockChange = esEntrada ? cantidad : -cantidad;
        await tx.stock.upsert({
          where: {
            productoId_bodegaId_ubicacionId: {
              productoId,
              bodegaId,
              ubicacionId: finalUbicacionId
            }
          },
          update: {
            cantidad: {
              increment: stockChange
            }
          },
          create: {
            productoId,
            bodegaId,
            ubicacionId: finalUbicacionId,
            cantidad: esEntrada ? cantidad : 0
          }
        });
      }

      // Chronological PPP recalculation
      const { recalcularPPPProducto } = await import('@/lib/kardex');
      await recalcularPPPProducto(tx, productoId);
    });

    revalidatePath('/');
    revalidatePath('/productos');
    revalidatePath('/movimientos');
    return { success: true, correlativo: correlativoGenerado };
  } catch (error: any) {
    return { error: error.message || "Error al registrar movimiento." };
  }
}

export interface BatchEgresoItem {
  productoId: string;
  cantidad: number;
}

export async function createBatchEgreso({
  items,
  bodegaId,
  ubicacionId,
  recibidoPor,
  destinoNombre,
}: {
  items: BatchEgresoItem[];
  bodegaId: string;
  ubicacionId?: string | null;
  recibidoPor?: string | null;
  destinoNombre?: string | null;
}) {
  if (!items || items.length === 0) {
    return { error: "El carrito está vacío. Agrega al menos un producto." };
  }

  if (!bodegaId) {
    return { error: "Debes seleccionar una bodega." };
  }

  for (const item of items) {
    if (!item.productoId || isNaN(item.cantidad) || item.cantidad <= 0) {
      return { error: `Cantidad inválida para uno o más productos.` };
    }
  }

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const user = session ? await verifyJWT(session) : null;
    if (!user) {
      return { error: "No autorizado. Inicie sesión." };
    }

    const { getUserPermissions } = await import("@/lib/permissions");
    const permissions = await getUserPermissions();
    if (permissions?.isFiltered && bodegaId && !permissions.bodegasIds.includes(bodegaId)) {
      return { error: "No tienes permisos para registrar movimientos en la bodega seleccionada." };
    }

    let correlativoGenerado = '';

    await prisma.$transaction(async (tx) => {
      // 1. Tipo de movimiento
      let tipoMov = await tx.tipoMovimiento.findFirst({
        where: { nombre: "Consumo Clínico Directo" }
      });
      if (!tipoMov) {
        tipoMov = await tx.tipoMovimiento.findFirst({
          where: { esEntrada: false }
        });
      }
      if (!tipoMov) {
        throw new Error("No se encontró un tipo de movimiento de salida configurado.");
      }

      // 2. Resolve fallback Ubicacion if not provided
      let finalUbicacionId = ubicacionId;
      if (bodegaId && !finalUbicacionId) {
        const defaultUbi = await tx.ubicacion.findFirst({
          where: { bodegaId },
          orderBy: { nombre: 'asc' },
        });
        if (defaultUbi) {
          finalUbicacionId = defaultUbi.id;
        } else {
          const newDefault = await tx.ubicacion.create({
            data: {
              nombre: 'General / Principal',
              bodegaId,
            },
          });
          finalUbicacionId = newDefault.id;
        }
      }

      // 3. Check products & stock sufficiency for all items
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productoId },
        });
        if (!product) {
          throw new Error(`Uno de los productos no existe.`);
        }

        if (finalUbicacionId) {
          const currentStock = await tx.stock.findUnique({
            where: {
              productoId_bodegaId_ubicacionId: {
                productoId: item.productoId,
                bodegaId,
                ubicacionId: finalUbicacionId
              }
            }
          });
          const stockQty = currentStock?.cantidad || 0;
          if (stockQty < item.cantidad) {
            throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${stockQty}, solicitado: ${item.cantidad}.`);
          }
        }
      }

      // 4. Generate Clean Correlative Identifier
      const prefix = 'SAL';
      const year = new Date().getFullYear();
      const countThisYear = await tx.movimiento.count({
        where: {
          tipoMovimiento: { esEntrada: false },
          fecha: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
          }
        }
      });
      correlativoGenerado = `${prefix}-${year}-${(countThisYear + 1).toString().padStart(5, '0')}`;

      // Build receptor or destination string
      let receptorFinal = recibidoPor?.trim() || null;
      if (destinoNombre?.trim()) {
        receptorFinal = receptorFinal ? `${receptorFinal} (${destinoNombre.trim()})` : destinoNombre.trim();
      }

      // 5. Process all movements & update stock
      const { recalcularPPPProducto } = await import('@/lib/kardex');

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productoId },
        });

        await tx.movimiento.create({
          data: {
            productoId: item.productoId,
            tipoMovimientoId: tipoMov.id,
            cantidad: item.cantidad,
            bodegaId,
            ubicacionId: finalUbicacionId || null,
            usuarioId: user.userId,
            recibidoPor: receptorFinal,
            documentoTipo: 'SALIDA_DIRECTA',
            documentoNumero: correlativoGenerado,
            pppCalculado: product?.ppp || 0,
            valorUnitario: 0.0
          }
        });

        if (bodegaId && finalUbicacionId) {
          await tx.stock.upsert({
            where: {
              productoId_bodegaId_ubicacionId: {
                productoId: item.productoId,
                bodegaId,
                ubicacionId: finalUbicacionId
              }
            },
            update: {
              cantidad: {
                decrement: item.cantidad
              }
            },
            create: {
              productoId: item.productoId,
              bodegaId,
              ubicacionId: finalUbicacionId,
              cantidad: -item.cantidad
            }
          });
        }

        await recalcularPPPProducto(tx, item.productoId);
      }
    });

    revalidatePath('/');
    revalidatePath('/productos');
    revalidatePath('/movimientos');
    return { success: true, correlativo: correlativoGenerado };
  } catch (error: any) {
    return { error: error.message || "Error al procesar el egreso masivo." };
  }
}

