import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export const revalidate = 0;

export default async function ProveedoresPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";

  // Build filter query
  const where = search
    ? {
        OR: [
          { razonSocial: { contains: search, mode: "insensitive" as const } },
          { rut: { contains: search, mode: "insensitive" as const } },
          { contacto: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const suppliers = await prisma.proveedor.findMany({
    where,
    orderBy: { razonSocial: "asc" },
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Directorio de Proveedores
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Directorio de contacto para convenios y adquisición de insumos clínicos.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
        <form method="GET" action="/proveedores" className="flex gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Buscar por RUT, Razón Social o Contacto..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl transition-all active-scale-down shadow-sm cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          No se encontraron proveedores con la búsqueda realizada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supplier) => (
            <div 
              key={supplier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all group"
            >
              <div className="space-y-3.5">
                {/* RUT & Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    RUT: {supplier.rut}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                </div>

                {/* Company Name */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                    {supplier.razonSocial}
                  </h3>
                  {supplier.direccion && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate flex items-center">
                      <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 mr-1 flex-shrink-0" />
                      {supplier.direccion}
                    </p>
                  )}
                </div>

                {/* Contact detail list */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  {supplier.contacto && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{supplier.contacto}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">E-mail:</span>
                      <a 
                        href={`mailto:${supplier.email}`}
                        className="font-bold text-teal-600 dark:text-teal-400 hover:underline truncate max-w-[180px]"
                      >
                        {supplier.email.toLowerCase()}
                      </a>
                    </div>
                  )}
                  {supplier.telefono && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Teléfono:</span>
                      <a 
                        href={`tel:${supplier.telefono}`}
                        className="font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {supplier.telefono}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
