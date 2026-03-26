"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Menu, X, ChevronRight, Search, Sun, Moon, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsDropdown from "../components/layout/NotificationsDropdown";
import CommandPalette from "../components/ui/CommandPalette";
import { AuthProvider, useAuth } from "../context/AuthContext";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.className = theme;
    }
  }, [theme, mounted]);

  // Proteger rutas
  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      window.location.href = "/login";
    }
  }, [user, loading, isLoginPage]);

  if (!mounted || (loading && !isLoginPage)) return <div className="min-h-dvh bg-background" />;

  if (isLoginPage) return <div className={theme}>{children}</div>;

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const pathSegments = pathname.split("/").filter(Boolean);
  const formatSegment = (s: string) => s.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className={`flex h-dvh overflow-hidden ${theme} bg-background text-foreground transition-colors duration-300`}>
      <Sidebar />
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="w-64 h-dvh bg-background border-r border-border relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 z-50 p-2 bg-background/80 backdrop-blur rounded-full border border-border md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div className="h-full" onClick={() => setIsMobileMenuOpen(false)}>
                 <Sidebar isMobile={true} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-dvh bg-background overflow-hidden relative" style={{ backgroundColor: 'var(--main-bg)' }}>
        <header className="h-16 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm" style={{ backgroundColor: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-4">
            <button className="p-2.5 hover:bg-white/5 rounded-xl md:hidden border border-border/50" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-500 hover:text-gray-300 cursor-pointer">Inicio</span>
              {pathSegments.length > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
              {pathSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={i === pathSegments.length - 1 ? "text-primary font-bold" : "text-gray-500"}>{formatSegment(seg)}</span>
                  {i < pathSegments.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                </div>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="p-2 text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-lg transition hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <NotificationsDropdown />
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-border/50 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Hola,</span>
              <span className="text-sm font-bold text-foreground">{user?.nombre_completo || user?.username || 'Invitado'}</span>
              <button 
                onClick={logout}
                className="ml-2 p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg transition-colors border border-transparent hover:border-danger/20"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 flex-1 overflow-y-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.className} bg-background antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
