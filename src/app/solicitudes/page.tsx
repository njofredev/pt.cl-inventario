import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientSolicitudesList from "./ClientSolicitudesList";

export const revalidate = 0;

export default async function SolicitudesPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;

  if (!user || (user.role !== "ADMIN" && user.role !== "OPERADOR")) {
    redirect("/");
  }

  // Fetch all solicitudes with their items, products, and cost centers
  const solicitudes = await prisma.solicitud.findMany({
    include: {
      centroCosto: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      fecha: "desc"
    }
  });

  // Server action to approve or reject a request
  async function updateStatusAction(solicitudId: string, status: "APROBADA" | "RECHAZADA") {
    'use server'
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const adminOrOp = session ? await verifyJWT(session) : null;

    if (!adminOrOp || (adminOrOp.role !== "ADMIN" && adminOrOp.role !== "OPERADOR")) {
      throw new Error("No autorizado");
    }

    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: { estado: status }
    });

    return { success: true };
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Solicitudes de Materiales
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Bandeja de entrada y gestión de requerimientos enviados por el personal.
        </p>
      </div>

      <ClientSolicitudesList 
        solicitudes={JSON.parse(JSON.stringify(solicitudes))} 
        updateStatusAction={updateStatusAction} 
      />
    </div>
  );
}
