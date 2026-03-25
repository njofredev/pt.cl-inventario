"use client";

import { useState, useEffect } from "react";
import { api } from "../../_lib/api_service_client";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: "", bodega_id: "", descripcion: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ubicData, bodegasData] = await Promise.all([
        api.getUbicaciones(),
        api.getBodegas()
      ]);
      setUbicaciones(ubicData);
      setBodegas(bodegasData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUbicaciones = ubicaciones.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bodegas.find(b => b.id === u.bodega_id)?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.bodega_id) return;
    
    try {
      const data = {
        ...formData,
        bodega_id: parseInt(formData.bodega_id)
      };

      if (editingId) {
        await api.updateUbicacion(editingId, data);
      } else {
        await api.createUbicacion(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nombre: "", bodega_id: "", descripcion: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando ubicación");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre,
      bodega_id: item.bodega_id.toString(),
      descripcion: item.descripcion || ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Ubicaciones"
        description="Gestión de estanterías, pasillos o racks específicos."
        icon={MapPin}
        actionLabel="Nueva Ubicación"
        onAction={() => {
          setEditingId(null);
          setFormData({ nombre: "", bodega_id: "", descripcion: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o bodega..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">ID</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Bodega</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Cargando ubicaciones...</td></tr>
              ) : filteredUbicaciones.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8">No hay registros</td></tr>
              ) : filteredUbicaciones.map((ubic, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={ubic.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-medium opacity-60">#{ubic.id}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{ubic.nombre}</td>
                  <td className="px-6 py-4">
                    {bodegas.find(b => b.id === ubic.bodega_id)?.nombre || `ID: ${ubic.bodega_id}`}
                  </td>
                  <td className="px-6 py-4">{ubic.descripcion || "N/A"}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(ubic)}
                      className="text-primary hover:underline font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold text-foreground mb-4">
              {editingId ? "Editar Ubicación" : "Nueva Ubicación"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre (Pasillo/Rack)</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="glass-input" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Pasillo A-01" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bodega</label>
                <select 
                  required
                  className="glass-input bg-background text-foreground"
                  value={formData.bodega_id}
                  onChange={e => setFormData({...formData, bodega_id: e.target.value})}
                >
                  <option value="" disabled>Seleccione bodega...</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Opcional" 
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-gray-500 hover:bg-foreground/5 transition"
                >
                  Cancelar
                </button>
                <button type="submit" className="glass-button">
                  Guardar Ubicación
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
