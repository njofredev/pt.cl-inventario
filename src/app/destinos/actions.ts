'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createDestinoAction(formData: FormData) {
  const nombre = (formData.get('nombre') as string)?.trim();
  const sucursalId = formData.get('sucursalId') as string;

  if (!nombre || !sucursalId) {
    return { error: "El nombre y la sucursal son obligatorios." };
  }

  try {
    const existing = await prisma.destino.findUnique({
      where: {
        nombre_sucursalId: {
          nombre,
          sucursalId
        }
      }
    });

    if (existing) {
      return { error: "Este destino ya se encuentra registrado para esta sucursal." };
    }

    await prisma.destino.create({
      data: {
        nombre,
        sucursalId
      }
    });

    revalidatePath('/destinos');
    return { success: true };
  } catch (error) {
    console.error("Error creating destino:", error);
    return { error: "Ocurrió un error al registrar el destino." };
  }
}

export async function updateDestinoAction(id: string, formData: FormData) {
  const nombre = (formData.get('nombre') as string)?.trim();
  const sucursalId = formData.get('sucursalId') as string;

  if (!id || !nombre || !sucursalId) {
    return { error: "El nombre y la sucursal son obligatorios." };
  }

  try {
    const existing = await prisma.destino.findFirst({
      where: {
        nombre,
        sucursalId,
        id: { not: id }
      }
    });

    if (existing) {
      return { error: "Ya existe otro destino con este nombre para la sucursal seleccionada." };
    }

    await prisma.destino.update({
      where: { id },
      data: {
        nombre,
        sucursalId
      }
    });

    revalidatePath('/destinos');
    return { success: true };
  } catch (error) {
    console.error("Error updating destino:", error);
    return { error: "Ocurrió un error al actualizar el destino." };
  }
}

export async function deleteDestinoAction(id: string) {
  if (!id) {
    return { error: "ID de destino inválido." };
  }

  try {
    await prisma.destino.delete({
      where: { id }
    });

    revalidatePath('/destinos');
    return { success: true };
  } catch (error) {
    console.error("Error deleting destino:", error);
    return { error: "Ocurrió un error al intentar eliminar el destino." };
  }
}
