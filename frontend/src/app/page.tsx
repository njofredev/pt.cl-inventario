"use client";

import { useState, useEffect } from "react";
import { api } from "./_lib/api_service_client";
import { motion } from "framer-motion";
import { TrendingUp, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    valorTotal: 0,
    totalProductos: 0,
    stockCritico: 0,
    recientes: [] as any[],
    masConsumidos: [] as any[]
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [productos, saldos, movimientos, tipos] = await Promise.all([
        api.getProductos(),
        api.getSaldos(),
        api.getMovimientos(),
        api.getTiposMovimiento()
      ]);

      // 1. Valorización Total
      let totalV = 0;
      saldos.forEach((s: any) => {
        const prod = productos.find((p: any) => p.id === s.producto_id);
        if (prod) {
          totalV += parseFloat(s.cantidad) * parseFloat(prod.ppp_actual);
        }
      });

      // 2. Stock Crítico (ej: menos de 5 unidades en total por producto)
      const stockPorProd: Record<number, number> = {};
      saldos.forEach((s: any) => {
        stockPorProd[s.producto_id] = (stockPorProd[s.producto_id] || 0) + parseFloat(s.cantidad);
      });
      const criticos = Object.values(stockPorProd).filter(q => q > 0 && q < 5).length;

      // 3. Mas Consumidos (Salidas)
      // Agrupar movimientos de salida por producto
      const salidas = movimientos.filter((m: any) => {
        const type = tipos.find((t: any) => t.id === m.tipo_movimiento_id);
        return type?.multiplicador === -1;
      });
      
      const conteoSalidas: Record<number, number> = {};
      salidas.forEach((s: any) => {
        conteoSalidas[s.producto_id] = (conteoSalidas[s.producto_id] || 0) + parseFloat(s.cantidad);
      });

      const ranking = Object.entries(conteoSalidas)
        .map(([id, cant]) => ({ 
          nombre: productos.find((p: any) => p.id === parseInt(id))?.nombre || "Desconocido",
          cantidad: cant 
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 3);

      setData({
        valorTotal: totalV,
        totalProductos: productos.length,
        stockCritico: criticos,
        recientes: movimientos.slice(0, 5),
        masConsumidos: ranking
      });

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: "Valorización Total PPP", value: `$${data.valorTotal.toLocaleString('es-CL')}`, icon: TrendingUp, color: "text-primary" },
    { title: "Total Productos", value: data.totalProductos.toString(), icon: Package, color: "text-blue-400" },
    { title: "Stock Crítico", value: data.stockCritico.toString(), icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Resumen Ejecutivo</h1>
          <p className="text-gray-500 mt-1">Información consolidada de la base de datos operativa.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadDashboard} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition" title="Refrescar">
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/movimientos" className="glass-button flex items-center gap-2">
            <span>Nuevo Movimiento</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">{stat.title}</p>
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-bold text-foreground tracking-tighter truncate">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Datos actualizados en vivo</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white text-xs">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel p-6 min-h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Últimos Movimientos</h3>
            <Link href="/movimientos" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 text-gray-500">Cargando...</div>
            ) : data.recientes.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/30 rounded-xl text-gray-500 italic">
                Aún no hay movimientos registrados.
              </div>
            ) : data.recientes.map((mov, i) => (
              <div key={mov.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${parseFloat(mov.cantidad) > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {parseFloat(mov.cantidad) > 0 ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Doc: {mov.referencia_documento || 'Sin Ref.'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(mov.fecha_movimiento).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className={`text-xs sm:text-sm font-bold ${parseFloat(mov.cantidad) > 0 ? 'text-success' : 'text-danger'}`}>
                    ${parseFloat(mov.valor_total).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Top Consumo (Salidas)</h3>
           <div className="space-y-6">
            {loading ? (
              <div className="text-center py-10 text-gray-500">...</div>
            ) : data.masConsumidos.length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic">Sin datos de consumo.</div>
            ) : data.masConsumidos.map((prod, i) => (
              <div key={prod.nombre}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground font-medium">{prod.nombre}</span>
                  <span className="text-primary">{prod.cantidad}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${(prod.cantidad / data.masConsumidos[0].cantidad) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
