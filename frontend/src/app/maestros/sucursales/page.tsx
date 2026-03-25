"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api_service/client";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: "", direccion: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getSucursales();
      setSucursales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSucursales = sucursales.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.direccion && s.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    
    try {
      if (editingId) {
        await api.updateSucursal(editingId, formData);
      } else {
        await api.createSucursal(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nombre: "", direccion: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando sucursal");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre,
      direccion: item.direccion || ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Sucursales"
        description="Gestión de las sedes de la organización."
        icon={Building2}
        actionLabel="Nueva Sucursal"
        onAction={() => {
          setEditingId(null);
          setFormData({ nombre: "", direccion: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o dirección..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">ID</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando sucursales...</td></tr>
              ) : filteredSucursales.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No hay registros</td></tr>
              ) : filteredSucursales.map((sucursal, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={sucursal.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-medium opacity-60">#{sucursal.id}</td>
                   <td className="px-6 py-4 font-bold text-foreground">{sucursal.nombre}</td>
                   <td className="px-6 py-4 text-foreground/80">{sucursal.direccion || "N/A"}</td>
                   <td className="px-6 py-4 text-right">
                     <button 
                       onClick={() => handleEdit(sucursal)}
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
               {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
             </h3>
             <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de Sucursal</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="glass-input" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Sucursal Oriente" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Dirección</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Ej: Av. Principal 123" 
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
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
