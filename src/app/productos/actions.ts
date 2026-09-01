'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProductAction(formData: FormData) {
  const codigo = (formData.get("codigo") as string)?.trim().toUpperCase();
  const nombre = (formData.get("nombre") as string)?.trim();
  const unidad = (formData.get("unidad") as string)?.trim() || "UND";
  const stockCriticoRaw = formData.get("stockCritico") as string;
  const cuentaContableId = formData.get("cuentaContableId") as string;

  // Conversión de Unidades
  const unidadCompra = (formData.get("unidadCompra") as string)?.trim() || null;
  const unidadesPorEnvaseRaw = formData.get("unidadesPorEnvase") as string;
  const unidadEnvase = (formData.get("unidadEnvase") as string)?.trim() || null;
  const unidadesPorConsumoRaw = formData.get("unidadesPorConsumo") as string;

  // Vencimiento y Lote
  const tieneVencimientoRaw = formData.get("tieneVencimiento") as string;
  const fechaVencimientoRaw = formData.get("fechaVencimiento") as string;
  const lote = (formData.get("lote") as string)?.trim() || null;

  if (!codigo || !nombre) {
    return { error: "El código y el nombre son obligatorios." };
  }

  const stockCritico = parseInt(stockCriticoRaw || "0");
  const unidadesPorEnvase = Math.max(1, parseInt(unidadesPorEnvaseRaw || "1"));
  const unidadesPorConsumo = Math.max(1, parseInt(unidadesPorConsumoRaw || "1"));

  const tieneVencimiento = tieneVencimientoRaw === "true";
  const fechaVencimiento = tieneVencimiento && fechaVencimientoRaw ? new Date(fechaVencimientoRaw) : null;

  try {
    const existing = await prisma.product.findUnique({
      where: { codigo },
    });

    if (existing) {
      return { error: `Ya existe un producto registrado con el código: ${codigo}.` };
    }

    await prisma.product.create({
      data: {
        codigo,
        nombre,
        unidad,
        stockCritico,
        cuentaContableId: cuentaContableId || null,
        unidadCompra,
        unidadesPorEnvase,
        unidadEnvase,
        unidadesPorConsumo,
        tieneVencimiento,
        fechaVencimiento,
        lote,
      },
    });

    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { error: "Ocurrió un error inesperado al registrar el producto." };
  }
}

export async function updateProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const unidad = (formData.get("unidad") as string)?.trim() || "UND";
  const stockCriticoRaw = formData.get("stockCritico") as string;
  const cuentaContableId = formData.get("cuentaContableId") as string;

  // Conversión de Unidades
  const unidadCompra = (formData.get("unidadCompra") as string)?.trim() || null;
  const unidadesPorEnvaseRaw = formData.get("unidadesPorEnvase") as string;
  const unidadEnvase = (formData.get("unidadEnvase") as string)?.trim() || null;
  const unidadesPorConsumoRaw = formData.get("unidadesPorConsumo") as string;

  if (!id || !nombre) {
    return { error: "El ID y el nombre son obligatorios." };
  }

  const stockCritico = parseInt(stockCriticoRaw || "5");
  const unidadesPorEnvase = Math.max(1, parseInt(unidadesPorEnvaseRaw || "1"));
  const unidadesPorConsumo = Math.max(1, parseInt(unidadesPorConsumoRaw || "1"));

  try {
    await prisma.product.update({
      where: { id },
      data: {
        nombre,
        unidad,
        stockCritico,
        cuentaContableId: cuentaContableId || null,
        unidadCompra,
        unidadesPorEnvase,
        unidadEnvase,
        unidadesPorConsumo,
      },
    });

    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { error: "Ocurrió un error al actualizar los datos del producto." };
  }
}

export async function deleteProductAction(id: string) {
  if (!id) return { error: "ID no válido." };

  try {
    // Check if movement exists
    const movementsCount = await prisma.movimiento.count({
      where: { productoId: id }
    });

    if (movementsCount > 0) {
      return { error: `No se puede eliminar el producto porque tiene ${movementsCount} movimientos registrados en el historial.` };
    }

    await prisma.product.delete({
      where: { id }
    });

    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { error: "Ocurrió un error al intentar eliminar el producto." };
  }
}

export async function getProductDetailsAction(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        cuentaContable: true,
        stocks: {
          include: {
            bodega: {
              include: {
                sucursal: true
              }
            },
            ubicacion: true
          }
        },
        movimientos: {
          take: 20,
          orderBy: [
            { fecha: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            tipoMovimiento: true,
            bodega: true,
            ubicacion: true,
            usuario: true,
            proveedor: true,
            centroCosto: true,
            documentoMovimiento: {
              include: {
                proveedor: true
              }
            }
          }
        }
      }
    });

    return { product: JSON.parse(JSON.stringify(product)) };
  } catch (error) {
    console.error("Error getting product details:", error);
    return { error: "Error al cargar los datos del producto." };
  }
}

export async function getNextCorrelativeAction(classCode: string, typeCode: string): Promise<string> {
  const prefix = `${classCode}-${typeCode}-`;
  try {
    const products = await prisma.product.findMany({
      where: {
        codigo: {
          startsWith: prefix,
        },
      },
      select: {
        codigo: true,
      },
    });

    let maxNum = 0;
    for (const p of products) {
      const parts = p.codigo.split("-");
      const numStr = parts[parts.length - 1];
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const nextCode = `${prefix}${nextNum.toString().padStart(4, "0")}`;
    return nextCode;
  } catch (error) {
    console.error("Error getting next correlative:", error);
    return `${prefix}0001`;
  }
}

export async function searchSimilarProductsAction(query: string) {
  if (!query || query.trim().length < 3) return [];
  try {
    const products = await prisma.product.findMany({
      where: {
        nombre: {
          contains: query.trim(),
          mode: "insensitive",
        },
      },
      take: 6,
      select: {
        codigo: true,
        nombre: true,
        clasificacion: true,
        tipoProducto: true,
      },
    });
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error("Error searching similar products:", error);
    return [];
  }
}

export async function quickCreateProductAction(input: {
  codigo?: string;
  nombre: string;
  unidad?: string;
  unidadCompra?: string;
  unidadesPorEnvase?: number;
}) {
  try {
    const nombre = input.nombre.trim();
    if (!nombre) return { error: "El nombre del producto es obligatorio." };

    let codigo = input.codigo?.trim().toUpperCase();

    // If no code provided, generate auto code
    if (!codigo) {
      const count = await prisma.product.count();
      codigo = `PROD-${(count + 1).toString().padStart(4, "0")}`;
    }

    const existing = await prisma.product.findUnique({
      where: { codigo },
    });

    if (existing) {
      const timestamp = Date.now().toString().slice(-4);
      codigo = `${codigo}-${timestamp}`;
    }

    const newProduct = await prisma.product.create({
      data: {
        codigo,
        nombre,
        unidad: input.unidad?.trim() || "UND",
        unidadCompra: input.unidadCompra?.trim() || null,
        unidadesPorEnvase: input.unidadesPorEnvase || 1,
        stockCritico: 5,
      },
    });

    revalidatePath("/productos");
    revalidatePath("/movimientos");
    return { success: true, product: JSON.parse(JSON.stringify(newProduct)) };
  } catch (error: any) {
    console.error("Error in quickCreateProductAction:", error);
    return { error: error.message || "Error al registrar el nuevo producto." };
  }
}

