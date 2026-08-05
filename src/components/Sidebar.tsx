'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowLeftRight, 
  ShieldAlert, 
  ClipboardList, 
  LogOut,
  Sun,
  Moon,
  Tag,
  Scale,
  Warehouse
} from "lucide-react";

import { JWTPayload } from "@/lib/auth";

interface SidebarProps {
  user: JWTPayload;
  logoutAction: () => Promise<void>;
}

export default function Sidebar({ user, logoutAction }: SidebarProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navGroups = [
    {
      title: "INVENTARIO Y GESTIÓN",
      items: [
        { href: "/", label: "Panel de Control", icon: LayoutDashboard, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/productos", label: "Productos / Stock", icon: Package, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/bodegas", label: "Bodegas y Ubicaciones", icon: Warehouse, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/unidades", label: "Unidades Medida", icon: Tag, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/solicitudes", label: "Solicitudes", icon: ClipboardList, roles: ["ADMIN", "OPERADOR"] },
      ]
    },
    {
      title: "ADMINISTRACIÓN",
      items: [
        { href: "/cuadros", label: "Cuadros Comparativos", icon: Scale, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/proveedores", label: "Proveedores", icon: Users, roles: ["ADMIN", "CONTABLE"] },
        { href: "/usuarios", label: "Gestión Usuarios", icon: ShieldAlert, roles: ["ADMIN"] },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-50/90 dark:bg-[#0B1326] border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-screen fixed inset-y-0 left-0 justify-between select-none z-30 transition-colors duration-200 font-sans">
      
      {/* Upper Content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E172E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#131E3A] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Policlínico Tabancura
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[9px] font-extrabold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
                  Control Inventario
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5">
          {navGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase px-3 py-1">
                  {group.title}
                </p>

                <nav className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 group active-scale-down ${
                          isActive 
                            ? "bg-[#227262] text-white shadow-sm shadow-teal-950/20" 
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive 
                              ? "text-white" 
                              : "text-slate-400 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                          }`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile & Controls */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-3 space-y-2 bg-white/80 dark:bg-[#0E172E] backdrop-blur-md">
        
        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-[#131E3A]">
          <div className="w-8 h-8 rounded-lg bg-teal-600 dark:bg-teal-500 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            {user.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight">
              {user.nombre}
            </p>
            <span className="inline-block text-[9px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>

        {/* System Theme Toggle Bar */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-[#131E3A]/60">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            {mounted && darkMode ? (
              <Moon className="h-3.5 w-3.5 text-teal-400" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="text-[11px] font-bold">Modo Oscuro</span>
          </div>

          <button 
            type="button"
            onClick={toggleDarkMode}
            aria-label="Cambiar Tema"
            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
              darkMode ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ${
              darkMode ? 'translate-x-3.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Explicit Form-based Logout Button */}
        <form action={logoutAction} className="m-0 p-0 w-full">
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </form>

      </div>
    </aside>
  );
}
