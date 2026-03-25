"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Search, Boxes, MapPin, Package, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function SaldosPage() {
  const [saldos, setSaldos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [saldosData, prodData, ubiData] = await Promise.all([
        api.getSaldos(),
        api.getProductos(),
        api.getUbicaciones()
      ]);
      setSaldos(saldosData);
      setProductos(prodData);
      setUbicaciones(ubiData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSaldos = saldos.filter(s => {
    const prod = productos.find(p => p.id === s.producto_id);
    const ubi = ubicaciones.find(u => u.id === s.ubicacion_id);
    return (
      prod?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ubi?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Stock Actual (Saldos)"
        description="Consulta de existencias físicas por producto y ubicación."
        icon={Boxes}
        actionLabel="Actualizar Inventario"
        onAction={loadData}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filtrar por producto o ubicación..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Producto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Cantidad Stock</th>
                <th className="px-6 py-4 text-right">Valorización</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Última Act.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando existencias...</td></tr>
              ) : filteredSaldos.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No hay stock registrado en el sistema</td></tr>
              ) : (
                filteredSaldos.map((saldo, i) => {
                  const prod = productos.find(p => p.id === saldo.producto_id);
                  const ubi = ubicaciones.find(u => u.id === saldo.ubicacion_id);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={saldo.id} 
                      className="hover:bg-white/5 transition duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Package className="w-4 h-4 text-primary/60" />
                           <div>
                             <p className="font-bold text-foreground">{prod?.nombre || `id:${saldo.producto_id}`}</p>
                             <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{prod?.sku}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-warning/60" />
                          <span className="text-foreground/80">{ubi?.nombre || `id:${saldo.ubicacion_id}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${saldo.cantidad <= 5 ? 'text-danger' : 'text-success'}`}>
                          {parseFloat(saldo.cantidad).toLocaleString('es-CL')}
                        </span>
                        <span className="ml-1 text-[10px] text-gray-500">{prod?.unidad_medida}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        ${(parseFloat(saldo.cantidad) * parseFloat(prod?.ppp_actual || 0)).toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-500 whitespace-nowrap">
                        {new Date(saldo.ultima_actualizacion).toLocaleString('es-CL')}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
