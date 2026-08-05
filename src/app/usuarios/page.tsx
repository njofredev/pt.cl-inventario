import { prisma } from "@/lib/prisma";
import UserForm from "./UserForm";
import { UserCog, ShieldCheck, User } from "lucide-react";

export const revalidate = 0;

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: {
      nombre: "asc",
    },
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Gestión de Usuarios
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Crea y administra cuentas con accesos específicos para el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Creation Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <UserCog className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Nuevo Usuario
          </h2>
          <UserForm />
        </div>

        {/* User List Table Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
            Usuarios Registrados
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 pl-5">Nombre</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3 text-right pr-5">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 pl-5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center">
                        {user.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      {user.nombre}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono font-medium">{user.username}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? (
                          <>
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" /> Auxiliar
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-5 text-slate-400 font-medium text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
