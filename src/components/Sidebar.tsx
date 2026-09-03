'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowLeftRight, 
  ArrowDownLeft,
  ArrowUpRight,
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
  Sparkles,
  ChevronRight,
  ChevronDown,
  MapPin,
  Search
} from "lucide-react";

import { JWTPayload } from "@/lib/auth";
import GlobalSearchModal from "@/components/GlobalSearchModal";

interface SidebarProps {
  user: JWTPayload;
  logoutAction: () => Promise<void>;
}

export default function Sidebar({ user, logoutAction }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greetPeriod, setGreetPeriod] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT'>('AFTERNOON');
  const [greetText, setGreetText] = useState<string>('Buenas tardes');

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Shortcut: Alt + J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check Alt + J (or Alt + j)
      if (e.altKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [novedadesHovered, setNovedadesHovered] = useState(false);
  const [novedadesTop, setNovedadesTop] = useState(220);
  const [hoveredNovedad, setHoveredNovedad] = useState<any | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        { href: "/movimientos?tab=COMPRAS", label: "Recepción / Compras", icon: ArrowDownLeft, badge: "Entrada", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/movimientos?tab=EGRESO_DIRECTO", label: "Salidas / Consumos", icon: ArrowUpRight, badge: "Salida", badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20", roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/movimientos?tab=HISTORIAL", label: "Histórico & Bitácora", icon: ArrowLeftRight, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/solicitudes", label: "Solicitudes", icon: ClipboardList, roles: ["ADMIN", "OPERADOR"] },
      ]
    },
    {
      title: "MANTENEDORES",
      items: [
        { href: "/bodegas", label: "Bodegas y Ubicaciones", icon: Warehouse, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/unidades", label: "Unidades Medida", icon: Tag, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/destinos", label: "Destinos", icon: MapPin, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
        { href: "/proveedores", label: "Proveedores", icon: Users, roles: ["ADMIN", "CONTABLE"] },
        { href: "/usuarios", label: "Gestión Usuarios", icon: ShieldAlert, roles: ["ADMIN"] },
      ]
    }
  ];

  const novedadesItems = [
    { 
      href: "/novedades/vencimientos", 
      label: "Control Vencimientos", 
      icon: CalendarDays, 
      roles: ["ADMIN", "OPERADOR", "CONTABLE"], 
      badge: "PRONTO",
      statusBadge: "Pronto",
      statusColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "Sistema de semáforos (Rojo/Amarillo/Verde) con alertas automatizadas previas al vencimiento de insumos y fármacos. Permite programar retiros automáticos de stock crítico y optimizar el uso de lotes viejos mediante el método FEFO (First Expired, First Out)."
    },
    { 
      href: "/novedades/reposicion", 
      label: "Sugerido de Compras", 
      icon: ShoppingCart, 
      roles: ["ADMIN", "OPERADOR", "CONTABLE"], 
      badge: "PRONTO",
      statusBadge: "Pronto",
      statusColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "Algoritmo de cálculo inteligente que cruza el historial de consumo, niveles críticos y velocidad de rotación. Generará de forma automática una propuesta de orden de compra optimizada para evitar quiebres de stock sin sobredimensionar la bodega."
    },
    { 
      href: "/novedades/arqueo", 
      label: "Toma Física y Mermas", 
      icon: ClipboardCheck, 
      roles: ["ADMIN", "OPERADOR"], 
      badge: "PRONTO",
      statusBadge: "Nuevo",
      statusColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      description: "Módulo de inventariado físico asistido por código de barras. Facilitará arqueos programados, conciliaciones rápidas contra el stock del sistema, y el registro detallado de mermas por rotura, vencimiento o uso clínico con su respectiva justificación."
    },
    { 
      href: "/novedades/kardex", 
      label: "Kardex Valorizado", 
      icon: TrendingUp, 
      roles: ["ADMIN", "CONTABLE"], 
      badge: "PRONTO",
      statusBadge: "Pronto",
      statusColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "Historial contable y de auditoría detallado que calcula el valor monetario del inventario en tiempo real usando el método de Costo Promedio Ponderado (PPP). Reportará saldos iniciales, entradas, salidas y existencias valorizadas para soporte contable directo."
    },
  ].filter(item => item.roles.includes(user.role));

  const isNovedadesActive = pathname.startsWith('/novedades');

  const handleMouseEnterTrigger = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setNovedadesTop(rect.top);
    }
    setNovedadesHovered(true);
  };

  const handleMouseLeaveTrigger = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setNovedadesHovered(false);
    }, 150);
  };

  const handleMouseEnterPopover = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setNovedadesHovered(true);
  };

  const handleMouseLeavePopover = () => {
    setNovedadesHovered(false);
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-3 bottom-3 left-3 w-[270px] bg-white border border-slate-200/80 dark:bg-[#070e1e] dark:border-[#172545] rounded-[26px] shadow-xl shadow-slate-200/50 dark:shadow-2xl justify-between select-none z-40 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Scrollable Upper Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto hide-scrollbar px-3 pt-4 pb-2">
        
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-2 pb-3 mb-1">
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

        {/* Quick Search Trigger (Alt + J) */}
        <div className="px-1 mb-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/90 hover:bg-slate-200/70 dark:bg-[#0d1830] dark:hover:bg-[#132247] border border-slate-200/80 dark:border-[#172545] rounded-2xl transition-all shadow-xs group cursor-pointer"
            title="Buscar en todo el inventario (Alt + J)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate text-[11px]">Buscar...</span>
            </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 shadow-2xs">
              <span className="text-[9px]">Alt</span>
              <span>+</span>
              <span>J</span>
            </div>
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-4">
          {/* Main Menu */}
          {navGroups.slice(0, 1).map((group, gIdx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase px-3 py-1">
                  {group.title}
                </p>

                <nav className="space-y-1">
                  {filteredItems.map((item: any) => {
                    const currentFullUrl = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
                    const isActive = currentFullUrl === item.href || (pathname === item.href && !item.href.includes('?'));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-full transition-all duration-200 group active-scale-down ${
                          isActive 
                            ? "bg-[#05b875] text-white font-bold shadow-lg shadow-[#05b875]/25" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132247]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                            isActive 
                              ? "text-white" 
                              : "text-slate-400 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white"
                          }`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && !isActive && (
                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}

          {/* Administration Menu (Mantenedores) */}
          {navGroups.slice(1).map((group, gIdx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase px-3 py-1">
                  {group.title}
                </p>

                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

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
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}

          {/* NOVEDADES 2026 - Trigger Item (Debajo de Mantenedores) */}
          {novedadesItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-400 uppercase px-3 py-1 flex items-center justify-between">
                <span>NOVEDADES 2026</span>
                <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
              </p>

              <div 
                ref={triggerRef}
                onMouseEnter={handleMouseEnterTrigger}
                onMouseLeave={handleMouseLeaveTrigger}
                className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer select-none ${
                  isNovedadesActive
                    ? "bg-[#05b875] text-white font-extrabold shadow-lg shadow-[#05b875]/25"
                    : novedadesHovered
                    ? "bg-slate-100 dark:bg-[#132247] text-teal-600 dark:text-teal-400 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132247]/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Sparkles className={`h-4.5 w-4.5 shrink-0 ${
                    isNovedadesActive ? "text-white" : "text-amber-500 animate-pulse"
                  }`} />
                  <span className="truncate font-extrabold">Novedades 2026</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                    isNovedadesActive ? "bg-white text-emerald-800" : "bg-amber-500 text-white"
                  }`}>
                    4 APPS
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    novedadesHovered ? "translate-x-1 text-teal-500" : ""
                  }`} />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer / User Profile & Dark Mode */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b1730]/60 space-y-3">
        {/* Clock & Greeting Bar */}
        {mounted && (
          <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-[#070e1e] border border-slate-200/60 dark:border-slate-800 rounded-xl text-[10px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              {greetPeriod === 'MORNING' && <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              {greetPeriod === 'AFTERNOON' && <CloudSun className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
              {greetPeriod === 'NIGHT' && <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
              <span className="truncate">{greetText}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px] text-teal-600 dark:text-[#00e699] font-bold">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{currentTime}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-[#00e699] flex items-center justify-center font-black text-xs shrink-0 border border-teal-200 dark:border-teal-800">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                {user.nombre}
              </p>
              <span className="inline-block text-[9px] font-extrabold tracking-wider uppercase text-teal-600 dark:text-teal-400 leading-tight">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cambiar tema"
            >
              {mounted && darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FIXED POSITION FLYOUT POPOVER (FLAT ON TOP OF EVERYTHING, IMMUNE TO SCROLL CLIPPING) */}
      {novedadesHovered && (
        <div 
          style={{ top: `${novedadesTop}px` }}
          onMouseEnter={handleMouseEnterPopover}
          onMouseLeave={handleMouseLeavePopover}
          className="fixed left-[288px] z-[99999] animate-in fade-in slide-in-from-left-2 duration-150"
        >
          <div className="bg-white/95 dark:bg-[#0c1836]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/90 rounded-2xl p-2.5 shadow-2xl min-w-[250px] space-y-1 border-l-4 border-l-teal-500">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Apps & Módulos 2026
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>

            {novedadesItems.map((novedad) => {
              const isNovedadActive = pathname === novedad.href;
              const NovIcon = novedad.icon;

              return (
                <div
                  key={novedad.href}
                  onMouseEnter={() => setHoveredNovedad(novedad)}
                  onMouseLeave={() => setHoveredNovedad(null)}
                  className="flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 cursor-not-allowed opacity-75 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <NovIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{novedad.label}</span>
                  </div>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    PRONTO
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH MODAL (Alt + J) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

    </aside>
  );
}
