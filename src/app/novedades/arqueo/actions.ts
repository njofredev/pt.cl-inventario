'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export async function registrarAjusteInventario(input: {
  productoId: string;
  bodegaId: string;
  ubicacionId: string;
  cantidadActual: number;
  cantidadContada: number;
  motivo: string;
  observaciones?: string;
}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const user = sessionCookie ? await verifyJWT(sessionCookie) : null;

    if (!user) {
      return { success: false, error: "Usuario no autenticado." };
    }

    const diferencia = input.cantidadContada - input.cantidadActual;
    if (diferencia === 0) {
      return { success: false, error: "La cantidad contada coincide exactamente con el stock actual." };
    }

    const esEntrada = diferencia > 0;
    const absDiferencia = Math.abs(diferencia);

    // Get or create TipoMovimiento for AJUSTE
    let tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { nombre: { contains: "AJUSTE", mode: "insensitive" } },
    });

    if (!tipoMov) {
      tipoMov = await prisma.tipoMovimiento.create({
        data: {
          nombre: "Ajuste por Conteo Físico",
          esEntrada,
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create audit Movimiento
      await tx.movimiento.create({
        data: {
          productoId: input.productoId,
          tipoMovimientoId: tipoMov!.id,
          cantidad: absDiferencia,
          bodegaId: input.bodegaId,
          ubicacionId: input.ubicacionId,
          usuarioId: user.userId,
          documentoTipo: "AJUSTE_ARQUEO",
          recibidoPor: input.motivo,
          documentoNumero: input.observaciones ? input.observaciones.slice(0, 50) : "ARQUEO_AUDITORIA",
        },
      });

      // 2. Update stock physically
      await tx.stock.upsert({
        where: {
          productoId_bodegaId_ubicacionId: {
            productoId: input.productoId,
            bodegaId: input.bodegaId,
            ubicacionId: input.ubicacionId,
          },
        },
        create: {
          productoId: input.productoId,
          bodegaId: input.bodegaId,
          ubicacionId: input.ubicacionId,
          cantidad: input.cantidadContada,
        },
        update: {
          cantidad: input.cantidadContada,
        },
      });
    });

    revalidatePath("/novedades/arqueo");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al registrar ajuste de inventario." };
  }
}
