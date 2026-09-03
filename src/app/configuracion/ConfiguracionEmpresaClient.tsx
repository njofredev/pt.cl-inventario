'use client';

import { useState } from 'react';
import { EmpresaConfig } from '@/lib/empresaConfig';
import { saveEmpresaConfigAction } from './actions';
import { 
  Building2, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ReceiptText, 
  ShieldCheck, 
  Sparkles,
  Save,
  Info
} from 'lucide-react';

interface Props {
  initialConfig: EmpresaConfig;
}

export default function ConfiguracionEmpresaClient({ initialConfig }: Props) {
  const [nombreEmpresa, setNombreEmpresa] = useState(initialConfig.nombreEmpresa);
  const [rutEmpresa, setRutEmpresa] = useState(initialConfig.rutEmpresa);
  const [pppIncluyeIva, setPppIncluyeIva] = useState<boolean>(initialConfig.pppIncluyeIva);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('nombreEmpresa', nombreEmpresa);
    formData.append('rutEmpresa', rutEmpresa);
    formData.append('pppIncluyeIva', pppIncluyeIva ? 'true' : 'false');

    const res = await saveEmpresaConfigAction(formData);
    setLoading(false);

    if (res.success) {
      setStatus({ success: true, message: res.message || 'Configuración guardada exitosamente.' });
    } else {
      setStatus({ success: false, message: res.error || 'Error al guardar.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Tarjeta 1: Parámetro Central PPP (Precio Promedio Ponderado) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Cálculo del Precio Promedio Ponderado (PPP)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define si la valorización de inventario y el costo unitario de salida incorporan o no el impuesto al valor agregado (IVA).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 shrink-0">
            Contable
          </span>
        </div>

        {/* Sección Específica Solicitada */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              El PPP total calculado considera o no considera el IVA:
            </h3>
          </div>

          {/* Opciones Interactivas Tipo Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción 1: SIN IVA (Valor Neto) */}
            <div
              onClick={() => setPppIncluyeIva(false)}
              className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between space-y-3 ${
                !pppIncluyeIva
                  ? 'border-[#227262] bg-[#227262]/5 dark:bg-[#227262]/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      NO considera el IVA (Valor Neto)
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    El inventario se valoriza estrictamente al <strong>costo neto de compra</strong>. El IVA crédito fiscal se descuenta contablemente y no altera el costo real del material.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  !pppIncluyeIva ? 'border-[#227262] bg-[#227262] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {!pppIncluyeIva && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                Ej: Factura $1.190 IVA inc. → Costo en PPP: <strong>$1.000</strong>
              </div>
            </div>

            {/* Opción 2: CON IVA (Valor Bruto) */}
            <div
              onClick={() => setPppIncluyeIva(true)}
              className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between space-y-3 ${
                pppIncluyeIva
                  ? 'border-[#227262] bg-[#227262]/5 dark:bg-[#227262]/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      SÍ considera el IVA (Valor Bruto)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    El cálculo del PPP acumula el <strong>total final pagado al proveedor (incluyendo el 19% de IVA)</strong> como parte del costo unitario del insumo en bodega.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  pppIncluyeIva ? 'border-[#227262] bg-[#227262] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {pppIncluyeIva && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                Ej: Factura $1.190 IVA inc. → Costo en PPP: <strong>$1.190</strong>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <p>
                <strong>Comportamiento en ingresos (Afecto vs Exento):</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><strong>Insumos Exentos de IVA:</strong> Su valor siempre ingresa directo al PPP (no llevan recargo ni descuento, ya que su IVA es $0).</li>
                <li><strong>Insumos Afectos a IVA:</strong> Si se selecciona <em>"NO considera IVA"</em>, el sistema toma su valor neto. Si se selecciona <em>"SÍ considera IVA"</em>, el sistema calcula el PPP con el costo bruto total (neto + 19%).</li>
                <li><strong>Afecta únicamente la valorización del inventario (PPP):</strong> El documento tributario (Factura/Guía) conserva intactos sus montos reales de compra y subtotales comerciales para conciliación contable.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Datos de Identificación de la Empresa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              Datos de la Institución
            </h3>
            <p className="text-[10px] text-slate-400">
              Identificación general que figura en carátulas y reportes oficiales.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Razón Social / Nombre Comercial
            </label>
            <input
              type="text"
              required
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              RUT Empresa
            </label>
            <input
              type="text"
              value={rutEmpresa}
              onChange={(e) => setRutEmpresa(e.target.value)}
              placeholder="Ej. 76.123.456-7"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Alerta de Estado */}
      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
          status.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {status.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Botón de Guardado */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#227262] hover:bg-[#1a5b4e] text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Guardando Cambios...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
}
