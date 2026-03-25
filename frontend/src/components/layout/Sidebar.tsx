"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  ArrowRightLeft,
  Database,
  Users,
  MapPin,
  Building,
  Settings,
  PieChart,
  Boxes,
  GitFork
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Movimientos", href: "/movimientos", icon: ArrowRightLeft },
  { name: "Stock Actual", href: "/saldos", icon: Boxes },
];

const masterItems = [
  { name: "1. Cuentas Contables", href: "/maestros/cuentas", icon: Settings },
  { name: "2. Sucursales", href: "/maestros/sucursales", icon: Building },
  { name: "3. Bodegas", href: "/maestros/bodegas", icon: Database },
  { name: "4. Ubicaciones", href: "/maestros/ubicaciones", icon: MapPin },
  { name: "5. Proveedores", href: "/maestros/proveedores", icon: Users },
  { name: "6. Centros de Costo", href: "/maestros/centros_costos", icon: PieChart },
  { name: "7. Tipos de Movimiento", href: "/maestros/tipos", icon: GitFork },
];

export default function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={`w-64 h-dvh border-r border-border bg-background flex flex-col pt-6 z-10 ${isMobile ? 'flex' : 'hidden md:flex'}`} style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="flex-shrink-0">
          <img
            src="/polilogo_color_svg.svg"
            alt="Logo Policlínico"
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold tracking-tight text-foreground leading-snug">Policlínico<br />Tabancura</h1>
          <p className="text-[9px] text-primary font-extrabold uppercase tracking-[0.2em] mt-0.5">/INVENTARIOS</p>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-4 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Operación</p>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Administración (Maestros)</p>
          <div className="flex flex-col gap-1">
            {masterItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
