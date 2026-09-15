import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Package, Users, ArrowLeftRight, ShieldAlert, ClipboardList, LogOut, Search, FolderTree } from "lucide-react";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "./login/actions";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Inventario - Policlínico Tabancura",
  description: "Sistema de gestión de inventario con estética premium y micro-interacciones.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const user = session ? await verifyJWT(session) : null;

  // If no user (e.g., in /login or /solicitar), render plain layout without sidebar
  if (!user) {
    return (
      <html lang="es" className="h-full">
        <body className="h-full bg-[var(--background)] text-foreground">
          <main className="h-full">{children}</main>
        </body>
      </html>
    );
  }

  // Consultar solicitudes pendientes o despachadas según rol para el indicador móvil
  const pendientesCount = (user.role === 'ADMIN' || user.role === 'OPERADOR')
    ? await prisma.solicitud.count({ where: { estado: "PENDIENTE" } })
    : (user.role === 'CONSUMIDOR')
      ? await prisma.solicitud.count({ where: { nombre: user.nombre, estado: "DESPACHADA" } })
      : 0;

  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-[var(--background)] text-foreground transition-colors duration-300">
        <div className="flex min-h-full">
          {/* Sidebar wrapped in Suspense for useSearchParams */}
          <Suspense fallback={null}>
            <Sidebar user={user} logoutAction={logoutAction} />
          </Suspense>

          {/* Main content wrapper */}
          <div className="flex flex-col flex-1 md:pl-[295px]">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Tabancura Logo" className="h-8 w-auto text-[#227262]" />
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">P. Tabancura</span>
              </div>
              <div className="flex space-x-1 items-center">
                {user.role === 'CONSUMIDOR' ? (
                  <>
                    <Link href="/solicitar?tab=BUSCADOR" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Búsqueda Rápida">
                      <Search className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Link>
                    <Link href="/solicitar?tab=CATALOGO" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Por Categorías">
                      <FolderTree className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Link>
                    <Link href="/solicitar?tab=HISTORIAL" className="relative p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Mis Solicitudes">
                      <ClipboardList className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      {pendientesCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shadow-xs">
                          {pendientesCount}
                        </span>
                      )}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Panel de Control"><LayoutDashboard className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Link>
                    <Link href="/productos" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Catálogo"><Package className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Link>
                    {(user.role === 'ADMIN' || user.role === 'CONTABLE') && (
                      <Link href="/proveedores" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Proveedores"><Users className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Link>
                    )}
                    <Link href="/movimientos" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Movimientos"><ArrowLeftRight className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Link>
                    {(user.role === 'ADMIN' || user.role === 'OPERADOR') && (
                      <Link href="/solicitudes" className="relative p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Solicitudes">
                        <ClipboardList className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        {pendientesCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs">
                            {pendientesCount}
                          </span>
                        )}
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/usuarios" className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" title="Usuarios"><ShieldAlert className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Link>
                    )}
                  </>
                )}
                <form action={logoutAction} className="m-0 p-0 flex">
                  <button type="submit" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer" title="Cerrar Sesión">
                    <LogOut className="h-5 w-5 text-red-500" />
                  </button>
                </form>
              </div>
            </header>

            {/* Main view container */}
            <main className="flex-1 p-4 md:p-6 max-w-[1700px] mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
