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
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#050914] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN IZQUIERDA: Formulario de Login (A la Izquierda) */}
      {/* ---------------------------------------------------- */}
      <div className="w-full md:w-[450px] lg:w-[490px] xl:w-[520px] flex flex-col justify-between p-6 sm:p-10 bg-slate-50/70 dark:bg-[#070e1c] border-r border-slate-200/80 dark:border-slate-800/80 relative z-20">

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
          <div className="bg-white dark:bg-[#0d162a] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-black/70 space-y-6">

            {/* Header */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center mx-auto shadow-xs p-2.5 transition-transform hover:scale-105 duration-200">
                <img src="/logo.svg" alt="Tabancura Logo" className="h-11 w-auto object-contain" />
              </div>
              <div className="space-y-1">
                <span className="text-[10.5px] font-black tracking-widest text-[#227262] dark:text-[#31c4a4] uppercase block">
                  POLICLÍNICO TABANCURA
                </span>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Control de Inventario
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">

              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:outline-none focus:border-[#227262] dark:focus:border-[#31c4a4] focus:ring-2 focus:ring-[#227262]/20 dark:focus:ring-[#31c4a4]/20 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:outline-none focus:border-[#227262] dark:focus:border-[#31c4a4] focus:ring-2 focus:ring-[#227262]/20 dark:focus:ring-[#31c4a4]/20 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-xs font-black text-white bg-[#227262] hover:bg-[#1a5b4e] active:scale-[0.98] disabled:opacity-50 rounded-xl transition-all shadow-md shadow-[#227262]/20 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>{loading ? "Verificando credenciales..." : "Ingresar al Sistema"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Support Link & Security Badge */}
            <div className="pt-3 space-y-3 text-center border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ¿Necesitas acceso o restablecer credenciales?{" "}
                <a
                  href="mailto:soporte@policlinicotabancura.cl"
                  className="text-[#227262] dark:text-[#31c4a4] hover:underline font-bold transition-colors"
                >
                  Contactar Soporte
                </a>
              </p>

              <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60 px-3.5 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
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
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-teal-400 font-extrabold shadow-lg shadow-teal-950/40 backdrop-blur-md">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-widest text-[#31c4a4] uppercase block">
                POLICLÍNICO TABANCURA
              </span>
              <p className="text-xs text-slate-400 font-medium">Gestión de Inventario y Control de Insumos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-teal-300 bg-teal-950/60 border border-teal-800/50 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="tracking-wide">Inventario Activo en Tiempo Real</span>
          </div>
        </div>

        {/* CONTENEDOR CENTRAL: ILUSTRACIÓN SVG CON EQUIPO DE TRABAJO (3 PERSONAS) */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 select-none w-full max-w-xl mx-auto gap-6">

          {/* Título & Subtítulo centrado en inventario e insumos médicos */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Control & Trazabilidad de Insumos
            </h2>
            <p className="text-xs lg:text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              Coordinación fluida entre bodega, boxes clínicos y administración para el registro y consumo de materiales.
            </p>
          </div>

          {/* TARJETA CON LA ILUSTRACIÓN SVG */}
          <div className="relative w-full rounded-3xl p-6 lg:p-8 bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col items-center">

            {/* Destellos de iluminación suave de fondo */}
            <div className="absolute -top-10 left-1/4 w-44 h-44 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 right-1/4 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

            <style>{`
              @keyframes floatGentlePerson {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
              }
              @keyframes pulseLine {
                0%, 100% { stroke-opacity: 0.3; stroke-dashoffset: 0; }
                50% { stroke-opacity: 0.9; stroke-dashoffset: 14; }
              }
              @keyframes badgePop {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              .anim-person-1 {
                animation: floatGentlePerson 4s ease-in-out infinite;
              }
              .anim-person-2 {
                animation: floatGentlePerson 4.5s ease-in-out infinite 0.8s;
              }
              .anim-person-3 {
                animation: floatGentlePerson 4.2s ease-in-out infinite 1.6s;
              }
              .anim-flow-line {
                animation: pulseLine 2.8s linear infinite;
              }
              .anim-check-badge {
                animation: badgePop 3s ease-in-out infinite;
                transform-origin: 260px 45px;
              }
            `}</style>

            <svg viewBox="0 0 520 270" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[480px]">
              <defs>
                <linearGradient id="tableGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="lapTeal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="lapSky" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="bubbleBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>

              {/* LÍNEA DE FLUJO Y COMUNICACIÓN ENTRE LOS TRES (Arco punteado con movimiento) */}
              <path
                d="M 50 175 C 65 95, 130 95, 145 175 C 165 205, 240 70, 260 70 C 280 70, 355 205, 375 175 C 390 95, 455 95, 470 175"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="5 5"
                fill="none"
                className="anim-flow-line"
              />

              {/* BADGE CENTRAL FLOTANTE (Notificación de solicitud confirmada) */}
              <g className="anim-check-badge">
                <rect x="232" y="32" width="56" height="26" rx="13" fill="url(#bubbleBlue)" stroke="#60a5fa" strokeWidth="1.2" />
                {/* Check icon */}
                <path d="M 246 45 L 252 50 L 264 40" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Punto verde de status */}
                <circle cx="274" cy="45" r="3" fill="#22c55e" />
              </g>

              {/* ---------------- PERSONA 1 (Izquierda: Encargado de Bodega con chaleco/camisa teal) ---------------- */}
              <g className="anim-person-1">
                {/* Cabello corto oscuro */}
                <path d="M 94 96 C 94 82, 118 78, 128 86 C 134 92, 132 102, 128 106 C 122 104, 114 96, 98 104 Z" fill="#0f172a" />

                {/* Rostro */}
                <path d="M 102 96 C 102 88, 122 88, 126 96 C 130 106, 126 120, 116 124 C 106 122, 102 110, 102 96 Z" fill="#fed7aa" />

                {/* Cuello */}
                <rect x="110" y="122" width="8" height="8" fill="#fdba74" />

                {/* Expresión facial */}
                <path d="M 106 104 Q 109 107 112 104" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <path d="M 106 112 Q 110 115 115 112" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" fill="none" />

                {/* Torso: Camisa / Vestimenta de Bodega Teal */}
                <path d="M 82 130 C 100 126, 130 126, 146 130 C 160 144, 168 164, 164 192 L 64 192 C 60 164, 68 144, 82 130 Z" fill="#0d9488" />

                {/* Brazo operando laptop */}
                <path d="M 140 148 C 132 166, 104 182, 82 186" stroke="#0d9488" strokeWidth="7" strokeLinecap="round" fill="none" />
              </g>

              {/* Laptop Persona 1 */}
              <g>
                <path d="M 124 192 L 138 142 L 182 142 L 174 192 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.4" />
                <path d="M 130 187 L 142 147 L 177 147 L 169 187 Z" fill="url(#lapTeal)" />
                <polygon points="116,192 188,192 182,197 110,197" fill="#475569" />
              </g>

              {/* ---------------- PERSONA 2 (Centro: Profesional Clínico con uniforme/bata médica) ---------------- */}
              <g className="anim-person-2">
                {/* Cabello estilizado recogido / corto castaño */}
                <path d="M 242 82 C 242 68, 272 68, 276 82 C 282 90, 280 102, 274 104 C 268 98, 258 92, 244 100 Z" fill="#334155" />

                {/* Rostro */}
                <path d="M 248 84 C 248 76, 270 76, 274 84 C 278 94, 274 108, 262 112 C 250 110, 246 98, 248 84 Z" fill="#fecdd3" />

                {/* Cuello */}
                <rect x="257" y="110" width="8" height="8" fill="#fda4af" />

                {/* Sonrisa & Ojos */}
                <path d="M 252 92 Q 255 95 258 92" stroke="#881337" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <path d="M 253 100 Q 257 103 262 100" stroke="#881337" strokeWidth="1.4" strokeLinecap="round" fill="none" />

                {/* Torso: Casaca Médica Blanca con detalles celestes */}
                <path d="M 226 118 C 244 114, 274 114, 292 118 C 304 132, 312 154, 308 192 L 210 192 C 206 154, 214 132, 226 118 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

                {/* Cuello en V celeste */}
                <polygon points="252,118 268,118 260,132" fill="#0ea5e9" />

                {/* Tablet / Carpeta de Registro de Insumos que sostiene en sus manos */}
                <rect x="242" y="140" width="36" height="46" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="248" y="148" width="24" height="4" rx="1" fill="#ffffff" />
                <rect x="248" y="156" width="20" height="3" rx="1" fill="#bae6fd" />
                <rect x="248" y="163" width="16" height="3" rx="1" fill="#bae6fd" />
                <circle cx="260" cy="176" r="3" fill="#ffffff" />

                {/* Manos sosteniendo la tablet */}
                <ellipse cx="238" cy="164" rx="4" ry="6" fill="#fecdd3" />
                <ellipse cx="282" cy="164" rx="4" ry="6" fill="#fecdd3" />
              </g>

              {/* ---------------- PERSONA 3 (Derecha: Administrador / Coordinador con camisa púrpura/azul) ---------------- */}
              <g className="anim-person-3">
                {/* Cabello oscuro */}
                <path d="M 390 96 C 390 82, 414 78, 424 86 C 430 92, 428 102, 424 106 C 418 104, 410 96, 394 104 Z" fill="#0f172a" />

                {/* Rostro */}
                <path d="M 398 96 C 398 88, 418 88, 422 96 C 426 106, 422 120, 412 124 C 402 122, 398 110, 398 96 Z" fill="#fed7aa" />

                {/* Cuello */}
                <rect x="406" y="122" width="8" height="8" fill="#fdba74" />

                {/* Ojos & Sonrisa */}
                <path d="M 402 104 Q 405 107 408 104" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <path d="M 403 112 Q 407 115 412 112" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" fill="none" />

                {/* Torso: Polera / Camisa Violeta / Indigo */}
                <path d="M 378 130 C 396 126, 426 126, 442 130 C 456 144, 464 164, 460 192 L 360 192 C 356 164, 364 144, 378 130 Z" fill="#6366f1" />

                {/* Brazo en teclado de laptop */}
                <path d="M 436 148 C 428 166, 398 182, 376 186" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" fill="none" />
              </g>

              {/* Laptop Persona 3 */}
              <g>
                <path d="M 336 192 L 350 142 L 394 142 L 386 192 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.4" />
                <path d="M 342 187 L 354 147 L 389 147 L 381 187 Z" fill="url(#lapSky)" />
                <polygon points="328,192 400,192 394,197 322,197" fill="#475569" />
              </g>

              {/* ---------------- MESA DE TRABAJO COMPARTIDA (Base) ---------------- */}
              <rect x="35" y="192" width="450" height="10" rx="5" fill="url(#tableGrad)" />
              <rect x="42" y="200" width="436" height="3" rx="1.5" fill="#0f172a" fillOpacity="0.6" />
            </svg>

          </div>

          {/* INDICADORES CLAVE SIMPLIFICADOS (3 Puntos directos y coherentes con inventario) */}
          <div className="w-full grid grid-cols-3 gap-3">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1 hover:border-teal-700/50 transition-colors">
              <div className="text-sm lg:text-base font-extrabold text-teal-400 font-mono">Bodega Central</div>
              <div className="text-[10px] text-slate-400 font-medium">Recepción & Lotes</div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1 hover:border-sky-700/50 transition-colors">
              <div className="text-sm lg:text-base font-extrabold text-sky-400 font-mono">Boxes Clínicos</div>
              <div className="text-[10px] text-slate-400 font-medium">Solicitudes de Insumos</div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 text-center space-y-1 hover:border-indigo-700/50 transition-colors">
              <div className="text-sm lg:text-base font-extrabold text-indigo-400 font-mono">Centros de Costo</div>
              <div className="text-[10px] text-slate-400 font-medium">Despacho & Consumo</div>
            </div>
          </div>

        </div>

        {/* Footer info right */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
          <span>Policlínico Tabancura • Sistema de Inventario v3.0</span>
          <span className="text-[#31c4a4] font-bold">Base de Datos Lista para Estreno</span>
        </div>
      </div>

    </div>
  );
}
