'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProductExpiration(productId: string, lote: string, fechaVencimiento: string | null) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        lote: lote.trim() || null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        tieneVencimiento: !!fechaVencimiento,
      },
    });

    revalidatePath("/novedades/vencimientos");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar vencimiento." };
  }
}
