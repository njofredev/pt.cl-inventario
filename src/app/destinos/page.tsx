import { prisma } from "@/lib/prisma";
import { seedDestinos } from "./seed";
import DestinosClient from "./DestinosClient";

export const revalidate = 0;

export default async function DestinosPage() {
  // 1. Run seed check to preload initial data if empty
  await seedDestinos();

  // 2. Fetch destinations with their sucursal relation
  const destinos = await prisma.destino.findMany({
    include: {
      sucursal: true
    },
    orderBy: [
      { sucursal: { nombre: "asc" } },
      { nombre: "asc" }
    ]
  });

  // 3. Fetch sucursales for dropdown selection
  const sucursales = await prisma.sucursal.findMany({
    orderBy: {
      nombre: "asc"
    }
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Mantenedor de Destinos Físicos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Administra las ubicaciones físicas de destino del inventario, asignando cada una a su sucursal respectiva.
        </p>
      </div>

      <DestinosClient 
        initialDestinos={JSON.parse(JSON.stringify(destinos))} 
        sucursales={JSON.parse(JSON.stringify(sucursales))} 
      />
    </div>
  );
}
