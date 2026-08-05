'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUnidadesAction() {
  try {
    const unidades = await prisma.unidadMedida.findMany({
      orderBy: { nombre: 'asc' },
    });
    return { unidades: JSON.parse(JSON.stringify(unidades)) };
  } catch (error) {
    console.error("Error fetching unidades:", error);
    return { error: "Error al cargar las unidades de medida." };
  }
}

export async function createUnidadAction(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim().toUpperCase();

  if (!nombre) {
    return { error: "El nombre de la unidad es obligatorio." };
  }

  try {
    const existing = await prisma.unidadMedida.findUnique({
      where: { nombre },
    });

    if (existing) {
      return { error: `La unidad "${nombre}" ya está registrada.` };
    }

    await prisma.unidadMedida.create({
      data: { nombre },
    });

    revalidatePath("/unidades");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating unidad:", error);
    return { error: "Ocurrió un error al registrar la unidad de medida." };
  }
}

export async function updateUnidadAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nombre = (formData.get("nombre") as string)?.trim().toUpperCase();

  if (!id || !nombre) {
    return { error: "El ID y el nombre son obligatorios." };
  }

  try {
    await prisma.unidadMedida.update({
      where: { id },
      data: { nombre },
    });

    revalidatePath("/unidades");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating unidad:", error);
    return { error: "Ocurrió un error al actualizar la unidad." };
  }
}

export async function deleteUnidadAction(id: string) {
  if (!id) return { error: "ID no válido." };

  try {
    await prisma.unidadMedida.delete({
      where: { id },
    });

    revalidatePath("/unidades");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting unidad:", error);
    return { error: "No se pudo eliminar la unidad de medida." };
  }
}
