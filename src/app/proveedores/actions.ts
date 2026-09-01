'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProveedor(formData: FormData) {
  try {
    const rut = formData.get("rut")?.toString().trim();
    const razonSocial = formData.get("razonSocial")?.toString().trim();
    const contacto = formData.get("contacto")?.toString().trim() || null;
    const email = formData.get("email")?.toString().trim() || null;
    const telefono = formData.get("telefono")?.toString().trim() || null;
    const direccion = formData.get("direccion")?.toString().trim() || null;
    const condicionPago = formData.get("condicionPago")?.toString().trim() || null;

    if (!rut || !razonSocial) {
      return { success: false, error: "El RUT y la Razón Social son obligatorios." };
    }

    const cleanRut = rut.toUpperCase();

    // Check if supplier RUT already exists
    const existing = await prisma.proveedor.findUnique({
      where: { rut: cleanRut },
    });

    if (existing) {
      return { success: false, error: `Ya existe un proveedor registrado con el RUT ${cleanRut}.` };
    }

    await prisma.proveedor.create({
      data: {
        rut: cleanRut,
        razonSocial,
        contacto,
        email,
        telefono,
        direccion,
        condicionPago,
      },
    });

    revalidatePath("/proveedores");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating proveedor:", error);
    return { success: false, error: error.message || "Error al registrar el proveedor." };
  }
}

export async function updateProveedorAction(id: string, formData: FormData) {
  try {
    const rut = formData.get("rut")?.toString().trim();
    const razonSocial = formData.get("razonSocial")?.toString().trim();
    const contacto = formData.get("contacto")?.toString().trim() || null;
    const email = formData.get("email")?.toString().trim() || null;
    const telefono = formData.get("telefono")?.toString().trim() || null;
    const direccion = formData.get("direccion")?.toString().trim() || null;
    const condicionPago = formData.get("condicionPago")?.toString().trim() || null;

    if (!id || !rut || !razonSocial) {
      return { success: false, error: "El RUT y la Razón Social son obligatorios." };
    }

    await prisma.proveedor.update({
      where: { id },
      data: {
        rut: rut.toUpperCase(),
        razonSocial,
        contacto,
        email,
        telefono,
        direccion,
        condicionPago,
      },
    });

    revalidatePath("/proveedores");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating proveedor:", error);
    return { success: false, error: error.message || "Error al actualizar el proveedor." };
  }
}
