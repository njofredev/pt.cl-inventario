"use client";

import { useState, useEffect } from "react";
import { api } from "../../_lib/api_service_client";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ rut: "", nombre: "", correo_contacto: "", telefono_contacto: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProveedores = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.correo_contacto && p.correo_contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.rut) return;
    
    try {
      if (editingId) {
        await api.updateProveedor(editingId, formData);
      } else {
        await api.createProveedor(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ rut: "", nombre: "", correo_contacto: "", telefono_contacto: "" });
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error guardando proveedor");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      rut: item.rut,
      nombre: item.nombre,
      correo_contacto: item.correo_contacto || "",
      telefono_contacto: item.telefono_contacto || ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Proveedores"
        description="Gestión de proveedores para compras y abastecimiento."
        icon={Users}
        actionLabel="Nuevo Proveedor"
        onAction={() => {
          setEditingId(null);
          setFormData({ rut: "", nombre: "", correo_contacto: "", telefono_contacto: "" });
          setIsModalOpen(true);
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por RUT, nombre o email..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">RUT</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Cargando proveedores...</td></tr>
              ) : filteredProveedores.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8">No hay registros</td></tr>
              ) : filteredProveedores.map((prov, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={prov.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-mono text-foreground/70">{prov.rut}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{prov.nombre}</td>
                  <td className="px-6 py-4 text-foreground/80">{prov.correo_contacto || "N/A"}</td>
                  <td className="px-6 py-4 text-foreground/80">{prov.telefono_contacto || "N/A"}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEdit(prov)}
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
              {editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre / Razón Social</label>
                  <input required type="text" className="glass-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Distribuidora Med" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">RUT</label>
                  <input required type="text" className="glass-input" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} placeholder="12.345.678-9" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                  <input type="text" className="glass-input" value={formData.telefono_contacto} onChange={e => setFormData({...formData, telefono_contacto: e.target.value})} placeholder="+56 9..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email de Contacto</label>
                  <input type="email" className="glass-input" value={formData.correo_contacto} onChange={e => setFormData({...formData, correo_contacto: e.target.value})} placeholder="contacto@proveedor.cl" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-500 hover:bg-foreground/5 transition">Cancelar</button>
                <button type="submit" className="glass-button">Guardar Proveedor</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
