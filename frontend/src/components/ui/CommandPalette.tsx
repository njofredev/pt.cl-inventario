"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Package, 
  LayoutDashboard, 
  ArrowRightLeft, 
  Boxes, 
  Settings, 
  Building, 
  Database, 
  MapPin, 
  Users, 
  PieChart, 
  GitFork,
  Sun,
  Moon,
  Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchItem {
  id: string;
  name: string;
  href?: string;
  icon: any;
  category: "Navegación" | "Maestros" | "Acciones";
  action?: () => void;
}

export default function CommandPalette({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const items: SearchItem[] = [
    // Navegación
    { id: "dash", name: "Dashboard / Inicio", href: "/", icon: LayoutDashboard, category: "Navegación" },
    { id: "prod", name: "Catálogo de Productos", href: "/productos", icon: Package, category: "Navegación" },
    { id: "mov", name: "Registro de Movimientos", href: "/movimientos", icon: ArrowRightLeft, category: "Navegación" },
    { id: "stock", name: "Stock Actual y Saldos", href: "/saldos", icon: Boxes, category: "Navegación" },
    
    // Maestros
    { id: "m1", name: "Maestro: Cuentas Contables", href: "/maestros/cuentas", icon: Settings, category: "Maestros" },
    { id: "m2", name: "Maestro: Sucursales", href: "/maestros/sucursales", icon: Building, category: "Maestros" },
    { id: "m3", name: "Maestro: Bodegas", href: "/maestros/bodegas", icon: Database, category: "Maestros" },
    { id: "m4", name: "Maestro: Ubicaciones", href: "/maestros/ubicaciones", icon: MapPin, category: "Maestros" },
    { id: "m5", name: "Maestro: Proveedores", href: "/maestros/proveedores", icon: Users, category: "Maestros" },
    { id: "m6", name: "Maestro: Centros de Costo", href: "/maestros/centros_costos", icon: PieChart, category: "Maestros" },
    { id: "m7", name: "Maestro: Tipos de Movimiento", href: "/maestros/tipos", icon: GitFork, category: "Maestros" },

    // Acciones
    { id: "a1", name: "Cambiar a Modo Claro", icon: Sun, category: "Acciones", action: () => { 
        document.documentElement.classList.replace("dark", "light"); 
        localStorage.setItem("theme", "light"); 
        window.location.reload(); // Hard reload for simplicity in theme sync
      } 
    },
    { id: "a2", name: "Cambiar a Modo Oscuro", icon: Moon, category: "Acciones", action: () => { 
        document.documentElement.classList.replace("light", "dark"); 
        localStorage.setItem("theme", "dark"); 
        window.location.reload(); 
      } 
    },
  ];

  const filteredItems = query === "" 
    ? [] 
    : items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const handleSelect = (item: SearchItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    setIsOpen(false);
    setQuery("");
  };

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, [setIsOpen]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10 mx-4"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-secondary/30">
              <Search className="w-5 h-5 text-primary" />
              <input
                autoFocus
                placeholder="¿Qué necesitas buscar? (Navegación, Maestros, Acciones...)"
                className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder:text-gray-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === "Enter" && filteredItems.length > 0) {
                     handleSelect(filteredItems[0]);
                   }
                }}
              />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary border border-border text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                 <Command className="w-3 h-3" /> K
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto p-2">
              {query !== "" && filteredItems.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">
                  No se encontraron resultados para "<span className="text-foreground">{query}</span>"
                </div>
              ) : query === "" ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                     <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Busca cualquier cosa en el sistema</p>
                  <p className="text-xs text-gray-500 mt-1">Escribe para encontrar páginas, maestros o herramientas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {["Navegación", "Maestros", "Acciones"].map((cat) => {
                    const catItems = filteredItems.filter(i => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{cat}</p>
                        <div className="space-y-1">
                          {catItems.map((item: SearchItem) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/10 text-left group transition-all"
                            >
                              <div className="p-2 rounded-lg bg-secondary text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium text-gray-400 group-hover:text-foreground transition-colors">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-border bg-secondary/10 flex items-center justify-between">
               <p className="text-[10px] text-gray-500">Pulsa Enter sobre el primer resultado o haz clic en uno</p>
               <div className="flex gap-2 text-[10px] font-medium text-gray-400">
                  <span>ESC para cerrar</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
