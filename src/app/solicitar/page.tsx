import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import ClientSolicitarForm from "./ClientSolicitarForm";

export const revalidate = 0;

export default async function SolicitarPage() {
  // Obtener Centros de Costo y Productos para el formulario
  const centrosCosto = await prisma.centroCosto.findMany({
    orderBy: { nombre: "asc" }
  });

  const productos = await prisma.product.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      unidad: true,
      unidadCompra: true,
      unidadesPorEnvase: true,
      unidadEnvase: true,
      unidadesPorConsumo: true,
    },
    orderBy: { nombre: "asc" }
  });

  // Action to submit the request
  async function submitRequestAction(data: {
    nombre: string;
    rut: string;
    areaTrabajo: string;
    cargo: string;
    centroCostoId: string;
    items: { productoId: string; cantidad: number }[];
  }) {
    'use server'
    if (!data.nombre || !data.centroCostoId || data.items.length === 0) {
      throw new Error("Datos incompletos.");
    }

    await prisma.solicitud.create({
      data: {
        nombre: data.nombre,
        rut: data.rut || null,
        areaTrabajo: data.areaTrabajo || null,
        cargo: data.cargo || null,
        centroCostoId: data.centroCostoId,
        estado: "PENDIENTE",
        items: {
          create: data.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        }
      }
    });

    return { success: true };
  }

  return (
    <div className="min-h-screen bg-clinical-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-extrabold text-[#162158]">
                Solicitud de Materiales
              </h1>
              <p className="text-xs text-slate-500">
                Formulario público para solicitud de insumos y consumibles - Policlínico Tabancura.
              </p>
            </div>
          </div>
          <Link 
            href="/login" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#227262] bg-teal-50 hover:bg-teal-100 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Acceso Interno
          </Link>
        </div>

        {/* Form Container */}
        <ClientSolicitarForm 
          centrosCosto={centrosCosto} 
          productos={productos} 
          submitRequestAction={submitRequestAction} 
        />
      </div>
    </div>
  );
}
