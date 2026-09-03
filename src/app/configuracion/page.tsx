import { getConfiguracionEmpresa } from "@/lib/empresaConfig";
import ConfiguracionEmpresaClient from "./ConfiguracionEmpresaClient";
import { Sliders } from "lucide-react";

export const revalidate = 0;

export default async function ConfiguracionPage() {
  const config = await getConfiguracionEmpresa();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
            <Sliders className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Configuración de Empresa
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Ajustes globales del sistema, datos institucionales y criterios de valorización contable del inventario.
        </p>
      </div>

      <ConfiguracionEmpresaClient initialConfig={config} />
    </div>
  );
}
