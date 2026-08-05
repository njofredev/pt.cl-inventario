'use client';

import { useState, useEffect } from "react";
import { createProductAction, getNextCorrelativeAction, searchSimilarProductsAction } from "./actions";
import { Plus, AlertCircle, CheckCircle, CheckCircle2, Sparkles, PackageCheck, Calendar, RotateCcw, Info } from "lucide-react";
import UnitSelect from "@/components/UnitSelect";

interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
}

interface UnidadMedida {
  id: string;
  nombre: string;
}

interface ProductFormProps {
  cuentasContables: CuentaContable[];
  unidadesMedida?: UnidadMedida[];
}

const CLASIFICACIONES = [
  { id: "CLI", nombre: "INSUMOS CLINICOS (CLI)", cuentaCodigo: "1.1.05.03" },
  { id: "EPP", nombre: "ELEMENTOS DE PROTECCION PERSONAL (EPP)", cuentaCodigo: "1.1.05.03" },
  { id: "ASE", nombre: "ASEO Y DESINFECCION (ASE)", cuentaCodigo: "1.1.05.01" },
  { id: "EST", nombre: "ESTERILIZACION (EST)", cuentaCodigo: "1.1.05.03" },
  { id: "ADM", nombre: "ADMINISTRACION Y OFICINA (ADM)", cuentaCodigo: "1.1.05.02" }
];

const TIPOS: Record<string, { id: string; nombre: string }[]> = {
  CLI: [
    { id: "FR", nombre: "Fresas y Piedras (FR)" },
    { id: "MC", nombre: "Materiales Restauradores y Cementos (MC)" },
    { id: "MI", nombre: "Materiales de Impresión (MI)" },
    { id: "LE", nombre: "Limas y Ensanchadores (LE)" },
    { id: "CP", nombre: "Conos y Puntas (CP)" },
    { id: "AJ", nombre: "Agujas, Jeringas y Anestesia (AJ)" },
    { id: "LS", nombre: "Líquidos y Soluciones Clínicas (LS)" },
    { id: "AM", nombre: "Aislación y Matrices (AM)" },
    { id: "AD", nombre: "Algodón y Desechables Clínicos (AD)" },
    { id: "MS", nombre: "Misceláneos Clínicos (MS)" }
  ],
  EPP: [
    { id: "GU", nombre: "Guantes (GU)" },
    { id: "MR", nombre: "Mascarillas y Respiradores (MR)" },
    { id: "RD", nombre: "Ropa Desechable y de Protección (RD)" },
    { id: "PF", nombre: "Protección Ocular y Facial (PF)" }
  ],
  ASE: [
    { id: "DQ", nombre: "Detergentes y Químicos (DQ)" },
    { id: "AL", nombre: "Artículos de Limpieza Físicos (AL)" },
    { id: "PA", nombre: "Papelería de Aseo (PA)" },
    { id: "IM", nombre: "Insumos de Manejo de Desechos (IM)" }
  ],
  EST: [
    { id: "EM", nombre: "Empaques de Esterilización (EM)" },
    { id: "IN", nombre: "Controles e Indicadores (IN)" }
  ],
  ADM: [
    { id: "II", nombre: "Insumos de Impresión (II)" },
    { id: "PO", nombre: "Papelería de Oficina (PO)" },
    { id: "AE", nombre: "Artículos de Escritorio (AE)" },
    { id: "HA", nombre: "Herramientas y Accesorios de Oficina (HA)" },
    { id: "IG", nombre: "Insumos Electrónicos y Generales (IG)" }
  ]
};

export default function ProductForm({ cuentasContables, unidadesMedida = [] }: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [clasificacion, setClasificacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("UND");
  const [cuentaContableId, setCuentaContableId] = useState("");

  // Conversión de Unidades
  const [unidadCompra, setUnidadCompra] = useState("");
  const [unidadesPorEnvase, setUnidadesPorEnvase] = useState("1");
  const [unidadEnvase, setUnidadEnvase] = useState("");
  const [unidadesPorConsumo, setUnidadesPorConsumo] = useState("1");

  // Vencimiento y Lote
  const [tieneVencimiento, setTieneVencimiento] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [lote, setLote] = useState("");

  const [suggestions, setSuggestions] = useState<{
    codigo: string;
    nombre: string;
    clasificacion?: string | null;
    tipoProducto?: string | null;
  }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [createdProductModalData, setCreatedProductModalData] = useState<{
    codigo: string;
    nombre: string;
    unidad: string;
    unidadCompra?: string;
  } | null>(null);

  useEffect(() => {
    if (!clasificacion) {
      setTipo("");
      setCodigo("");
      setCuentaContableId("");
      return;
    }

    const selectedClasif = CLASIFICACIONES.find(c => c.id === clasificacion);
    if (selectedClasif) {
      const matchingCC = cuentasContables.find(cc => cc.codigo === selectedClasif.cuentaCodigo);
      if (matchingCC) {
        setCuentaContableId(matchingCC.id);
      }
    }
  }, [clasificacion, cuentasContables]);

  useEffect(() => {
    async function updateCode() {
      if (clasificacion && tipo) {
        const nextCode = await getNextCorrelativeAction(clasificacion, tipo);
        setCodigo(nextCode);
      } else {
        setCodigo("");
      }
    }
    updateCode();
  }, [clasificacion, tipo]);

  useEffect(() => {
    if (nombre.trim().length < 3) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const results = await searchSimilarProductsAction(nombre);
      setSuggestions(results);
      setHasSearched(true);
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [nombre]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("codigo", codigo);
    formData.append("nombre", nombre);
    formData.append("unidad", unidad);
    formData.append("cuentaContableId", cuentaContableId);

    // Unidades
    formData.append("unidadCompra", unidadCompra);
    formData.append("unidadesPorEnvase", unidadesPorEnvase);
    formData.append("unidadEnvase", unidadEnvase);
    formData.append("unidadesPorConsumo", unidadesPorConsumo);

    // Vencimiento y Lote
    formData.append("tieneVencimiento", tieneVencimiento ? "true" : "false");
    formData.append("fechaVencimiento", fechaVencimiento);
    formData.append("lote", lote);

    const res = await createProductAction(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setCreatedProductModalData({
        codigo,
        nombre,
        unidad,
        unidadCompra: unidadCompra || undefined
      });
      setSuccess(`Producto [${codigo}] registrado exitosamente.`);
      setClasificacion("");
      setTipo("");
      setCodigo("");
      setNombre("");
      setUnidad("UND");
      setCuentaContableId("");
      setUnidadCompra("");
      setUnidadesPorEnvase("1");
      setUnidadEnvase("");
      setUnidadesPorConsumo("1");
      setTieneVencimiento(false);
      setFechaVencimiento("");
      setLote("");
      setSuggestions([]);
    }
  }

  function handleReset() {
    setClasificacion("");
    setTipo("");
    setCodigo("");
    setNombre("");
    setUnidad("UND");
    setCuentaContableId("");
    setUnidadCompra("");
    setUnidadesPorEnvase("1");
    setUnidadEnvase("");
    setUnidadesPorConsumo("1");
    setTieneVencimiento(false);
    setFechaVencimiento("");
    setLote("");
    setSuggestions([]);
    setError(null);
    setSuccess(null);
  }

  const tiposDisponibles = clasificacion ? TIPOS[clasificacion] || [] : [];
  const factorTotal = (parseInt(unidadesPorEnvase) || 1) * (parseInt(unidadesPorConsumo) || 1);

  const prefixSelected = clasificacion && tipo ? `${clasificacion}-${tipo}-` : null;

  const inSameCategory = suggestions.filter((s) => 
    prefixSelected ? s.codigo.startsWith(prefixSelected) : false
  );

  const inOtherCategory = suggestions.filter((s) => 
    prefixSelected ? !s.codigo.startsWith(prefixSelected) : true
  );

  return (
    <div className="space-y-4">
      {/* Header Formulario + Botón Limpiar a la Derecha */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            Nuevo Producto
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Registra un nuevo material en el catálogo general
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          title="Limpiar formulario completo"
        >
          <RotateCcw className="h-3.5 w-3.5 text-white" />
          <span>Limpiar</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 1. Clasificación y Tipo en Grilla de 2 columnas (Primero) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Clasificación *</label>
            <select
              value={clasificacion}
              onChange={(e) => setClasificacion(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Selecciona...</option>
              {CLASIFICACIONES.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tipo de Producto *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={!clasificacion}
              required
              className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 font-medium"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Selecciona tipo...</option>
              {tiposDisponibles.map((t) => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Nombre del Producto (Segundo) */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nombre Producto *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej: Paracetamol 500mg"
            required
            className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
          {/* Banner de Validación e Inteligencia de Coincidencias */}
          {nombre.trim().length >= 3 && hasSearched && (
            <div className="mt-1.5 space-y-2">
              {/* Caso 1: Coincidencia en la MISMA categoría y tipo */}
              {inSameCategory.length > 0 && (
                <div className="p-3 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="text-[10px] font-extrabold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <span>⚠️ El producto ya existe en esta categoría y tipo seleccionado:</span>
                  </div>
                  <ul className="text-[10px] text-red-950 dark:text-red-200 font-medium space-y-1 max-h-24 overflow-y-auto pr-1">
                    {inSameCategory.map((s) => (
                      <li key={s.codigo} className="flex justify-between items-center border-b border-red-200/50 dark:border-red-800/40 pb-0.5 last:border-0 last:pb-0">
                        <span className="truncate pr-2">{s.nombre}</span>
                        <span className="font-mono text-red-700 dark:text-red-400 flex-shrink-0 font-bold">{s.codigo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Caso 2: Coincidencia en OTRA categoría / tipo */}
              {inOtherCategory.length > 0 && (
                <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>💡 Producto nuevo en esta categoría/tipo, pero registrado en otra sección:</span>
                  </div>
                  <ul className="text-[10px] text-blue-950 dark:text-blue-200 font-medium space-y-1 max-h-24 overflow-y-auto pr-1">
                    {inOtherCategory.map((s) => (
                      <li key={s.codigo} className="flex justify-between items-center border-b border-blue-200/50 dark:border-blue-800/40 pb-0.5 last:border-0 last:pb-0">
                        <span className="truncate pr-2">{s.nombre}</span>
                        <span className="font-mono text-blue-700 dark:text-blue-400 flex-shrink-0 font-bold">{s.codigo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Caso 3: Producto totalmente nuevo en todo el inventario */}
              {suggestions.length === 0 && (
                <div className="p-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>✅ Producto totalmente nuevo: No existen coincidencias en el inventario.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Código del Producto (Tercero) */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Código (Autogenerado) *</label>
          <input
            type="text"
            value={codigo}
            readOnly
            placeholder="Auto al elegir tipo"
            required
            className="w-full px-3 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none font-mono font-bold cursor-not-allowed select-none"
          />
        </div>

      {/* SECCIÓN PREGUNTA: ¿El producto vence? */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            ¿El producto vence?
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="tieneVencimiento"
                checked={tieneVencimiento === true}
                onChange={() => setTieneVencimiento(true)}
                className="text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              Sí
            </label>
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="tieneVencimiento"
                checked={tieneVencimiento === false}
                onChange={() => {
                  setTieneVencimiento(false);
                  setFechaVencimiento("");
                  setLote("");
                }}
                className="text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              No
            </label>
          </div>
        </div>

        {tieneVencimiento && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                required={tieneVencimiento}
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Número de Lote (Opcional)
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="ej: LOTE-2026-X8"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN CONVERSIÓN DE UNIDADES */}
      <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/40 pb-2">
          <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
            📦 Conversión de Unidades (Opcional)
          </span>
          <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
            Jerarquía 3 Niveles
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Nivel 1: Compra */}
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">1. Unidad Compra</label>
            <UnitSelect
              value={unidadCompra}
              onChange={setUnidadCompra}
              options={unidadesMedida}
              placeholder="Ej. CAJA, BIDÓN..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Contenido x Caja</label>
            <input
              type="number"
              min="1"
              value={unidadesPorEnvase}
              onChange={(e) => setUnidadesPorEnvase(e.target.value)}
              placeholder="ej: 5 (bolsas)"
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Nivel 2: Envase Intermedio */}
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">2. Unidad Envase</label>
            <UnitSelect
              value={unidadEnvase}
              onChange={setUnidadEnvase}
              options={unidadesMedida}
              placeholder="Ej. BOLSA, SACHET..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Contenido x Envase</label>
            <input
              type="number"
              min="1"
              value={unidadesPorConsumo}
              onChange={(e) => setUnidadesPorConsumo(e.target.value)}
              placeholder="ej: 10 (unidades)"
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        {/* Nivel 3: Unidad Mínima */}
        <div className="space-y-1 pt-1 border-t border-teal-200/50 dark:border-teal-800/30">
          <label className="text-[9px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">3. Unidad Mínima de Consumo (Stock Real) *</label>
          <UnitSelect
            value={unidad}
            onChange={setUnidad}
            options={unidadesMedida}
            placeholder="Ej. LANCETA, AGUJA, UNIDAD..."
            required
          />
        </div>

        {/* Resumen Calculado */}
        {unidadCompra && (
          <div className="p-2 bg-teal-100/70 dark:bg-teal-900/40 rounded-lg text-[10px] text-teal-900 dark:text-teal-200 font-medium space-y-0.5">
            <div className="font-extrabold text-teal-950 dark:text-teal-100">Equivalencia Automática:</div>
            <div>
              1 <b>{unidadCompra}</b> = {unidadesPorEnvase} <b>{unidadEnvase || "Envases"}</b> × {unidadesPorConsumo} <b>{unidad || "Unidades"}</b>
            </div>
            <div className="font-bold text-teal-700 dark:text-teal-300 pt-0.5 border-t border-teal-200/60 dark:border-teal-800/40">
              ➜ Total Stock por 1 {unidadCompra}: <span className="underline">{factorTotal} {unidad || "Unidades"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cuenta Contable */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Cuenta de Existencias (Autodetectada)</label>
        <select
          value={cuentaContableId}
          onChange={(e) => setCuentaContableId(e.target.value)}
          disabled
          className="w-full px-3 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none disabled:opacity-75 cursor-not-allowed font-medium"
        >
          <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Selecciona una cuenta...</option>
          {cuentasContables.map((cc) => (
            <option key={cc.id} value={cc.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              {cc.codigo} - {cc.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-[10px] font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-[10px] font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#162158] hover:bg-[#0f1842] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition-all active-scale-down shadow-sm cursor-pointer flex items-center justify-center gap-1.5 mt-2"
      >
        <Plus className="h-4 w-4" />
        {loading ? "Registrando..." : "Registrar Producto"}
      </button>

      {/* POPUP MODAL DE ÉXITO AL REGISTRAR PRODUCTO */}
      {createdProductModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 dark:border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Glowing Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20">
              <PackageCheck className="h-8 w-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Confirmación BBDD
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ¡Producto Ingresado con Éxito!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                El producto ha sido guardado correctamente en la base de datos.
              </p>
            </div>

            {/* Product Summary Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-left space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Código:</span>
                <span className="font-mono text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                  {createdProductModalData.codigo}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Nombre:</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {createdProductModalData.nombre}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[10px]">
                <span className="font-extrabold text-slate-400 uppercase">Unidad Mínima:</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                  {createdProductModalData.unidad}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setCreatedProductModalData(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md active-scale-down cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Entendido / Continuar</span>
            </button>
          </div>
        </div>
      )}
      </form>
    </div>
  );
}
