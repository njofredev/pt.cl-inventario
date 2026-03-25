"use client";

import { useState, useEffect } from "react";
import { api } from "../_lib/api_service_client";
import { Plus, Search, Package, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    sku: "", 
    nombre: "", 
    cuenta_contable_id: "",
    unidad_medida: "UN"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, cuentasData, saldosData] = await Promise.all([
        api.getProductos(),
        api.getCuentas(),
        api.getSaldos()
      ]);
      setProductos(prodData);
      setCuentas(cuentasData);
      setSaldos(saldosData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.sku || !formData.cuenta_contable_id) return;
    
    try {
      const data = {
        ...formData,
        cuenta_contable_id: parseInt(formData.cuenta_contable_id)
      };

      if (editingId) {
        await api.updateProducto(editingId, data);
      } else {
        await api.createProducto(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ sku: "", nombre: "", cuenta_contable_id: "", unidad_medida: "UN" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando producto");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      sku: item.sku,
      nombre: item.nombre,
      cuenta_contable_id: item.cuenta_contable_id.toString(),
      unidad_medida: item.unidad_medida || "UN"
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Productos"
        description="Catálogo maestro vinculado a Clases Contables."
        icon={Package}
        actionLabel="Nuevo Producto"
        onAction={() => {
          setEditingId(null);
          setFormData({ sku: "", nombre: "", cuenta_contable_id: "", unidad_medida: "UN" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por SKU o nombre..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">SKU / Código</th>
                <th className="px-6 py-4">Nombre Producto</th>
                <th className="px-6 py-4">Clase / Cuenta Contable</th>
                <th className="px-6 py-4 text-center">Stock Global</th>
                <th className="px-6 py-4 text-right">P.P.P.</th>
                <th className="px-6 py-4 text-right">Valorización</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>
              ) : filteredProductos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8">No hay productos registrados</td></tr>
              ) : filteredProductos.map((prod, i) => {
                const cuenta = cuentas.find(c => c.id === prod.cuenta_contable_id);
                const stockGlobal = saldos
                  .filter(s => s.producto_id === prod.id)
                  .reduce((acc, curr) => acc + parseFloat(curr.cantidad), 0);
                
                const valorizacion = stockGlobal * parseFloat(prod.ppp_actual);
                const isLowStock = stockGlobal > 0 && stockGlobal < 10;

                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={prod.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-mono text-gray-400 font-bold">{prod.sku}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{prod.nombre}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-primary font-bold text-xs">{cuenta?.clase} - {cuenta?.nombre}</span>
                      <span className="text-[10px] text-warning font-mono">{cuenta?.codigo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-lg font-bold ${stockGlobal <= 0 ? 'text-gray-500' : isLowStock ? 'text-warning' : 'text-success'}`}>
                        {stockGlobal.toLocaleString('es-CL')}
                      </span>
                      {isLowStock && (
                        <span className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded uppercase font-bold">Bajo Stock</span>
                      )}
                      {!isLowStock && stockGlobal > 0 && (
                        <span className="text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded uppercase font-bold">Suficiente</span>
                      )}
                    </div>
                  </td>
                   <td className="px-6 py-4 text-right font-medium text-gray-400">
                     ${parseFloat(prod.ppp_actual).toLocaleString('es-CL')}
                   </td>
                   <td className="px-6 py-4 text-right font-bold text-primary">
                     ${valorizacion.toLocaleString('es-CL')}
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button 
                       onClick={() => handleEdit(prod)}
                       className="text-primary hover:underline font-medium"
                     >
                       Editar
                     </button>
                   </td>
                 </motion.tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-background border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl">
             <h3 className="text-xl font-bold text-foreground mb-4">
               {editingId ? "Editar Producto" : "Nuevo Producto"}
             </h3>
             <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                  <input required type="text" className="glass-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Insumo Dental X" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">SKU / Código Único</label>
                  <input required type="text" className="glass-input uppercase font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} placeholder="PROD-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Unidad Medida</label>
                  <select required className="glass-input bg-background text-foreground" value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})}>
                    <option value="UN">Unidad (UN)</option>
                    <option value="KG">Kilogramos (KG)</option>
                    <option value="LT">Litros (LT)</option>
                    <option value="CAJA">Caja</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Asociar a Clase Contable</label>
                  <select required className="glass-input bg-background text-foreground" value={formData.cuenta_contable_id} onChange={e => setFormData({...formData, cuenta_contable_id: e.target.value})}>
                    <option value="" disabled>Seleccione Clase...</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.clase} - {c.nombre} ({c.codigo})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-foreground/5 rounded-lg transition">Cancelar</button>
                <button type="submit" className="glass-button">Guardar Producto</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
