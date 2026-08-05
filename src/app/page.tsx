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

  // Fetch 5 recent movements
  const recentMovements = await prisma.movimiento.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      tipoMovimiento: true,
      usuario: true,
    }
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Welcome banner matching screenshot with defined border */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm border-l-[6px] border-l-[#227262]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 flex-shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Panel de Control - Inventario General</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Visualización integrada del control de stock, movimientos e insumos del Policlínico Tabancura.</p>
          </div>
        </div>
        <div className="mt-3 md:mt-0 flex-shrink-0">
          <Link
            href="/movimientos"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-[#162158] hover:bg-[#0f173e] border border-[#0f173e] rounded-xl transition-all shadow-sm active-scale-down"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Registrar Movimiento
          </Link>
        </div>
      </div>

      {/* Metric Cards Row (4 cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cantidad Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Cantidad Total</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{totalProducts}</h3>
            <p className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 mt-1">Materiales registrados</p>
          </div>
        </div>

        {/* Card 2: Productos Críticos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-red-400/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Stock Crítico</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{lowStockCount}</h3>
            <p className="text-[9px] font-extrabold text-red-500 mt-1">{lowStockCount} requieren reposición</p>
          </div>
        </div>

        {/* Card 3: Proveedores */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-blue-400/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Convenios</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{totalSuppliers}</h3>
            <p className="text-[9px] font-extrabold text-blue-500 mt-1">Proveedores activos</p>
          </div>
        </div>

        {/* Card 4: Centro de Costos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-400/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Establecimientos</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Building className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{totalLocations}</h3>
            <p className="text-[9px] font-extrabold text-amber-600 mt-1">Centros de costo destino</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Wider) and Right (Narrower) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Movements Table Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Movimientos Recientes</h2>
              </div>
              <Link 
                href="/movimientos" 
                className="px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-teal-700 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-lg transition-all"
              >
                Ver todos
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 pl-2">Fecha</th>
                    <th className="pb-2">Producto</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2 text-right">Cant.</th>
                    <th className="pb-2 text-right pr-2">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        No se registran movimientos recientes.
                      </td>
                    </tr>
                  ) : (
                    recentMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 pl-2 text-slate-500 font-medium">
                          {new Date(mov.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                          {mov.product.nombre}
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                            mov.tipoMovimiento.esEntrada 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {mov.tipoMovimiento.nombre}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right font-extrabold ${
                          mov.tipoMovimiento.esEntrada ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {mov.tipoMovimiento.esEntrada ? '+' : '-'}{mov.cantidad}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 pr-2 font-medium">
                          {mov.usuario.nombre.split(' ')[0]}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Temporal Graph Card (Mock design representation) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Tendencia Temporal de Consumos</h2>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[9px] font-bold text-slate-600 border border-slate-200 dark:border-slate-700">
                <button className="px-2.5 py-0.5 hover:text-slate-900">Día</button>
                <button className="px-2.5 py-0.5 hover:text-slate-900">Semana</button>
                <button className="px-2.5 py-0.5 hover:text-slate-900">Mes</button>
                <button className="px-2.5 py-0.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm rounded-md border border-slate-200 dark:border-slate-700">Todo</button>
              </div>
            </div>
            {/* Visual representation of chart */}
            <div className="h-36 flex items-end justify-between px-2 pt-4 relative">
              <div className="absolute inset-x-0 top-8 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Límite Estimado</span>
              </div>
              <div className="w-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all rounded-t-lg h-[40%] flex items-center justify-center"><span className="text-[9px] font-extrabold text-slate-500">Ene</span></div>
              <div className="w-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all rounded-t-lg h-[60%] flex items-center justify-center"><span className="text-[9px] font-extrabold text-slate-500">Feb</span></div>
              <div className="w-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all rounded-t-lg h-[55%] flex items-center justify-center"><span className="text-[9px] font-extrabold text-slate-500">Mar</span></div>
              <div className="w-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all rounded-t-lg h-[85%] flex items-center justify-center"><span className="text-[9px] font-extrabold text-slate-500">Abr</span></div>
              <div className="w-10 bg-teal-500/20 border border-teal-500/40 hover:bg-teal-500/30 transition-all rounded-t-lg h-[70%] flex items-center justify-center"><span className="text-[9px] font-extrabold text-teal-700 dark:text-teal-300">May</span></div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick Actions Card with Defined Clickable Borders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Accesos Rápidos</h2>
              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Operaciones preferentes del portal de insumos</p>
            </div>
            
            <div className="space-y-2.5">
              {/* Option 1 */}
              <Link 
                href="/movimientos"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-slate-800 hover:border-teal-500 transition-all shadow-2xs group active-scale-down"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-600 flex-shrink-0 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-teal-700 dark:group-hover:text-teal-300">Registrar Movimiento</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Entrada/salida directa de bodega</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Option 2 */}
              <Link 
                href="/solicitudes"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800 hover:border-blue-500 transition-all shadow-2xs group active-scale-down"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 flex-shrink-0 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300">Bandeja de Solicitudes</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Revisión de peticiones de insumos</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Option 3 */}
              <Link 
                href="/productos"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50/40 dark:hover:bg-slate-800 hover:border-purple-500 transition-all shadow-2xs group active-scale-down"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-500 flex-shrink-0 flex items-center justify-center">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-300">Administrar Productos</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Crear insumos y definir stock crítico</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Solicitud Status Dictionary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Estados de Solicitudes</h2>
              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Referencia rápida del flujo de solicitudes</p>
            </div>
            
            <div className="space-y-2.5 text-[10px]">
              {/* Pendiente */}
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-amber-50/40 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0">
                  PENDIENTE
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-tight">Ingresada y en espera de aprobación de bodega.</p>
              </div>

              {/* Aprobada */}
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-emerald-50/40 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                  APROBADA
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-tight">Insumos autorizados y descontados de stock.</p>
              </div>

              {/* Rechazada */}
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-rose-50/40 border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/40">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex-shrink-0">
                  RECHAZADA
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-tight">Petición cancelada o falta de stock.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
