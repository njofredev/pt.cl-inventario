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
      let defaultTipoMovName = esEntrada ? "Ajuste de Entrada" : "Ajuste de Salida";
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

      // Create movement record
      await tx.movimiento.create({
        data: {
          productoId,
          tipoMovimientoId: tipoMov.id,
          cantidad,
          bodegaId,
          ubicacionId: finalUbicacionId || null,
          usuarioId: user.userId,
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
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar movimiento." };
  }
}
