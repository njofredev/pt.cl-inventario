import { prisma } from "@/lib/prisma";
import CuadroForm from "./CuadroForm";

export const dynamic = 'force-dynamic';

export default async function CrearCuadroPage() {
  const sucursales = await prisma.sucursal.findMany({
    orderBy: { nombre: 'asc' }
  });

  const productos = await prisma.product.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      unidad: true
    },
    orderBy: { nombre: 'asc' }
  });

  return (
    <div className="space-y-6">
      <CuadroForm sucursales={sucursales} productos={productos} />
    </div>
  );
}
