'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserPermissions } from "@/lib/permissions";

export async function getBodegasAction() {
  try {
    const permissions = await getUserPermissions();
    const whereClause: any = {};
    if (permissions?.isFiltered) {
      whereClause.id = { in: permissions.bodegasIds };
    }

    const bodegas = await prisma.bodega.findMany({
      where: whereClause,
      include: {
        sucursal: true,
        ubicaciones: {
          orderBy: { nombre: 'asc' },
          include: {
            _count: {
              select: {
                stocks: true,
                movimientos: true,
              },
            },
          },
        },
        _count: {
          select: {
            ubicaciones: true,
            stocks: true,
            movimientos: true,
          },
        },
      },
      orderBy: [
        { sucursal: { nombre: 'asc' } },
        { nombre: 'asc' },
      ],
    });
    return { bodegas: JSON.parse(JSON.stringify(bodegas)) };
  } catch (error) {
    console.error("Error fetching bodegas:", error);
    return { error: "Error al cargar el catálogo de bodegas." };
  }
}

export async function getSucursalesAction() {
  try {
    const permissions = await getUserPermissions();
    const whereClause: any = {};
    if (permissions?.isFiltered) {
      whereClause.id = { in: permissions.sucursalesIds };
    }

    const sucursales = await prisma.sucursal.findMany({
      where: whereClause,
      orderBy: { nombre: 'asc' },
    });
    return { sucursales: JSON.parse(JSON.stringify(sucursales)) };
  } catch (error) {
    console.error("Error fetching sucursales:", error);
    return { error: "Error al cargar las sucursales." };
  }
}

export async function createBodegaAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (permissions?.role !== 'ADMIN') {
    return { error: "Acceso denegado: Sólo los administradores del sistema pueden crear o agregar nuevas bodegas." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  const sucursalId = formData.get("sucursalId") as string;

  if (!nombre || !sucursalId) {
    return { error: "El nombre de la bodega y la sucursal son obligatorios." };
  }

  try {
    const existing = await prisma.bodega.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        sucursalId,
      },
    });

    if (existing) {
      return { error: `La bodega "${nombre}" ya existe en esa sucursal.` };
    }

    await prisma.bodega.create({
      data: {
        nombre,
        sucursalId,
      },
    });

    revalidatePath("/bodegas");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating bodega:", error);
    return { error: "Ocurrió un error al registrar la bodega." };
  }
}

export async function updateBodegaAction(formData: FormData) {
  const permissions = await getUserPermissions();
  if (permissions?.role !== 'ADMIN') {
    return { error: "Acceso denegado: Sólo los administradores pueden modificar bodegas." };
  }

  const id = formData.get("id") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const sucursalId = formData.get("sucursalId") as string;

  if (!id || !nombre || !sucursalId) {
    return { error: "El ID, nombre y sucursal son obligatorios." };
  }

  try {
    await prisma.bodega.update({
      where: { id },
      data: {
        nombre,
        sucursalId,
      },
    });

    revalidatePath("/bodegas");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating bodega:", error);
    return { error: "Ocurrió un error al actualizar la bodega." };
  }
}

export async function deleteBodegaAction(id: string) {
  const permissions = await getUserPermissions();
  if (permissions?.role !== 'ADMIN') {
    return { error: "Acceso denegado: Sólo los administradores pueden eliminar bodegas." };
  }

  if (!id) return { error: "ID no válido." };

  try {
    const bodega = await prisma.bodega.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stocks: true,
            movimientos: true,
            ubicaciones: true,
          },
        },
      },
    });

    if (!bodega) {
      return { error: "Bodega no encontrada." };
    }

    if (bodega._count.stocks > 0 || bodega._count.movimientos > 0) {
      return { 
        error: `No se puede eliminar la bodega "${bodega.nombre}" porque tiene ${bodega._count.stocks} registros de stock o ${bodega._count.movimientos} movimientos registrados.` 
      };
    }

    await prisma.bodega.delete({
      where: { id },
    });

    revalidatePath("/bodegas");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bodega:", error);
    return { error: "No se pudo eliminar la bodega. Verifica que no tenga dependencias." };
  }
}

export async function createUbicacionAction(bodegaId: string, nombre: string) {
  const nameTrimmed = nombre?.trim();
  if (!bodegaId || !nameTrimmed) {
    return { error: "El nombre de la ubicación y el ID de bodega son obligatorios." };
  }

  try {
    const existing = await prisma.ubicacion.findFirst({
      where: {
        bodegaId,
        nombre: { equals: nameTrimmed, mode: 'insensitive' },
      },
    });

    if (existing) {
      return { error: `La ubicación "${nameTrimmed}" ya existe en esta bodega.` };
    }

    await prisma.ubicacion.create({
      data: {
        bodegaId,
        nombre: nameTrimmed,
      },
    });

    revalidatePath("/bodegas");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating ubicacion:", error);
    return { error: "Ocurrió un error al crear la ubicación física." };
  }
}

export async function deleteUbicacionAction(id: string) {
  if (!id) return { error: "ID de ubicación no válido." };

  try {
    const u = await prisma.ubicacion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stocks: true,
            movimientos: true,
          },
        },
      },
    });

    if (!u) return { error: "Ubicación no encontrada." };

    if (u._count.stocks > 0 || u._count.movimientos > 0) {
      return {
        error: `No se puede eliminar "${u.nombre}" porque posee ${u._count.stocks} registros de stock o ${u._count.movimientos} movimientos.`,
      };
    }

    await prisma.ubicacion.delete({
      where: { id },
    });

    revalidatePath("/bodegas");
    revalidatePath("/movimientos");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ubicacion:", error);
    return { error: "Error al eliminar la ubicación física." };
  }
}
