"use client";

import { useState, useEffect } from "react";
import { api } from "../../_lib/api_service_client";
import { PieChart } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function CentrosCostoPage() {
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ codigo: "", nombre: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getCentrosCosto();
      setCentros(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCentros = centros.filter(cc => 
    cc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.codigo) return;
    
    try {
      if (editingId) {
        await api.updateCentroCosto(editingId, formData);
      } else {
        await api.createCentroCosto(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ codigo: "", nombre: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando centro de costo");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Centros de Costo"
        description="Definición de departamentos o unidades para imputación de gastos."
        icon={PieChart}
        actionLabel="Nuevo CC"
        onAction={() => {
          setEditingId(null);
          setFormData({ codigo: "", nombre: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por código o nombre..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Código</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8">Cargando centros de costo...</td></tr>
              ) : filteredCentros.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8">No hay registros</td></tr>
              ) : filteredCentros.map((cc, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={cc.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-mono text-foreground/70">{cc.codigo}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{cc.nombre}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(cc)}
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
              {editingId ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Código</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="glass-input" 
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value})}
                  placeholder="Ej: ADM" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre (Concepto)</label>
                <input 
                  required
                  type="text" 
                  className="glass-input" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: ADMINISTRACIÓN" 
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
                  Guardar Centro de Costo
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
