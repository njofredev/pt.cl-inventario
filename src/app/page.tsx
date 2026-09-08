import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Users,
  Building,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck
} from "lucide-react";

export const revalidate = 0; // Disable cache so it always queries latest stats

export default async function DashboardPage() {
  // Query DB directly
  const totalProducts = await prisma.product.count();
  const totalSuppliers = await prisma.proveedor.count();
  const totalLocations = await prisma.centroCosto.count();

  // Fetch products to evaluate low stock
  const products = await prisma.product.findMany({
    include: {
      stocks: true,
    },
  });

  const productsWithStock = products.map((p) => {
    const stockTotal = p.stocks.reduce((acc, curr) => acc + curr.cantidad, 0);
    const limit = p.stockCritico || 5;
    return {
      ...p,
      stockTotal,
      isLowStock: stockTotal < limit,
    };
  });

  const lowStockCount = productsWithStock.filter((p) => p.isLowStock).length;

  // Fetch 8 recent movements for better vertical balance
  const recentMovements = await prisma.movimiento.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      tipoMovimiento: true,
      usuario: true,
    },
  });

  return (
    <div className="space-y-6 w-full">
      {/* Welcome banner matching screenshot with defined border */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm border-l-[6px] border-l-[#227262]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Panel de Control - Inventario General
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Visualización integrada del control de stock, movimientos e insumos del Policlínico Tabancura.
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <Link
            href="/movimientos"
            className="inline-flex items-center justify-center px-4.5 py-2.5 text-xs font-bold text-white bg-[#162158] hover:bg-[#0f173e] border border-[#0f173e] rounded-xl transition-all shadow-md active-scale-down"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Registrar Movimiento
          </Link>
        </div>
      </div>

      {/* Metric Cards Row (4 cards) - Más generosos y legibles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cantidad Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cantidad Total</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalProducts}</h3>
            <p className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 mt-1.5">Insumos registrados</p>
          </div>
        </div>

        {/* Card 2: Productos Críticos */}
        <div className={`rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all duration-200 ${lowStockCount > 0
            ? "bg-red-50/70 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800/80 hover:border-red-500 hover:shadow-md hover:shadow-red-500/10"
            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-400/50 hover:shadow-md"
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${lowStockCount > 0 ? "text-red-700 dark:text-red-400" : "text-slate-400"
              }`}>
              Stock Crítico
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${lowStockCount > 0
                ? "bg-red-500 text-white shadow-xs animate-pulse"
                : "bg-red-500/10 border border-red-500/20 text-red-500"
              }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black leading-none ${lowStockCount > 0 ? "text-red-700 dark:text-red-200" : "text-slate-800 dark:text-slate-100"
              }`}>
              {lowStockCount}
            </h3>
            <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
              <span>⚠️</span>
              <span>{lowStockCount} requieren reposición</span>
            </p>
          </div>
        </div>

        {/* Card 3: Proveedores */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-400/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Proveedores Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalSuppliers}</h3>
            <p className="text-[10px] font-extrabold text-blue-500 mt-1.5">Proveedores registrados</p>
          </div>
        </div>

        {/* Card 4: Centro de Costos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-400/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Centros de Costos Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalLocations}</h3>
            <p className="text-[10px] font-extrabold text-amber-600 mt-1.5">Centros de costos registrados</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Movimientos Recientes) and Right (Accesos Rápidos) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Movimientos Recientes */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <FileText className="h-5 w-5 text-teal-600" />
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Movimientos Recientes</h2>
              </div>
              <Link
                href="/movimientos?tab=HISTORIAL"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-teal-700 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-xl transition-all shadow-2xs"
              >
                Ver Bitácora Completa →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-3">Fecha</th>
                    <th className="pb-3">Producto</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Cant.</th>
                    <th className="pb-3 text-right pr-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No se registran movimientos recientes.
                      </td>
                    </tr>
                  ) : (
                    recentMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 pl-3 text-slate-500 font-semibold">
                          {new Date(mov.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                          {mov.product.nombre}
                          <span className="block text-[10px] font-mono font-normal text-slate-400">
                            {mov.product.codigo}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${mov.tipoMovimiento.esEntrada
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            }`}>
                            {mov.tipoMovimiento.nombre}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-black text-sm ${mov.tipoMovimiento.esEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                          }`}>
                          {mov.tipoMovimiento.esEntrada ? '+' : '-'}{mov.cantidad}
                        </td>
                        <td className="py-3 text-right text-slate-500 dark:text-slate-400 pr-3 font-medium text-[11px]">
                          {mov.usuario.nombre.split(' ')[0]}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Accesos Rápidos */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Accesos Rápidos</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Operaciones preferentes del portal de insumos</p>
            </div>

            <div className="space-y-3">
              {/* Option 1 */}
              <Link
                href="/movimientos"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-slate-800 hover:border-teal-500 transition-all shadow-xs group active-scale-down"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 flex-shrink-0 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-teal-700 dark:group-hover:text-teal-300">Registrar Movimiento</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Entrada / salida directa de bodega</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Option 2 */}
              <Link
                href="/solicitudes"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800 hover:border-blue-500 transition-all shadow-xs group active-scale-down"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex-shrink-0 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300">Bandeja de Solicitudes</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Revisión de peticiones de insumos</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Option 3 */}
              <Link
                href="/productos"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50/40 dark:hover:bg-slate-800 hover:border-purple-500 transition-all shadow-xs group active-scale-down"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-500 flex-shrink-0 flex items-center justify-center">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-300">Administrar Productos</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Crear insumos y definir stock crítico</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
