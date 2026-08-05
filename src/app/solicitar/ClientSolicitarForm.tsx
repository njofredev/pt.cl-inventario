'use client'

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, ClipboardList, Eye, Edit3, Send, Sparkles, PackageCheck, AlertCircle } from "lucide-react";
import ProductSearchableInput from "./ProductSearchableInput";

interface CC {
  id: string;
  codigo: string;
  nombre: string;
}

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  unidadCompra?: string | null;
  unidadesPorEnvase?: number | null;
  unidadEnvase?: string | null;
  unidadesPorConsumo?: number | null;
}

interface Props {
  centrosCosto: CC[];
  productos: Product[];
  submitRequestAction: (data: {
    nombre: string;
    rut: string;
    areaTrabajo: string;
    cargo: string;
    centroCostoId: string;
    items: { productoId: string; cantidad: number }[];
  }) => Promise<{ success: boolean }>;
}

export default function ClientSolicitarForm({ centrosCosto, productos, submitRequestAction }: Props) {
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [areaTrabajo, setAreaTrabajo] = useState("");
  const [cargo, setCargo] = useState("");
  const [centroCostoId, setCentroCostoId] = useState("");
  
  // Items in the request
  const [items, setItems] = useState<{ productoId: string; cantidad: number }[]>([
    { productoId: "", cantidad: 1 }
  ]);

  const [loading, setLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { productoId: "", cantidad: 1 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [{ productoId: "", cantidad: 1 }]);
  };

  const updateItem = (index: number, field: "productoId" | "cantidad", value: any) => {
    const newItems = [...items];
    if (field === "cantidad") {
      newItems[index].cantidad = Math.max(1, parseInt(value) || 1);
    } else {
      newItems[index].productoId = value;
    }
    setItems(newItems);
  };

  // Step 1: Trigger Review Mode
  const handleStartReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Por favor, ingresa tu Nombre Completo.");
      return;
    }
    if (!centroCostoId) {
      setError("Por favor, selecciona un Centro de Costo Destino.");
      return;
    }
    
    const validItems = items.filter(item => item.productoId !== "");
    if (validItems.length === 0) {
      setError("Debe agregar al menos un producto válido a la solicitud.");
      return;
    }

    setError(null);
    setIsReviewing(true);
  };

  // Step 2: Final Submit Action
  const handleFinalSubmit = async () => {
    const validItems = items.filter(item => item.productoId !== "");
    setLoading(true);
    setError(null);

    try {
      const res = await submitRequestAction({
        nombre,
        rut,
        areaTrabajo,
        cargo,
        centroCostoId,
        items: validItems
      });
      if (res.success) {
        setIsReviewing(false);
        setSuccess(true);
      } else {
        setError("Ocurrió un error al procesar tu solicitud.");
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCC = centrosCosto.find(cc => cc.id === centroCostoId);
  const validItemsWithProduct = items
    .filter(item => item.productoId !== "")
    .map(item => ({
      ...item,
      product: productos.find(p => p.id === item.productoId)
    }));

  return (
    <>
      <form onSubmit={handleStartReview} className="space-y-6">
        {/* Datos del Solicitante */}
        <div className="glass-morphism rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
          <h2 className="text-lg font-bold text-[#162158] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ClipboardList className="h-5 w-5 text-teal-600" /> Datos del Solicitante
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Nombre Completo *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] transition-spring font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">RUT (Opcional)</label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej. 12.345.678-9"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] transition-spring font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Área de Trabajo</label>
              <input
                type="text"
                value={areaTrabajo}
                onChange={(e) => setAreaTrabajo(e.target.value)}
                placeholder="Ej. Box Dental 3"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] transition-spring font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej. Odontólogo"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] transition-spring font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Centro de Costo Destino *</label>
            <select
              required
              value={centroCostoId}
              onChange={(e) => setCentroCostoId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] transition-spring font-medium"
            >
              <option value="">Selecciona un centro de costo...</option>
              {centrosCosto.map(cc => (
                <option key={cc.id} value={cc.id}>
                  {cc.codigo} - {cc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Insumos */}
        <div className="glass-morphism rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-[#162158] dark:text-slate-100">
              Materiales Solicitados
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#227262] hover:bg-[#1a5b4e] rounded-xl transition-spring active-scale-down shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Agregar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end p-2 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Insumo / Material *</label>
                  <ProductSearchableInput
                    products={productos}
                    selectedProductId={item.productoId}
                    onSelect={(p) => updateItem(index, "productoId", p ? p.id : "")}
                    placeholder="Buscar insumo por nombre o código..."
                    required
                  />
                </div>

                <div className="w-28 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, "cantidad", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#227262] font-bold text-center"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl transition-spring active-scale-down cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botón Principal: Revisar Solicitud */}
        <button
          type="submit"
          className="w-full py-4 bg-[#162158] hover:bg-[#0f1842] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold text-sm rounded-2xl transition-all active-scale-down shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <Eye className="h-5 w-5" />
          <span>Revisar Solicitud</span>
        </button>
      </form>

      {/* MODAL PASO 2: RESUMEN Y REVISIÓN DE LA SOLICITUD */}
      {isReviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Resumen y Verificación de Solicitud
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Por favor confirma que los datos y materiales sean los correctos.
                  </p>
                </div>
              </div>
            </div>

            {/* Datos del Solicitante Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                👤 Solicitante
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{nombre}</span>
                </div>
                {rut && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">RUT:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{rut}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Centro de Costo Destino:</span>
                  <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    [{selectedCC?.codigo}] {selectedCC?.nombre}
                  </span>
                </div>
                {(areaTrabajo || cargo) && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Área / Cargo:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {[areaTrabajo, cargo].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Materiales List Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                📦 Detalle de Materiales a Solicitar ({validItemsWithProduct.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {validItemsWithProduct.map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md shrink-0">
                        {item.product?.codigo || 'COD'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.product?.nombre || 'Producto descontinuado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {item.cantidad} {item.product?.unidad || 'UND'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error inside modal */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-800 dark:text-red-300 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Action Buttons inside modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                <span>Volver a Editar</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinalSubmit}
                className="py-3 px-4 bg-[#227262] hover:bg-[#1a5b4e] text-white font-black text-xs rounded-xl transition-all active-scale-down shadow-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? "Enviando Solicitud..." : "Confirmar y Enviar Solicitud"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASO 3: CONFIRMACIÓN EXITOSA */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
              <PackageCheck className="h-8 w-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Solicitud Procesada
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ¡Solicitud Enviada con Éxito!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tu requerimiento fue registrado en la base de datos y un operador de bodega lo procesará a la brevedad.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setNombre("");
                setRut("");
                setAreaTrabajo("");
                setCargo("");
                setCentroCostoId("");
                setItems([{ productoId: "", cantidad: 1 }]);
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md active-scale-down cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Crear Nueva Solicitud</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
