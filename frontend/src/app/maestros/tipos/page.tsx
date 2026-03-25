"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { GitFork, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";

export default function TiposMovPage() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    codigo: "", 
    nombre: "", 
    multiplicador: "1",
    requiere_proveedor: false,
    requiere_centro_costo: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getTiposMovimiento();
      setTipos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTipos = tipos.filter(t => 
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTipoMovimiento({
        ...formData,
        multiplicador: parseInt(formData.multiplicador)
      });
      setIsModalOpen(false);
      setFormData({ codigo: "", nombre: "", multiplicador: "1", requiere_proveedor: false, requiere_centro_costo: false });
      loadData();
    } catch (error) {
      alert("Error creando tipo de movimiento");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <PageHeader 
        title="Tipos de Movimiento"
        description="Definición de reglas para entradas y salidas de inventario."
        icon={GitFork}
        actionLabel="Nuevo Tipo"
        onAction={() => setIsModalOpen(true)}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por código o nombre..."
      />

      <div className="glass-panel p-6 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 mt-2">
          <table className="w-full text-left text-sm text-foreground/80">
            <thead className="bg-secondary text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Cod</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4 text-center">Efecto Stock</th>
                <th className="px-6 py-4 text-center">Req. Prov.</th>
                <th className="px-6 py-4 text-center">Req. CC</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando tipos de movimiento...</td></tr>
              ) : filteredTipos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">No hay registros</td></tr>
              ) : filteredTipos.map((tipo, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={tipo.id} 
                  className="hover:bg-white/5 transition duration-150"
                >
                  <td className="px-6 py-4 font-mono font-bold text-foreground/70">{tipo.codigo}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{tipo.nombre}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tipo.multiplicador === 1 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      {tipo.multiplicador === 1 ? 'ENTRADA (+)' : 'SALIDA (-)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tipo.requiere_proveedor ? <Check className="w-4 h-4 mx-auto text-success" /> : <X className="w-4 h-4 mx-auto text-gray-600" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tipo.requiere_centro_costo ? <Check className="w-4 h-4 mx-auto text-success" /> : <X className="w-4 h-4 mx-auto text-gray-600" />}
                  </td>
                  <td className="px-6 py-4 text-right text-primary hover:underline cursor-pointer">Editar</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-4">Nuevo Tipo de Movimiento</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                  <input required className="glass-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Ajuste por Merma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Código</label>
                  <input required className="glass-input uppercase" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} placeholder="AJU" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Efecto Stock</label>
                  <select className="glass-input bg-background text-foreground" value={formData.multiplicador} onChange={e => setFormData({...formData, multiplicador: e.target.value})}>
                    <option value="1">Entrada (+)</option>
                    <option value="-1">Salida (-)</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.requiere_proveedor} onChange={e => setFormData({...formData, requiere_proveedor: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground/70">¿Requiere Proveedor?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.requiere_centro_costo} onChange={e => setFormData({...formData, requiere_centro_costo: e.target.checked})} className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground/70">¿Requiere Centro de Costo?</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300">Cancelar</button>
                <button type="submit" className="glass-button">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
