import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Package, Users, ArrowLeftRight, ShieldAlert, ClipboardList, LogOut } from "lucide-react";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { logoutAction } from "./login/actions";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Inventario - Policlínico Tabancura",
  description: "Sistema de gestión de inventario con estética premium y micro-interacciones.",
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
            <header className="md:hidden flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Tabancura Logo" className="h-8 w-auto text-[#227262]" />
                <span className="text-lg font-bold text-slate-800">P. Tabancura</span>
              </div>
              <div className="flex space-x-1 items-center">
                <Link href="/" className="p-2 rounded-lg hover:bg-slate-50"><LayoutDashboard className="h-5 w-5 text-slate-600" /></Link>
                <Link href="/productos" className="p-2 rounded-lg hover:bg-slate-50"><Package className="h-5 w-5 text-slate-600" /></Link>
                {(user.role === 'ADMIN' || user.role === 'CONTABLE') && (
                  <Link href="/proveedores" className="p-2 rounded-lg hover:bg-slate-50"><Users className="h-5 w-5 text-slate-600" /></Link>
                )}
                <Link href="/movimientos" className="p-2 rounded-lg hover:bg-slate-50"><ArrowLeftRight className="h-5 w-5 text-slate-600" /></Link>
                {(user.role === 'ADMIN' || user.role === 'OPERADOR') && (
                  <Link href="/solicitudes" className="p-2 rounded-lg hover:bg-slate-50"><ClipboardList className="h-5 w-5 text-slate-600" /></Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link href="/usuarios" className="p-2 rounded-lg hover:bg-slate-50"><ShieldAlert className="h-5 w-5 text-slate-600" /></Link>
                )}
                <form action={logoutAction} className="m-0 p-0 flex">
                  <button type="submit" className="p-2 rounded-lg hover:bg-red-50"><LogOut className="h-5 w-5 text-red-500" /></button>
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
