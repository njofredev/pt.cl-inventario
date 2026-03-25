"use client";

import { useState, useEffect } from "react";
import { api } from "../../_lib/api_service_client";
import { Building } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function BodegasPage() {
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: "", sucursal_id: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bodegasData, sucursalesData] = await Promise.all([
        api.getBodegas(),
        api.getSucursales()
      ]);
      setBodegas(bodegasData);
      setSucursales(sucursalesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBodegas = bodegas.filter(b => 
    b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sucursales.find(s => s.id === b.sucursal_id)?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.sucursal_id) return;
    
    try {
      const data = {
        nombre: formData.nombre,
        sucursal_id: parseInt(formData.sucursal_id)
      };

      if (editingId) {
        await api.updateBodega(editingId, data);
      } else {
        await api.createBodega(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nombre: "", sucursal_id: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando bodega");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre,
      sucursal_id: item.sucursal_id.toString()
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Bodegas"
        description="Gestión de áreas de almacenamiento de la empresa."
        icon={Building}
        actionLabel="Nueva Bodega"
        onAction={() => {
          setEditingId(null);
          setFormData({ nombre: "", sucursal_id: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o sucursal..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">ID</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Sucursal Asignada</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando bodegas...</td></tr>
              ) : filteredBodegas.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No hay registros</td></tr>
              ) : filteredBodegas.map((bodega, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={bodega.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-medium opacity-60">#{bodega.id}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{bodega.nombre}</td>
                  <td className="px-6 py-4">
                    {sucursales.find(s => s.id === bodega.sucursal_id)?.nombre || `ID: ${bodega.sucursal_id}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(bodega)}
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
              {editingId ? "Editar Bodega" : "Nueva Bodega"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de Bodega</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="glass-input" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Bodega Central" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Sucursal</label>
                <select 
                  required
                  className="glass-input bg-background appearance-none text-foreground"
                  value={formData.sucursal_id}
                  onChange={e => setFormData({...formData, sucursal_id: e.target.value})}
                >
                  <option value="" disabled>Seleccione una sucursal...</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button type="submit" className="glass-button">
                  Guardar Bodega
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
