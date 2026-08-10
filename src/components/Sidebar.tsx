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
  CloudSun,
  Tag,
  Scale,
  Warehouse,
  Clock,
  CalendarDays,
  ShoppingCart,
  ClipboardCheck,
  TrendingUp,
  Sparkles
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
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greetPeriod, setGreetPeriod] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT'>('AFTERNOON');
  const [greetText, setGreetText] = useState<string>('Buenas tardes');

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

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      const rawDate = now.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
      const dateParts = rawDate.replace('.', '').toUpperCase();
      
      const hours = now.getHours();
      let text = 'Buenas tardes';
      let period: 'MORNING' | 'AFTERNOON' | 'NIGHT' = 'AFTERNOON';
      if (hours >= 6 && hours < 12) {
        text = 'Buenos días';
        period = 'MORNING';
      } else if (hours >= 12 && hours < 20) {
        text = 'Buenas tardes';
        period = 'AFTERNOON';
      } else {
        text = 'Buenas noches';
        period = 'NIGHT';
      }

      setCurrentTime(timeStr);
      setCurrentDate(dateParts);
      setGreetText(text);
      setGreetPeriod(period);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
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
      title: "MENÚ PRINCIPAL",
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
      title: "NOVEDADES 2026",
      items: [
        { href: "/novedades/vencimientos", label: "Control Vencimientos", icon: CalendarDays, roles: ["ADMIN", "OPERADOR", "CONTABLE"], badge: "NUEVO" },
        { href: "/novedades/reposicion", label: "Sugerido de Compras", icon: ShoppingCart, roles: ["ADMIN", "OPERADOR", "CONTABLE"], badge: "MVP" },
        { href: "/novedades/arqueo", label: "Toma Física y Mermas", icon: ClipboardCheck, roles: ["ADMIN", "OPERADOR"], badge: "MVP" },
        { href: "/novedades/kardex", label: "Kardex Valorizado", icon: TrendingUp, roles: ["ADMIN", "CONTABLE"], badge: "MVP" },
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
    <aside className="hidden md:flex flex-col fixed top-3 bottom-3 left-3 w-[270px] bg-white border border-slate-200/80 dark:bg-[#070e1e] dark:border-[#172545] rounded-[26px] shadow-xl shadow-slate-200/50 dark:shadow-2xl justify-between select-none z-30 overflow-hidden font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Scrollable Upper Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto hide-scrollbar px-3 pt-4 pb-2">
        
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-2 pb-4 mb-2">
          <div className="w-11 h-11 rounded-full bg-teal-50 border border-teal-100 dark:bg-[#0d1c3a] dark:border-[#1d3058] flex items-center justify-center p-2 shrink-0 shadow-xs">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
              Policlínico Tabancura
            </h1>
            <p className="text-[10px] font-black tracking-wider text-teal-600 dark:text-[#00e699] uppercase leading-tight">
              CONTROL INVENTARIO
            </p>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-4">
          {navGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase px-3 py-1 flex items-center justify-between">
                  <span>{group.title}</span>
                  {group.title.includes("NOVEDADES") && (
                    <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  )}
                </p>

                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const itemWithBadge = item as typeof item & { badge?: string };

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium rounded-full transition-all duration-200 group active-scale-down ${
                          isActive 
                            ? "bg-[#05b875] text-white font-bold shadow-lg shadow-[#05b875]/25" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132247]/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                            isActive 
                              ? "text-white" 
                              : "text-slate-400 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white"
                          }`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {itemWithBadge.badge && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive 
                              ? "bg-white text-emerald-800"
                              : itemWithBadge.badge === 'NUEVO'
                              ? "bg-emerald-500 text-white"
                              : "bg-indigo-500/80 text-white"
                          }`}>
                            {itemWithBadge.badge}
                          </span>
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

      {/* Bottom Fixed Area */}
      <div className="px-3 pb-3 pt-2 space-y-3 bg-slate-50/50 dark:bg-[#070e1e] border-t border-slate-200/80 dark:border-[#172545]/60 transition-colors">
        
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-300 text-teal-800 dark:bg-[#044232] dark:border-[#05b875]/40 dark:text-[#05b875] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {user.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
              {user.nombre}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize leading-tight">
              {user.role === 'ADMIN' ? 'Administrador' : user.role.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Live Clock / Date Card Widget */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 dark:bg-[#0b162f] dark:border-[#172648] relative space-y-1 shadow-xs dark:shadow-inner transition-colors">
          <Clock className="w-4 h-4 text-[#05b875] absolute top-3.5 right-3.5" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <span>{greetText}</span>
            {greetPeriod === 'MORNING' ? (
              <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : greetPeriod === 'AFTERNOON' ? (
              <CloudSun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
          </p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {currentTime || '12:00:00 p.m.'}
          </p>
          <p className="text-[10px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {currentDate || 'CARGANDO...'}
          </p>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-full rounded-full bg-slate-100/80 border border-slate-200/90 dark:bg-[#0b162f] dark:border-[#172648] px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:border-[#223863] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {mounted && darkMode ? (
              <Moon className="h-4 w-4 text-teal-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <span>{mounted && darkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
          </div>

          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
            darkMode ? 'bg-[#05b875]' : 'bg-slate-300'
          }`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
              darkMode ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </div>
        </button>

        {/* Logout Button */}
        <form action={logoutAction} className="m-0 p-0 w-full">
          <button 
            type="submit"
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-600 dark:text-rose-500" />
            <span>Cerrar Sesión</span>
          </button>
        </form>

      </div>
    </aside>
  );
}

