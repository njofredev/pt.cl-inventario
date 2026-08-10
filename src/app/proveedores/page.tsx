import { prisma } from "@/lib/prisma";
import ProveedoresClient from "./ProveedoresClient";

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export const revalidate = 0;

export default async function ProveedoresPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";

  const suppliers = await prisma.proveedor.findMany({
    orderBy: { razonSocial: "asc" },
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Directorio de Proveedores
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Gestión de proveedores, convenios y adquisición de insumos clínicos.
        </p>
      </div>

      <ProveedoresClient
        suppliers={JSON.parse(JSON.stringify(suppliers))}
        initialSearch={search}
      />
    </div>
  );
}
