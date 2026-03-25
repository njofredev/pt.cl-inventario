"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    clase: "", 
    nombre: "", 
    codigo: "", 
    descripcion: "" 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getCuentas();
      setCuentas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCuentas = cuentas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clase.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCuenta(editingId, formData);
      } else {
        await api.createCuenta(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ clase: "", nombre: "", codigo: "", descripcion: "" });
      loadData();
    } catch (error) {
      alert("Error guardando cuenta contable");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      clase: item.clase,
      nombre: item.nombre,
      codigo: item.codigo,
      descripcion: item.descripcion || ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full overflow-y-auto pb-10">
      <PageHeader 
        title="Cuentas Contables"
        description="Administración de Clases, Descripciones y Números de Cuenta."
        icon={Settings}
        actionLabel="Nueva Cuenta"
        onAction={() => {
          setEditingId(null);
          setFormData({ clase: "", nombre: "", codigo: "", descripcion: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por clase, nombre o código..."
      />

      <div className="glass-panel p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Clase</th>
                <th className="px-6 py-4">Descripción / Glosa</th>
                <th className="px-6 py-4">Nro Cuenta Contable</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando cuentas...</td></tr>
              ) : filteredCuentas.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No hay registros</td></tr>
              ) : filteredCuentas.map((c, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={c.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-mono font-bold text-primary">{c.clase}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{c.nombre}</td>
                  <td className="px-6 py-4 font-mono text-warning font-bold">{c.codigo}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(c)}
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
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-4">
              {editingId ? "Editar Definición Contable" : "Nueva Definición Contable"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">Clase</label>
                  <input required className="glass-input" value={formData.clase} onChange={e => setFormData({...formData, clase: e.target.value})} placeholder="1000" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Nombre/Descripción</label>
                  <input required className="glass-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="VEHÍCULOS" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nro Cuenta Contable</label>
                <input required className="glass-input" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} placeholder="120201" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notas adicionales</label>
                <input className="glass-input" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="(Opcional)" />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300">Cancelar</button>
                <button type="submit" className="glass-button">Guardar Registro</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
