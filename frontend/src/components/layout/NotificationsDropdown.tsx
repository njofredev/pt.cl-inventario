"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Package, AlertTriangle, ArrowUpRight, Clock, Check } from "lucide-react";
import { api } from "../../app/_lib/api_service_client";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [productos, saldos, movimientos] = await Promise.all([
        api.getProductos(),
        api.getSaldos(),
        api.getMovimientos()
      ]);

      const newNotifications: any[] = [];

      // 1. Detección de Stock Bajo (Total consolidado < 5)
      const stockPorProd: Record<number, number> = {};
      saldos.forEach((s: any) => {
        stockPorProd[s.producto_id] = (stockPorProd[s.producto_id] || 0) + parseFloat(s.cantidad);
      });

      Object.entries(stockPorProd).forEach(([prodId, cantidad]) => {
        if (cantidad > 0 && cantidad < 5) {
          const prod = productos.find((p: any) => p.id === parseInt(prodId));
          if (prod) {
            newNotifications.push({
              id: `low-stock-${prodId}`,
              type: 'alert',
              title: 'Stock Crítico',
              message: `${prod.nombre} tiene solo ${cantidad} unidades.`,
              time: 'Ahora',
              icon: AlertTriangle,
              color: 'text-warning'
            });
          }
        }
      });

      // 2. Últimos Ingresos (Movimientos positivos de las últimas 24h o últimos 3)
      const ingresos = movimientos
        .filter((m: any) => parseFloat(m.cantidad) > 0)
        .slice(0, 3);
      
      ingresos.forEach((ing: any) => {
        const prod = productos.find((p: any) => p.id === ing.producto_id);
        newNotifications.push({
          id: `new-entry-${ing.id}`,
          type: 'info',
          title: 'Nuevo Ingreso',
          message: `${prod?.nombre || 'Producto'}: +${ing.cantidad} unidades.`,
          time: new Date(ing.fecha_movimiento).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          icon: ArrowUpRight,
          color: 'text-success'
        });
      });

      setNotifications(newNotifications);
      setHasUnread(newNotifications.length > 0);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasUnread(false);
        }}
        className="p-2 text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-lg transition relative group"
      >
        <Bell className={`w-5 h-5 transition-transform ${isOpen ? 'scale-110 text-primary' : 'group-hover:rotate-12'}`} />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground">Notificaciones</h3>
              <button 
                onClick={loadNotifications}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> Actualizar
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Cargando alertas...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm italic">
                  No hay alertas pendientes.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 p-2 rounded-lg bg-secondary ${notif.color}`}>
                          <notif.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-xs font-bold text-foreground">{notif.title}</p>
                            <span className="text-[10px] text-gray-500">{notif.time}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border bg-secondary/10 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-foreground transition flex items-center justify-center gap-2 w-full"
              >
                <Check className="w-3 h-3" /> Marcar todas como leídas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
