import { prisma } from "@/lib/prisma";
import UserManagementClient from "./UserManagementClient";

export const revalidate = 0;

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: {
      nombre: "asc",
    },
    include: {
      sucursales: true,
      bodegas: {
        include: {
          sucursal: true,
        },
      },
    },
  });

  const sucursales = await prisma.sucursal.findMany({
    orderBy: { nombre: "asc" }
  });

  const bodegas = await prisma.bodega.findMany({
    orderBy: { nombre: "asc" },
    include: { sucursal: true }
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Gestión de Usuarios
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Crea y administra cuentas con accesos específicos para el sistema.
        </p>
      </div>

      <UserManagementClient 
        initialUsers={users} 
        sucursales={sucursales} 
        bodegas={bodegas} 
      />
    </div>
  );
}

