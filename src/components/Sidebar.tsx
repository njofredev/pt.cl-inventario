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
  Search,
  Sliders,
  FolderTree,
  Bell,
  Check
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

  // Solicitudes Pendientes Count & Resumen (Notificación en vivo)
  const [pendientesCount, setPendientesCount] = useState<number>(0);
  const [pendingItemsList, setPendingItemsList] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifCoords, setNotifCoords] = useState<{ top: number; left: number }>({ top: 60, left: 240 });
  const notifRef = useRef<HTMLDivElement>(null);
  const notifPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPendientes = async () => {
      try {
        const res = await fetch("/api/solicitudes/pendientes");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            // Para ADMIN/OPERADOR: pendientesCount de bodega
            // Para CONSUMIDOR: solicitudes despachadas pendientes de recepcionar
            if (user.role === 'CONSUMIDOR') {
              setPendientesCount(data.userPorRecepcionarCount || 0);
              setPendingItemsList(data.userPorRecepcionarList || []);
            } else {
              setPendientesCount(data.pendientesCount || 0);
              setPendingItemsList(data.pendingSolicitudes || []);
            }
          }
        }
      } catch (e) {
        // Silently handle error
      }
    };

    fetchPendientes();
    // Actualizar periódicamente cada 15 segundos
    const interval = setInterval(fetchPendientes, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user.role]);

  // Toggle notifications popover and calculate position
  const toggleNotifPopover = () => {
    if (!isNotifOpen && notifRef.current) {
      const rect = notifRef.current.getBoundingClientRect();
      setNotifCoords({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setIsNotifOpen(prev => !prev);
  };

  // Click outside to close notifications popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notifRef.current && !notifRef.current.contains(target) &&
        notifPopoverRef.current && !notifPopoverRef.current.contains(target)
      ) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

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

  const directTopItem = {
    href: "/",
    label: "Panel de Control",
    icon: LayoutDashboard,
    roles: ["ADMIN", "OPERADOR", "CONTABLE"],
  };

  const navGroups = [
    {
      title: "GESTIÓN DE STOCK",
      subsections: [
        {
          items: [
            { href: "/productos", label: "Catálogo / Stock Actual", icon: Package, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
            { href: "/solicitudes", label: "Solicitudes de Insumos", icon: ClipboardList, roles: ["ADMIN", "OPERADOR"] },
            { href: "/solicitar?tab=BUSCADOR", label: "Búsqueda Rápida", icon: Search, roles: ["CONSUMIDOR"] },
            { href: "/solicitar?tab=CATALOGO", label: "Por Categorías", icon: FolderTree, roles: ["CONSUMIDOR"] },
            { href: "/solicitar?tab=HISTORIAL", label: "Mis Solicitudes", icon: ClipboardList, roles: ["CONSUMIDOR"] },
          ]
        },
        {
          label: "Movimientos",
          items: [
            { href: "/movimientos?tab=COMPRAS", label: "Entradas (Recepción)", icon: ArrowDownLeft, badge: "Entrada", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
            { href: "/movimientos?tab=EGRESO_DIRECTO", label: "Salidas (Consumos)", icon: ArrowUpRight, badge: "Salida", badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20", roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
            { href: "/movimientos?tab=HISTORIAL", label: "Histórico y Bitácora", icon: ArrowLeftRight, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
          ]
        }
      ]
    },
    {
      title: "CONFIGURACIÓN Y CATÁLOGOS",
      subsections: [
        {
          label: "Infraestructura",
          items: [
            { href: "/bodegas", label: "Bodegas y Ubicaciones", icon: Warehouse, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
            { href: "/destinos", label: "Destinos / Box / Servicios", icon: MapPin, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
          ]
        },
        {
          label: "Parámetros",
          items: [
            { href: "/proveedores", label: "Proveedores", icon: Users, roles: ["ADMIN", "CONTABLE"] },
            { href: "/unidades", label: "Unidades de Medida", icon: Tag, roles: ["ADMIN", "OPERADOR", "CONTABLE"] },
          ]
        }
      ]
    },
    {
      title: "SISTEMA",
      subsections: [
        {
          items: [
            { href: "/usuarios", label: "Gestión de Usuarios y Roles", icon: ShieldAlert, roles: ["ADMIN"] },
            { href: "/configuracion", label: "Configuración de Empresa", icon: Sliders, roles: ["ADMIN", "CONTABLE"] },
          ]
        }
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
      const popoverHeight = 240; // Altura estimada del popover de novedades
      const windowHeight = window.innerHeight;
      
      // Si el popover se saldría por abajo de la pantalla, alinearlo hacia arriba
      let calculatedTop = rect.top;
      if (calculatedTop + popoverHeight > windowHeight - 16) {
        calculatedTop = Math.max(16, windowHeight - popoverHeight - 16);
      }
      setNovedadesTop(calculatedTop);
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
        
        {/* Header / Brand with Notification Bell */}
        <div className="flex items-center justify-between px-2 pb-3 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-teal-50 border border-teal-100 dark:bg-[#0d1c3a] dark:border-[#1d3058] flex items-center justify-center p-1 shrink-0 shadow-xs">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate">
                Policlínico Tabancura
              </h1>
              <p className="text-[10px] font-black tracking-wider text-teal-600 dark:text-[#00e699] uppercase leading-tight">
                {user.role === 'CONSUMIDOR' ? 'SOLICITUDES' : 'CONTROL INVENTARIO'}
              </p>
            </div>
          </div>

          {/* Botón Campana Notificación */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              type="button"
              onClick={toggleNotifPopover}
              className={`relative p-2 rounded-xl transition-all cursor-pointer group ${
                isNotifOpen 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20" 
                  : "text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#132247]"
              }`}
              title="Notificaciones de solicitudes"
            >
              <Bell className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                pendientesCount > 0 ? "text-amber-500 animate-pulse" : ""
              }`} />
              {pendientesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-rose-500/40 animate-bounce ring-2 ring-white dark:ring-[#070e1e]">
                  {pendientesCount}
                </span>
              )}
            </button>
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
          {/* Direct Top Link: Panel de Control */}
          {directTopItem.roles.includes(user.role) && (
            <div className="space-y-1">
              <Link
                href={directTopItem.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-full transition-all duration-200 ease-out group active:scale-[0.97] ${
                  pathname === directTopItem.href
                    ? "bg-[#05b875] text-white shadow-lg shadow-[#05b875]/30 translate-x-1"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132247]/70 hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 ${
                    pathname === directTopItem.href
                      ? "text-white"
                      : "text-slate-400 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400"
                  }`} />
                  <span className={`truncate ${pathname === directTopItem.href ? "text-white font-bold" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                    {directTopItem.label}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Group Blocks */}
          {navGroups.map((group, gIdx) => {
            // Check if any item is visible for this user
            const hasVisibleItems = group.subsections.some(sub => 
              sub.items.some(item => item.roles.includes(user.role))
            );
            if (!hasVisibleItems) return null;

            return (
              <div key={gIdx} className="space-y-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/70">
                <p className="text-[9.5px] font-black tracking-widest text-slate-400/90 dark:text-slate-500 uppercase px-3 pt-0.5">
                  {group.title}
                </p>

                <div className="space-y-2.5">
                  {group.subsections.map((sub, sIdx) => {
                    const filteredSubItems = sub.items.filter(item => item.roles.includes(user.role));
                    if (filteredSubItems.length === 0) return null;

                    return (
                      <div key={sIdx} className="space-y-1">
                        {sub.label && (
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400/80 dark:text-slate-500 px-3.5 pt-0.5">
                            {sub.label}
                          </p>
                        )}

                        <nav className="space-y-1">
                          {filteredSubItems.map((item: any) => {
                            const currentFullUrl = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
                            const isActive = currentFullUrl === item.href || (pathname === item.href && !item.href.includes('?'));
                            const Icon = item.icon;

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-full transition-all duration-200 ease-out group active:scale-[0.97] ${
                                  isActive 
                                    ? "bg-[#05b875] text-white shadow-md shadow-[#05b875]/25 translate-x-1" 
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#132247]/70 hover:translate-x-1"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 ${
                                    isActive 
                                      ? "text-white" 
                                      : "text-slate-400 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400"
                                  }`} />
                                  <span className={`truncate ${isActive ? "text-white font-bold" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                                    {item.label}
                                  </span>
                                </div>

                                {item.href === "/solicitudes" && pendientesCount > 0 && (
                                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm shadow-amber-500/30 animate-pulse shrink-0">
                                    <Bell className="h-2.5 w-2.5 animate-bounce" />
                                    <span>{pendientesCount}</span>
                                  </span>
                                )}

                                {item.href === "/solicitar?tab=HISTORIAL" && pendientesCount > 0 && (
                                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm shadow-amber-500/30 animate-pulse shrink-0">
                                    <Bell className="h-2.5 w-2.5 animate-bounce" />
                                    <span>{pendientesCount} por recibir</span>
                                  </span>
                                )}

                                {item.badge && !isActive && (
                                  <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.badgeColor}`}>
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

                  {/* If SISTEMA, render NOVEDADES 2026 inside it */}
                  {group.title === "SISTEMA" && novedadesItems.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div 
                        ref={triggerRef}
                        onMouseEnter={handleMouseEnterTrigger}
                        onMouseLeave={handleMouseLeaveTrigger}
                        className={`relative flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none active:scale-[0.97] ${
                          isNovedadesActive
                            ? "bg-gradient-to-r from-[#05b875] to-[#04a065] text-white font-extrabold shadow-md shadow-[#05b875]/25 ring-1 ring-white/20 translate-x-1"
                            : novedadesHovered
                            ? "bg-slate-100 dark:bg-[#132247] text-teal-600 dark:text-teal-400 font-bold translate-x-1"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-[#132247]/70 hover:translate-x-1"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Sparkles className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                            isNovedadesActive ? "text-white" : "text-amber-500 animate-pulse group-hover:scale-110"
                          }`} />
                          <span className="truncate font-extrabold">Novedades 2026</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full transition-transform duration-200 ${
                            isNovedadesActive ? "bg-white text-emerald-800" : "bg-amber-500 text-white"
                          }`}>
                            4 APPS
                          </span>
                          <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                            novedadesHovered ? "translate-x-1 text-teal-500" : ""
                          }`} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          <div className="bg-white/95 dark:bg-[#0c1836]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/90 rounded-2xl p-2.5 shadow-2xl min-w-[255px] max-h-[calc(100vh-2rem)] overflow-y-auto space-y-1 border-l-4 border-l-teal-500 hide-scrollbar">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-1 sticky top-0 bg-white/90 dark:bg-[#0c1836]/90 backdrop-blur-sm z-10">
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

      {/* NOVEDADES EXPLANATORY TOOLTIP A LA DERECHA */}
      {novedadesHovered && hoveredNovedad && (
        <div 
          style={{ top: `${novedadesTop}px` }}
          onMouseEnter={handleMouseEnterPopover}
          onMouseLeave={handleMouseLeavePopover}
          className="fixed left-[550px] z-[999999] animate-in fade-in slide-in-from-left-2 duration-150 w-[300px] pointer-events-auto"
        >
          <div className="bg-white/95 dark:bg-[#081229]/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xl text-xs leading-relaxed font-semibold backdrop-blur-md space-y-2.5 border-l-4 border-l-teal-500">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black text-teal-600 dark:text-[#00e699] uppercase tracking-wider">
                FUTURO MÓDULO 2026
              </span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${hoveredNovedad.statusColor || 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                {hoveredNovedad.statusBadge || 'Pronto'}
              </span>
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                {hoveredNovedad.label}
              </h4>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
              {hoveredNovedad.description}
            </p>
          </div>
        </div>
      )}

      {/* FIXED POSITION NOTIFICATIONS POPOVER (HIGH Z-INDEX, IMMUNE TO SCROLL CLIPPING) */}
      {isNotifOpen && (
        <div 
          ref={notifPopoverRef}
          style={{ 
            top: `${notifCoords.top}px`, 
            left: `${notifCoords.left}px` 
          }}
          className="fixed z-[99999] w-80 sm:w-92 bg-white dark:bg-[#0b1329] border border-slate-200/90 dark:border-[#1d2d52] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-left select-text"
        >
          {/* Encabezado del Popover */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {user.role === 'CONSUMIDOR' ? 'Pedidos por Recepcionar' : 'Solicitudes Pendientes'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {pendientesCount > 0 
                    ? `${pendientesCount} ${pendientesCount === 1 ? 'requerimiento activo' : 'requerimientos activos'}`
                    : "Todo al día sin pendientes"}
                </p>
              </div>
            </div>
            {pendientesCount > 0 && (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {pendientesCount} PENDIENTE
              </span>
            )}
          </div>

          {/* Lista / Resumen de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 hide-scrollbar">
            {pendingItemsList.length > 0 ? (
              pendingItemsList.map((sol: any) => {
                const itemCount = sol.items?.length || 0;
                const itemsPreview = sol.items?.slice(0, 2).map((it: any) => 
                  `${it.cantidad || it.cantidadEnviada || 1}x ${it.product?.nombre || 'Insumo'}`
                ).join(', ');

                const formattedDate = sol.fecha 
                  ? new Date(sol.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div key={sol.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {sol.nombre}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-bold text-teal-600 dark:text-teal-400 truncate">
                            {sol.areaTrabajo || sol.centroCosto?.nombre || 'Clínica'}
                          </span>
                          {formattedDate && (
                            <>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-[#227262] dark:text-teal-300 shrink-0">
                        {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                      </span>
                    </div>

                    {itemsPreview && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl truncate font-medium">
                        📦 {itemsPreview}{itemCount > 2 ? ` y ${itemCount - 2} más...` : ''}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  ¡Todo al día!
                </p>
                <p className="text-[10px] text-slate-400">
                  No hay solicitudes pendientes que requieran gestión en este momento.
                </p>
              </div>
            )}
          </div>

          {/* Pie con botón de acceso directo */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href={user.role === 'CONSUMIDOR' ? "/solicitar?tab=HISTORIAL" : "/solicitudes"}
              onClick={() => setIsNotifOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-black text-white bg-[#227262] hover:bg-[#1a5a4d] rounded-xl shadow-md transition-all text-center"
            >
              <span>
                {user.role === 'CONSUMIDOR' 
                  ? 'Ver Mis Solicitudes' 
                  : 'Abrir Gestión de Solicitudes'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
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
