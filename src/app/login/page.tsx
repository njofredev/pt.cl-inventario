'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { KeyRound, User, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon, Boxes, Warehouse, ClipboardCheck, ShoppingBag, FileBarChart } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === null ? true : savedTheme === "dark";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const res = await loginAction(formData);

    if (res?.success) {
      if (res.role === 'CONSUMIDOR') {
        router.push("/solicitar");
      } else {
        router.push("/");
      }
      router.refresh();
    } else {
      setLoading(false);
      setError(res?.error || "Error al iniciar sesión.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#070C18] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* SECCIÓN IZQUIERDA: Formulario de Login (A la Izquierda) */}
      {/* ---------------------------------------------------- */}
      <div className="w-full md:w-[440px] lg:w-[480px] xl:w-[520px] flex flex-col justify-between p-6 sm:p-10 bg-slate-50 dark:bg-[#0B1326] border-r border-slate-200 dark:border-slate-800/80 relative z-20">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-end">
          <button 
            type="button"
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800/90 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
        </div>

        {/* Center Card Panel */}
        <div className="my-auto py-6">
          <div className="bg-white dark:bg-[#101A33] border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-xl dark:shadow-2xl dark:shadow-black/80 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-teal-500/40 flex items-center justify-center mx-auto shadow-inner p-2">
                <img src="/logo.svg" alt="Tabancura Logo" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-teal-600 dark:text-teal-400 uppercase">
                  POLICLÍNICO TABANCURA
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Control de Inventario
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. admin"
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-200 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-xs font-extrabold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 rounded-xl transition-all active-scale-down shadow-lg shadow-teal-500/20 dark:shadow-teal-950/60 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{loading ? "Verificando..." : "Ingresar al Sistema"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Support Link & Security Badge */}
            <div className="pt-4 space-y-3 text-center border-t border-slate-200 dark:border-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ¿Necesitas acceso o restablecer credenciales?{" "}
                <a 
                  href="mailto:soporte@policlinicotabancura.cl" 
                  className="text-teal-600 dark:text-teal-400 hover:text-teal-500 font-bold underline transition-colors"
                >
                  Contactar Soporte
                </a>
              </p>

              <div className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3.5 py-1 rounded-full shadow-inner">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Conexión Segura TLS 1.3</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-500 font-medium">
            Acceso privado restringido a personal autorizado. © Policlínico Tabancura
          </p>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN DERECHA: Flujo de Inventario Animado         */}
      {/* ---------------------------------------------------- */}
      <div className="relative flex-1 hidden md:flex flex-col justify-between p-8 lg:p-12 bg-gradient-to-br from-[#0A1324] via-[#070C18] to-[#040710] overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Top Right */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 font-extrabold shadow-lg shadow-teal-950/50">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-teal-400 uppercase">
                POLICLÍNICO TABANCURA
              </span>
              <p className="text-xs text-slate-400 font-medium">Control Interno de Existencias & Flujo Clínico</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-bold text-teal-300 bg-teal-950/60 border border-teal-800/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>Telemetría de Stock Activa</span>
          </div>
        </div>

        {/* Interactive Inventory Cycle Diagram */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-6">
          <div className="relative w-full max-w-2xl h-[420px] flex items-center justify-center">
            
            {/* SVG Animated Flow Paths */}
            <svg className="absolute inset-0 w-full h-full stroke-slate-700/50 fill-none" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet">
              
              <defs>
                <linearGradient id="flowTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="flowEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
                </linearGradient>
                
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Curves */}
              <path id="path1" d="M 150 90 C 210 130, 240 170, 300 210" stroke="url(#flowTeal)" strokeWidth="2" strokeDasharray="6 4" />
              <path id="path2" d="M 300 210 C 240 250, 210 290, 150 330" stroke="url(#flowEmerald)" strokeWidth="2" strokeDasharray="6 4" />
              <path id="path3" d="M 450 90 C 390 130, 360 170, 300 210" stroke="url(#flowTeal)" strokeWidth="2" strokeDasharray="6 4" />
              <path id="path4" d="M 300 210 C 360 250, 390 290, 450 330" stroke="url(#flowEmerald)" strokeWidth="2" strokeDasharray="6 4" />

              {/* Animated Moving Particles */}
              <circle r="4" fill="#2dd4bf" filter="url(#glow)">
                <animateMotion path="M 150 90 C 210 130, 240 170, 300 210" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#34d399" filter="url(#glow)">
                <animateMotion path="M 300 210 C 240 250, 210 290, 150 330" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#38bdf8" filter="url(#glow)">
                <animateMotion path="M 450 90 C 390 130, 360 170, 300 210" dur="2.8s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#2dd4bf" filter="url(#glow)">
                <animateMotion path="M 300 210 C 360 250, 390 290, 450 330" dur="3.2s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* NODO CENTRAL: HUB DE INVENTARIO */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group">
              <div className="relative w-28 h-28 rounded-full bg-[#0C172C] border-2 border-teal-400/90 flex items-center justify-center p-3 shadow-[0_0_40px_rgba(20,184,166,0.35)] transition-all group-hover:scale-105">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-2.5 shadow-md">
                  <img src="/logo.svg" alt="Tabancura Logo" className="h-12 w-auto object-contain" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
                </span>
              </div>
              <div className="mt-3 text-center bg-[#091122]/90 border border-teal-500/30 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                <p className="text-[11px] font-extrabold text-teal-300 tracking-wider uppercase">POLICLÍNICO TABANCURA</p>
                <p className="text-[9px] text-slate-400 font-semibold">Núcleo Central de Existencias</p>
              </div>
            </div>

            {/* NODO 1: TOP-LEFT - BODEGAS & STOCK */}
            <div className="absolute top-2 left-0 z-20 flex items-center gap-3 bg-[#0D1932]/95 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-xl hover:border-teal-500/50 transition-all">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-400/40 flex items-center justify-center text-teal-400 shrink-0">
                <Warehouse className="h-4 w-4" />
              </div>
              <div className="text-left whitespace-nowrap">
                <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider">Bodegas & Stock</p>
                <p className="text-[9px] text-teal-400 font-semibold leading-tight mt-0.5">Control de Ubicaciones Físicas</p>
              </div>
            </div>

            {/* NODO 2: BOTTOM-LEFT - SOLICITUDES CLÍNICAS */}
            <div className="absolute bottom-2 left-0 z-20 flex items-center gap-3 bg-[#0D1932]/95 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div className="text-left whitespace-nowrap">
                <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider">Solicitudes Clínicas</p>
                <p className="text-[9px] text-emerald-400 font-semibold leading-tight mt-0.5">Despacho & Pedidos en Línea</p>
              </div>
            </div>

            {/* NODO 3: TOP-RIGHT - COMPRAS & COTIZACIÓN */}
            <div className="absolute top-2 right-0 z-20 flex items-center gap-3 bg-[#0D1932]/95 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="text-left whitespace-nowrap">
                <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider">Compras & Cotización</p>
                <p className="text-[9px] text-blue-400 font-semibold leading-tight mt-0.5">Cuadros Comparativos</p>
              </div>
            </div>

            {/* NODO 4: BOTTOM-RIGHT - REGISTRO CONTABLE */}
            <div className="absolute bottom-2 right-0 z-20 flex items-center gap-3 bg-[#0D1932]/95 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-xl hover:border-teal-500/50 transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-400 shrink-0">
                <FileBarChart className="h-4 w-4" />
              </div>
              <div className="text-left whitespace-nowrap">
                <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider">Registro Contable</p>
                <p className="text-[9px] text-purple-400 font-semibold leading-tight mt-0.5">Cuentas 1.1.05 & Valor PPP</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info right */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>Policlínico Tabancura • Control de Inventario v3.0</span>
          <span className="text-teal-500 font-bold">Mapeo Contable Activo</span>
        </div>
      </div>

    </div>
  );
}
