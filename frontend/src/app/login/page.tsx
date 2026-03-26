"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Search, LogIn, AlertCircle } from 'lucide-react';
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
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Credenciales inválidas');
      }

      const data = await response.json();
      login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
           <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-primary tracking-tight">POLICLÍNICO TABANCURA</span>
           </div>
           <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Inventario</h1>
           <p className="text-gray-500 mt-2 text-sm italic">Inicia sesión con tu cuenta institucional</p>
        </div>

        <div className="glass-panel p-8 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm"
              >
                <AlertCircle className="w-4 h-4" />
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
                  className="block w-full pl-10 pr-3 py-3 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary transition-all"
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
                  className="block w-full pl-10 pr-3 py-3 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
             <p className="text-[10px] text-gray-600 uppercase font-bold tracking-[2px]">Administración de Activos Institucionales</p>
          </div>
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-8">
          © {new Date().getFullYear()} Policlínico Tabancura. Todos los derechos reservados.
        </p>
      </motion.div>
    </div>
  );
}
