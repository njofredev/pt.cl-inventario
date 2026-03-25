"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Menu, X, ChevronRight, Bell, Search, User, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Lógica simple de Breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const formatSegment = (s: string) => s.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <html lang="es" className={mounted ? theme : "dark"} suppressHydrationWarning>
      <body className={`${manrope.className} flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300`}>
        <Sidebar />
        
        {/* Mobile Menu Overlay */}
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
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-64 h-full bg-background border-r border-border"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 flex justify-between items-center border-b border-border">
                  <span className="font-bold text-foreground">Menú</span>
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                {/* Re-using Sidebar component logic or just actual sidebar with a mobile flag if needed */}
                <div className="h-full overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
                   <Sidebar isMobile={true} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col h-full bg-background overflow-hidden relative" style={{ backgroundColor: 'var(--main-bg)' }}>
          {/* Header Superior Rediseñado */}
          <header className="h-16 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm" style={{ backgroundColor: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-4">
              <button 
                className="p-2.5 hover:bg-white/5 rounded-xl md:hidden border border-border/50 transition-all active:scale-95"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>
              
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm font-medium">
                <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition">Inicio</span>
                {pathSegments.length > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                {pathSegments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={i === pathSegments.length - 1 ? "text-primary font-bold" : "text-gray-500"}>
                      {formatSegment(seg)}
                    </span>
                    {i < pathSegments.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-lg transition hidden sm:block">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-foreground hover:bg-foreground/5 rounded-lg transition relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="h-8 w-px bg-border/50 mx-2 hidden sm:block"></div>
              
              <div className="flex items-center gap-3 pl-2 group cursor-pointer text-xs">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-foreground group-hover:text-primary transition">Admin Policlínico Tabancura</p>
                  <p className="text-[10px] text-gray-500">Super Administrador</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-lg group-hover:border-primary/40 transition-all">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>
          
          <div className="p-4 md:p-8 flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
