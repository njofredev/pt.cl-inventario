import { cookies } from "next/headers";
import { verifyJWT } from "./auth";
import { prisma } from "./prisma";

export interface UserPermissions {
  userId: string;
  role: string;
  sucursalesIds: string[]; // IDs de sucursales permitidas
  bodegasIds: string[];    // IDs de bodegas permitidas
  isFiltered: boolean;     // true si el acceso está restringido a bodegas/sucursales específicas
}

export async function getUserPermissions(): Promise<UserPermissions | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;

    const payload = await verifyJWT(session);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        sucursales: { select: { id: true } },
        bodegas: { select: { id: true } }
      }
    });

    if (!user) return null;

    const sucursalesIds = user.sucursales.map(s => s.id);
    const bodegasIds = user.bodegas.map(b => b.id);

    // Si tiene sucursales asignadas pero no bodegas asignadas explícitamente,
    // debemos incluir de forma implícita todas las bodegas pertenecientes a esas sucursales.
    let finalBodegasIds = [...bodegasIds];
    if (sucursalesIds.length > 0 && bodegasIds.length === 0) {
      const implicitBodegas = await prisma.bodega.findMany({
        where: { sucursalId: { in: sucursalesIds } },
        select: { id: true }
      });
      finalBodegasIds = implicitBodegas.map(b => b.id);
    }

    // Se filtra si el usuario no es ADMIN o si tiene asignaciones explícitas de sucursales/bodegas
    const isFiltered = user.role !== 'ADMIN' && (sucursalesIds.length > 0 || finalBodegasIds.length > 0);

    return {
      userId: user.id,
      role: user.role,
      sucursalesIds,
      bodegasIds: finalBodegasIds,
      isFiltered
    };
  } catch (error) {
    console.error("Error retrieving user permissions:", error);
    return null;
  }
}
