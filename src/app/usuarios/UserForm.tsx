'use client'

import { useState } from "react";
import { createUserAction } from "./actions";
import { UserPlus } from "lucide-react";

export default function UserForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password || !nombre || !role) {
      setStatus({ success: false, message: "Todos los campos son obligatorios." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("nombre", nombre);
    formData.append("role", role);

    const res = await createUserAction(formData);
    setLoading(false);

    if (res.success) {
      setStatus({ success: true, message: "Usuario creado exitosamente." });
      setUsername("");
      setPassword("");
      setNombre("");
      setRole("USER");
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Name */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre Completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. F. Urbina..."
          required
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
      </div>

      {/* Username */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre de Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ej. furbina..."
          required
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresar contraseña..."
          required
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
      </div>

      {/* Role */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rol / Permisos</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        >
          <option value="USER" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Auxiliar (Lectura y Movimientos)</option>
          <option value="ADMIN" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Administrador (Control total y Usuarios)</option>
        </select>
      </div>

      {/* Status Feedback */}
      {status && (
        <div className={`p-3 rounded-xl text-xs font-semibold border ${
          status.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {status.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-xs font-extrabold text-white bg-[#162158] hover:bg-[#0f173d] dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 rounded-xl transition-all active-scale-down shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
      >
        <UserPlus className="h-4 w-4" />
        {loading ? "Creando..." : "Crear Usuario"}
      </button>
    </form>
  );
}
