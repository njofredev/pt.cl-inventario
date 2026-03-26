"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../_lib/api_service_client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log(`[Login] Intentando conexión a: ${API_BASE_URL}/login`);
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch(e) {
          throw new Error('Error al conectar con el servidor (Respuesta no válida)');
        }
        throw new Error(errorData.detail || 'Credenciales inválidas');
      }

      const data = await response.json();
      login(data.access_token, data.user);
    } catch (err: any) {
      console.error('[Login Error]', err);
      // Mensaje amigable para el error de red
      if (err.message === 'Failed to fetch') {
        setError('Error de conexión: No se pudo contactar con el servidor. Verifica tu conexión o el estado de la API.');
      } else {
        setError(err.message || 'Error al conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
           {/* Branding oficial de la sidebar */}
           <div className="flex flex-col items-center gap-4 mb-8">
             <div className="w-20 h-20 glass-panel flex items-center justify-center p-1 bg-white/5 border-white/10 shadow-xl rounded-2xl">
               <img
                 src="/polilogo_color_svg.svg"
                 alt="Logo Policlínico"
                 className="w-16 h-16 object-contain"
               />
             </div>
             <div className="flex flex-col items-center">
               <h1 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
                 Policlínico Tabancura
               </h1>
               <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                 <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">
                   /INVENTARIOS
                 </p>
               </div>
             </div>
           </div>
           
           <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Inventario</h2>
           <p className="text-gray-500 mt-2 text-sm italic italic opacity-70">Inicia sesión con tu cuenta institucional</p>
        </div>

        <div className="glass-panel p-8 shadow-2xl relative border-white/10 bg-[#161b22]/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuario</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#0d1117] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium"
                  placeholder="ej: njofre"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#0d1117] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 shadow-xl shadow-primary/10"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] opacity-50">Administración de Activos Institucionales</p>
          </div>
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-12 opacity-50">
          © {new Date().getFullYear()} Policlínico Tabancura. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}
