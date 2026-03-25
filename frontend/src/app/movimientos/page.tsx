"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/index";
import { Plus, ArrowRightLeft, ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data for form
  const [productos, setProductos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: "",
    ubicacion_id: "",
    tipo_movimiento_id: "",
    cantidad: "",
    precio_unitario: "",
    proveedor_id: "",
    centro_costo_id: "",
    referencia_documento: "",
    notas: ""
  });

  useEffect(() => {
    loadData();
    loadFormData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getMovimientos();
      setMovimientos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [prod, ubi, tip, prov, cen] = await Promise.all([
        api.getProductos(),
        api.getUbicaciones(),
        api.getTiposMovimiento(),
        api.getProveedores(),
        api.getCentrosCosto()
      ]);
      setProductos(prod);
      setUbicaciones(ubi);
      setTipos(tip);
      setProveedores(prov);
      setCentros(cen);
    } catch (error) {
      console.error("Error loading form data", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        producto_id: parseInt(formData.producto_id),
        ubicacion_id: parseInt(formData.ubicacion_id),
        tipo_movimiento_id: parseInt(formData.tipo_movimiento_id),
        cantidad: parseFloat(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario || "0"),
        referencia_documento: formData.referencia_documento,
        notas: formData.notas
      };

      if (formData.proveedor_id) payload.proveedor_id = parseInt(formData.proveedor_id);
      if (formData.centro_costo_id) payload.centro_costo_id = parseInt(formData.centro_costo_id);

      await api.createMovimiento(payload);
      setIsModalOpen(false);
      
      // Reset
      setFormData({
        producto_id: "", ubicacion_id: "", tipo_movimiento_id: "",
        cantidad: "", precio_unitario: "", proveedor_id: "", 
        centro_costo_id: "", referencia_documento: "", notas: ""
      });
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(`Error creando movimiento: ${error.message}`);
    }
  };

  const selectedTipo = tipos.find(t => t.id.toString() === formData.tipo_movimiento_id);

  const filteredMovimientos = movimientos.filter(mov => {
    const prod = productos.find(p => p.id === mov.producto_id);
    const tipo = tipos.find(t => t.id === mov.tipo_movimiento_id);
    const search = searchTerm.toLowerCase();
    return (
      prod?.nombre.toLowerCase().includes(search) ||
      prod?.sku.toLowerCase().includes(search) ||
      tipo?.nombre.toLowerCase().includes(search) ||
      mov.referencia_documento?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Movimientos de Inventario"
        description="Historial de entradas y salidas de bodega. Cálculo en tiempo real de P.P.P."
        icon={ArrowRightLeft}
        actionLabel="Registrar Movimiento"
        onAction={() => setIsModalOpen(true)}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por producto, tipo o referencia..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Tipo</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Cantidad</th>
                <th className="px-6 py-4 text-right">Precio Un.</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 rounded-tr-lg">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr>
              ) : filteredMovimientos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No hay movimientos registrados</td></tr>
              ) : filteredMovimientos.map((mov, i) => {
                const tipoDetails = tipos.find(t => t.id === mov.tipo_movimiento_id);
                const isEntrada = tipoDetails?.multiplicador === 1;
                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={mov.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${isEntrada ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {isEntrada ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                      </div>
                      <span className="font-medium text-xs whitespace-nowrap text-foreground/70">{tipoDetails?.nombre || 'Desconocido'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground max-w-[150px] truncate">
                    {productos.find(p => p.id === mov.producto_id)?.nombre || `Prod #${mov.producto_id}`}
                  </td>
                  <td className="px-6 py-4 text-xs text-foreground/60">
                    {ubicaciones.find(u => u.id === mov.ubicacion_id)?.nombre || `Ubic #${mov.ubicacion_id}`}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${isEntrada ? 'text-success' : 'text-danger'}`}>
                    {isEntrada ? '+' : '-'}{mov.cantidad}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-500">
                    ${parseFloat(mov.precio_unitario).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-foreground">
                    ${parseFloat(mov.valor_total).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(mov.fecha_movimiento).toLocaleString('es-CL')}
                  </td>
                </motion.tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-2xl shadow-2xl relative my-auto"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-4">Registrar Movimiento</h3>
            
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-5">
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Movimiento</label>
                <select required className="glass-input bg-secondary" value={formData.tipo_movimiento_id} onChange={e => setFormData({...formData, tipo_movimiento_id: e.target.value})}>
                  <option value="" disabled>Seleccione tipo...</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Producto</label>
                <select required className="glass-input bg-secondary" value={formData.producto_id} onChange={e => setFormData({...formData, producto_id: e.target.value})}>
                  <option value="" disabled>Seleccione producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Ubicación Origen/Destino</label>
                <select required className="glass-input bg-secondary" value={formData.ubicacion_id} onChange={e => setFormData({...formData, ubicacion_id: e.target.value})}>
                  <option value="" disabled>Seleccione ubicación...</option>
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Cantidad</label>
                <input required type="number" step="0.01" min="0.01" className="glass-input" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} placeholder="Ej: 10" />
              </div>

              {/* Mostrar u Ocultar campos dependiendo de Reglas del Tipo */}
              {selectedTipo?.multiplicador === 1 && (
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Precio Compra Uni. (Afecta PPP)</label>
                  <input required={selectedTipo?.multiplicador === 1} type="number" step="0.01" min="0" className="glass-input" value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: e.target.value})} placeholder="Costo al que ingresó" />
                </div>
              )}

               {selectedTipo?.requiere_proveedor && (
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Proveedor (Requerido)</label>
                  <select required className="glass-input bg-background text-foreground" value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                    <option value="" disabled>Seleccione proveedor...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTipo?.requiere_centro_costo && (
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Centro Costo (Requerido)</label>
                  <select required className="glass-input bg-background text-foreground" value={formData.centro_costo_id} onChange={e => setFormData({...formData, centro_costo_id: e.target.value})}>
                    <option value="" disabled>Seleccione CC...</option>
                    {centros.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Nro Documento / Guía / Factura</label>
                <input type="text" className="glass-input" value={formData.referencia_documento} onChange={e => setFormData({...formData, referencia_documento: e.target.value})} placeholder="Opcional" />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-gray-500 hover:bg-foreground/5 transition">
                  Cancelar
                </button>
                <button type="submit" className="glass-button font-bold px-8">
                  Confirmar Transacción
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
