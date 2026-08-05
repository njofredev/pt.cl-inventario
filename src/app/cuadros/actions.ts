'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCuadrosAction() {
  try {
    return await prisma.cuadroComparativo.findMany({
      include: {
        sucursal: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    });
  } catch (error) {
    console.error("Error al obtener cuadros comparativos:", error);
    return [];
  }
}

export async function getCuadroByIdAction(id: string) {
  try {
    return await prisma.cuadroComparativo.findUnique({
      where: { id },
      include: {
        sucursal: true,
        items: {
          include: {
            producto: true
          }
        }
      }
    });
  } catch (error) {
    console.error("Error al obtener el cuadro comparativo:", error);
    return null;
  }
}

export async function getLatestPriceAction(productoId: string) {
  try {
    const movement = await prisma.movimiento.findFirst({
      where: {
        productoId,
        proveedorId: { not: null }
      },
      include: {
        proveedor: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    return {
      precio: movement?.valorUnitario || 0.0,
      proveedor: movement?.proveedor?.razonSocial || ""
    };
  } catch (error) {
    console.error("Error al obtener el último precio:", error);
    return { precio: 0.0, proveedor: "" };
  }
}

interface SaveItemInput {
  productoId?: string;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario1: number;
  precioUnitario2: number;
  precioUnitario3: number;
  ultimoPrecio?: number;
  ultimoProveedor?: string;
}

interface SaveCuadroInput {
  id?: string;
  fecha: string;
  sucursalId?: string;
  proveedor1: string;
  proveedor2: string;
  proveedor3: string;
  ganador?: number;
  observaciones?: string;
  totalOrdenCompra: number;
  items: SaveItemInput[];
}

export async function saveCuadroAction(data: SaveCuadroInput) {
  try {
    const {
      id,
      fecha,
      sucursalId,
      proveedor1,
      proveedor2,
      proveedor3,
      ganador,
      observaciones,
      totalOrdenCompra,
      items
    } = data;

    const parsedFecha = new Date(fecha);

    if (id) {
      // Actualizar existente: primero eliminamos items anteriores y luego creamos los nuevos
      await prisma.$transaction([
        prisma.cuadroComparativoItem.deleteMany({
          where: { cuadroComparativoId: id }
        }),
        prisma.cuadroComparativo.update({
          where: { id },
          data: {
            fecha: parsedFecha,
            sucursalId: sucursalId || null,
            proveedor1,
            proveedor2,
            proveedor3,
            ganador: ganador || null,
            observaciones: observaciones || "",
            totalOrdenCompra,
            items: {
              create: items.map(item => ({
                productoId: item.productoId || null,
                nombreArticulo: item.nombreArticulo,
                cantidad: item.cantidad,
                precioUnitario1: item.precioUnitario1,
                precioUnitario2: item.precioUnitario2,
                precioUnitario3: item.precioUnitario3,
                ultimoPrecio: item.ultimoPrecio || 0.0,
                ultimoProveedor: item.ultimoProveedor || ""
              }))
            }
          }
        })
      ]);
    } else {
      // Crear nuevo cuadro comparativo
      await prisma.cuadroComparativo.create({
        data: {
          fecha: parsedFecha,
          sucursalId: sucursalId || null,
          proveedor1,
          proveedor2,
          proveedor3,
          ganador: ganador || null,
          observaciones: observaciones || "",
          totalOrdenCompra,
          items: {
            create: items.map(item => ({
              productoId: item.productoId || null,
              nombreArticulo: item.nombreArticulo,
              cantidad: item.cantidad,
              precioUnitario1: item.precioUnitario1,
              precioUnitario2: item.precioUnitario2,
              precioUnitario3: item.precioUnitario3,
              ultimoPrecio: item.ultimoPrecio || 0.0,
              ultimoProveedor: item.ultimoProveedor || ""
            }))
          }
        }
      });
    }

    revalidatePath("/cuadros");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar el cuadro comparativo:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCuadroAction(id: string) {
  try {
    await prisma.cuadroComparativo.delete({
      where: { id }
    });
    revalidatePath("/cuadros");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar el cuadro comparativo:", error);
    return { success: false };
  }
}
