'use server';

import { updateConfiguracionPPP, getConfiguracionEmpresa } from "@/lib/empresaConfig";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export async function saveEmpresaConfigAction(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const user = session ? await verifyJWT(session) : null;
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTABLE')) {
      return { success: false, error: "No tienes permisos para modificar la configuración de la empresa." };
    }

    const pppIncluyeIva = formData.get("pppIncluyeIva") === "true";
    const nombreEmpresa = (formData.get("nombreEmpresa") as string)?.trim() || "Policlínico Tabancura";
    const rutEmpresa = (formData.get("rutEmpresa") as string)?.trim() || "";

    await updateConfiguracionPPP(pppIncluyeIva, nombreEmpresa, rutEmpresa);

    revalidatePath("/configuracion");
    revalidatePath("/movimientos");
    revalidatePath("/productos");
    revalidatePath("/");

    return { 
      success: true, 
      message: "Configuración de empresa guardada correctamente." 
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al guardar la configuración." };
  }
}
