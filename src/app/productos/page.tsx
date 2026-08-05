import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";
import ClientProductsList from "./ClientProductsList";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export const revalidate = 0;

export default async function ProductosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;

  // Fetch CuentaContable for the creation form and detail modal
  const cuentasContables = await prisma.cuentaContable.findMany({
    orderBy: { codigo: "asc" },
  });

  // Fetch UnidadesMedida for unit dropdowns
  const unidadesMedida = await prisma.unidadMedida.findMany({
    orderBy: { nombre: "asc" },
  });

  // Build query filter
  const where: any = search
    ? {
      OR: [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
      ],
    }
    : {};

  // Fetch paginated products with stocks and account
  const products = await prisma.product.findMany({
    where,
    include: {
      stocks: true,
      cuentaContable: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { nombre: "asc" },
  });

  const totalItems = await prisma.product.count({ where });
  const totalPages = Math.ceil(totalItems / pageSize);

  // Compute stock total dynamically for display
  const productsWithStock = products.map((p) => {
    const stockTotal = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
    return {
      ...p,
      stockTotal,
    };
  });

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Administración de Productos & Catálogo DB
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Haz clic en cualquier producto para inspeccionar sus registros internos en la Base de Datos, historial y desglose físico por ubicación.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Form Card */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit">
          <ProductForm 
            cuentasContables={JSON.parse(JSON.stringify(cuentasContables))} 
            unidadesMedida={JSON.parse(JSON.stringify(unidadesMedida))}
          />
        </div>

        {/* Right Column: Search + Table Card + Modal Inspection */}
        <div className="xl:col-span-8 space-y-5">
          <ClientProductsList 
            products={JSON.parse(JSON.stringify(productsWithStock))}
            cuentasContables={JSON.parse(JSON.stringify(cuentasContables))}
            unidadesMedida={JSON.parse(JSON.stringify(unidadesMedida))}
            search={search}
            page={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
