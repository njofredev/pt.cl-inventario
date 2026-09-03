import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import ClientSolicitudesList from "./ClientSolicitudesList";

export const revalidate = 0;

export default async function SolicitudesPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;

  if (!user || (user.role !== "ADMIN" && user.role !== "OPERADOR")) {
    redirect("/");
  }

  // Fetch all solicitudes with their items, products (with stocks), and cost centers
  const rawSolicitudes = await prisma.solicitud.findMany({
    include: {
      centroCosto: true,
      items: {
        include: {
          product: {
            include: {
              stocks: {
                select: {
                  cantidad: true,
                  bodega: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      fecha: "desc"
    }
  });

  const solicitudes = rawSolicitudes.map(s => ({
    ...s,
    items: s.items.map(item => ({
      id: item.id,
      productoId: item.productoId,
      cantidad: item.cantidad,
      product: {
        codigo: item.product.codigo,
        nombre: item.product.nombre,
        unidad: item.product.unidad,
        stockTotal: item.product.stocks.reduce((acc, st) => acc + st.cantidad, 0),
        stocks: item.product.stocks.map(st => ({
          bodega: st.bodega.nombre,
          cantidad: st.cantidad
        }))
      }
    }))
  }));

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Solicitudes de Materiales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Bandeja de entrada y gestión de requerimientos enviados por el personal clínico.
          </p>
        </div>

        <Link
          href="/solicitar"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#227262] hover:bg-[#1a5b4e] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Abrir Portal de Solicitud (Consumidor)
        </Link>
      </div>

      <ClientSolicitudesList 
        solicitudes={JSON.parse(JSON.stringify(solicitudes))} 
        updateStatusAction={updateStatusAction} 
      />
    </div>
  );
}
