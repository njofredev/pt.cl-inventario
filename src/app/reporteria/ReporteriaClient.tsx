'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Warehouse,
  ShoppingBag,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  Flame,
  Moon,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  FileSpreadsheet
} from 'lucide-react';

interface ReporteriaClientProps {
  products: any[];
  movimientos: any[];
  facturas: any[];
  solicitudes: any[];
  sucursales: any[];
  centrosCosto: any[];
}

export default function ReporteriaClient({
  products,
  movimientos,
  facturas,
  solicitudes,
  sucursales,
  centrosCosto,
}: ReporteriaClientProps) {
  // Filtros
  const [selectedSucursal, setSelectedSucursal] = useState<string>('TODAS');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'ALL' | '30D' | '90D' | '2026'>('ALL');
  const [activeTab, setActiveTab] = useState<'ROTACION' | 'SOLICITANTES' | 'BODEGUEROS' | 'INVENTARIO'>('ROTACION');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Filtrado de movimientos según rango de fechas y sucursal
  const filteredMovimientos = useMemo(() => {
    const now = new Date();
    return movimientos.filter((m) => {
      const fechaMov = new Date(m.fecha);
      
      // Filtro Temporal
      if (selectedTimeRange === '30D') {
        const d30 = new Date();
        d30.setDate(now.getDate() - 30);
        if (fechaMov < d30) return false;
      } else if (selectedTimeRange === '90D') {
        const d90 = new Date();
        d90.setDate(now.getDate() - 90);
        if (fechaMov < d90) return false;
      } else if (selectedTimeRange === '2026') {
        if (fechaMov.getFullYear() !== 2026) return false;
      }

      // Filtro Sucursal
      if (selectedSucursal !== 'TODAS') {
        if (m.bodega?.sucursalId !== selectedSucursal) return false;
      }

      return true;
    });
  }, [movimientos, selectedTimeRange, selectedSucursal]);

  // 2. Filtrado de facturas según sucursal y fechas
  const filteredFacturas = useMemo(() => {
    return facturas.filter((f) => {
      const fechaDoc = new Date(f.fechaDocumento);
      if (selectedTimeRange === '30D') {
        const d30 = new Date();
        d30.setDate(new Date().getDate() - 30);
        if (fechaDoc < d30) return false;
      } else if (selectedTimeRange === '90D') {
        const d90 = new Date();
        d90.setDate(new Date().getDate() - 90);
        if (fechaDoc < d90) return false;
      } else if (selectedTimeRange === '2026') {
        if (fechaDoc.getFullYear() !== 2026) return false;
      }
      return true;
    });
  }, [facturas, selectedTimeRange]);

  // 3. Cálculos de KPIs Ejecutivos
  const kpis = useMemo(() => {
    // Total Stock y Valorizado del inventario actual
    let totalUnidadesInventario = 0;
    let valorTotalInventario = 0;
    let itemsStockCritico = 0;

    products.forEach((p) => {
      let stockProd = 0;
      p.stocks.forEach((s: any) => {
        if (selectedSucursal === 'TODAS' || s.bodega?.sucursalId === selectedSucursal) {
          stockProd += s.cantidad;
        }
      });
      totalUnidadesInventario += stockProd;
      valorTotalInventario += stockProd * (p.ppp || 0);

      if (stockProd <= (p.stockCritico || 0)) {
        itemsStockCritico++;
      }
    });

    // Total Compras
    const totalGastoCompras = filteredFacturas.reduce((acc, f) => acc + (f.montoTotal || 0), 0);

    // Total Solicitudes y Tasa de despacho
    const totalSolicitudes = solicitudes.length;
    const solicitudesDespachadas = solicitudes.filter(s => s.estado === 'APROBADA' || s.estado === 'DESPACHADA').length;
    const tasaCumplimiento = totalSolicitudes > 0 ? Math.round((solicitudesDespachadas / totalSolicitudes) * 100) : 100;

    return {
      totalUnidadesInventario,
      valorTotalInventario,
      itemsStockCritico,
      totalGastoCompras,
      totalFacturas: filteredFacturas.length,
      totalSolicitudes,
      tasaCumplimiento,
    };
  }, [products, filteredFacturas, solicitudes, selectedSucursal]);

  // 4. Analítica de Rotación: Más Consumidos vs Menos Movimiento
  const { topConsumidos, stockDormido, topValorizados } = useMemo(() => {
    // Consumos acumulados por producto (salidas por consumo o solicitudes)
    const salidasPorProd = new Map<string, { product: any; cantidadTotal: number; costoTotal: number }>();
    const entradasPorProd = new Map<string, number>();

    filteredMovimientos.forEach((m) => {
      const pId = m.productoId;
      const esSalida = m.tipoMovimiento?.esEntrada === false || m.tipoMovimiento?.nombre.includes('Consumo');

      if (esSalida) {
        if (!salidasPorProd.has(pId)) {
          salidasPorProd.set(pId, { product: m.product, cantidadTotal: 0, costoTotal: 0 });
        }
        const item = salidasPorProd.get(pId)!;
        item.cantidadTotal += m.cantidad;
        item.costoTotal += m.cantidad * (m.valorUnitario || m.pppCalculado || 0);
      } else {
        entradasPorProd.set(pId, (entradasPorProd.get(pId) || 0) + m.cantidad);
      }
    });

    // Top Consumidos
    const listConsumidos = Array.from(salidasPorProd.values())
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 10);

    // Si aún hay pocos consumos registrados (como tras una migración de compras), complementamos con el top de productos con mayor stock
    const listValorizados = products
      .map((p) => {
        const totalStock = p.stocks.reduce((acc: number, s: any) => acc + s.cantidad, 0);
        return {
          product: p,
          totalStock,
          valorTotal: totalStock * (p.ppp || 0),
        };
      })
      .filter((x) => x.totalStock > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);

    // Stock Dormido: Productos con existencias en bodega pero sin movimientos de salida
    const listDormidos = products
      .map((p) => {
        const totalStock = p.stocks.reduce((acc: number, s: any) => acc + s.cantidad, 0);
        const salidas = salidasPorProd.get(p.id)?.cantidadTotal || 0;
        return {
          product: p,
          totalStock,
          salidas,
          valorInmovilizado: totalStock * (p.ppp || 0),
        };
      })
      .filter((x) => x.totalStock > 0 && x.salidas === 0)
      .sort((a, b) => b.valorInmovilizado - a.valorInmovilizado)
      .slice(0, 10);

    return {
      topConsumidos: listConsumidos,
      stockDormido: listDormidos,
      topValorizados: listValorizados,
    };
  }, [filteredMovimientos, products]);

  // 5. Analítica de Solicitantes y Centros de Costo
  const { topSolicitantes, gastoPorCentroCosto } = useMemo(() => {
    const solicitantesMap = new Map<string, { nombre: string; departamento: string; totalSolicitudes: number; totalItems: number }>();
    const centrosMap = new Map<string, { nombre: string; codigo: string; totalSolicitudes: number; totalItems: number }>();

    solicitudes.forEach((s) => {
      const itemsCount = s.items.reduce((acc: number, it: any) => acc + it.cantidad, 0);

      // Solicitante
      const sKey = s.nombre.trim().toUpperCase();
      if (!solicitantesMap.has(sKey)) {
        solicitantesMap.set(sKey, {
          nombre: s.nombre,
          departamento: s.areaTrabajo || s.cargo || 'General',
          totalSolicitudes: 0,
          totalItems: 0,
        });
      }
      const sObj = solicitantesMap.get(sKey)!;
      sObj.totalSolicitudes += 1;
      sObj.totalItems += itemsCount;

      // Centro de Costo
      const cId = s.centroCostoId;
      const cNombre = s.centroCosto?.nombre || 'General';
      const cCodigo = s.centroCosto?.codigo || 'CC';
      if (!centrosMap.has(cId)) {
        centrosMap.set(cId, { nombre: cNombre, codigo: cCodigo, totalSolicitudes: 0, totalItems: 0 });
      }
      const cObj = centrosMap.get(cId)!;
      cObj.totalSolicitudes += 1;
      cObj.totalItems += itemsCount;
    });

    return {
      topSolicitantes: Array.from(solicitantesMap.values()).sort((a, b) => b.totalSolicitudes - a.totalSolicitudes).slice(0, 8),
      gastoPorCentroCosto: Array.from(centrosMap.values()).sort((a, b) => b.totalItems - a.totalItems).slice(0, 8),
    };
  }, [solicitudes]);

  // 6. Analítica de Productividad de Bodegueros / Usuarios
  const actividadUsuarios = useMemo(() => {
    const userMap = new Map<string, { user: any; entradas: number; salidas: number; totalMovimientos: number }>();

    filteredMovimientos.forEach((m) => {
      const uId = m.usuarioId;
      if (!userMap.has(uId)) {
        userMap.set(uId, { user: m.usuario, entradas: 0, salidas: 0, totalMovimientos: 0 });
      }
      const uData = userMap.get(uId)!;
      uData.totalMovimientos += 1;
      if (m.tipoMovimiento?.esEntrada) {
        uData.entradas += 1;
      } else {
        uData.salidas += 1;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalMovimientos - a.totalMovimientos);
  }, [filteredMovimientos]);

  // Formateadores
  const fmtCLP = (val: number) => `$${Math.round(val).toLocaleString('es-CL')}`;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Inteligentes y Controles */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Rango de Fechas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Todo el Historial' },
            { id: '2026', label: 'Año 2026' },
            { id: '90D', label: 'Últimos 90 Días' },
            { id: '30D', label: 'Últimos 30 Días' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTimeRange(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                selectedTimeRange === item.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filtro por Sucursal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Warehouse className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSucursal}
            onChange={(e) => setSelectedSucursal(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto"
          >
            <option value="TODAS">Todas las Sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas Superiores de Métricas Clave (KPIs Ejecutivos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Valorización del Inventario */}
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inventario Valorizado
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {fmtCLP(kpis.valorTotalInventario)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span>{kpis.totalUnidadesInventario.toLocaleString('es-CL')} unidades en existencias</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Total Compras Registradas */}
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gasto Acumulado en Compras
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {fmtCLP(kpis.totalGastoCompras)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              <span>{kpis.totalFacturas} facturas procesadas</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Crítico */}
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Insumos en Nivel Crítico
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1.5">
              <span>{kpis.itemsStockCritico}</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-sans tracking-normal">
                de {products.length} productos
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{products.length > 0 ? `${((kpis.itemsStockCritico / products.length) * 100).toFixed(0)}% del catálogo requiere reposición` : 'Requieren reabastecimiento'}</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Solicitudes y Efectividad */}
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tasa Despacho de Pedidos
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {kpis.tasaCumplimiento}%
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>{kpis.totalSolicitudes} requerimientos gestionados</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas de Análisis */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2">
        {[
          { id: 'ROTACION', label: 'Rotación y Capital', icon: TrendingUp },
          { id: 'SOLICITANTES', label: 'Solicitantes y Áreas', icon: Users },
          { id: 'BODEGUEROS', label: 'Productividad Bodegas', icon: Truck },
          { id: 'INVENTARIO', label: 'Existencias Valorizadas', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: ROTACIÓN Y CAPITAL */}
      {activeTab === 'ROTACION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Insumos con Mayor Capital Invertido */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Mayor Capital Concentrado (Top 10)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Insumos que concentran el mayor valor monetario en bodega</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {topValorizados.map((item, idx) => {
                const maxVal = topValorizados[0]?.valorTotal || 1;
                const pct = Math.round((item.valorTotal / maxVal) * 100);
                return (
                  <div key={item.product.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[280px]">
                        {idx + 1}. [{item.product.codigo}] {item.product.nombre}
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {fmtCLP(item.valorTotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.totalStock} {item.product.unidad || 'UND'} @ {fmtCLP(item.product.ppp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock Inmovilizado ("Dormido") */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Stock Sin Salidas Recientes ("Dormido")
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Productos con existencias que no registran salida de consumo</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {stockDormido.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay stock dormido detectado en el período seleccionado.
                </div>
              ) : (
                stockDormido.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {idx + 1}. [{item.product.codigo}] {item.product.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.totalStock} unidades en existencias • {item.product.clasificacion || 'General'}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {fmtCLP(item.valorInmovilizado)}
                      </span>
                      <p className="text-[10px] text-slate-400">inmovilizado</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: SOLICITANTES Y ÁREAS */}
      {activeTab === 'SOLICITANTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking de Solicitantes Más Frecuentes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Users className="w-4 h-4 text-blue-500" />
              Ranking de Solicitantes Más Activos
            </h3>

            <div className="mt-4 space-y-3">
              {topSolicitantes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aún no se registran requerimientos en el período.
                </div>
              ) : (
                topSolicitantes.map((sol, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{sol.nombre}</p>
                        <p className="text-[11px] text-slate-400">{sol.departamento}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        {sol.totalSolicitudes} pedidos
                      </span>
                      <p className="text-[10px] text-slate-400">{sol.totalItems} unidades solicitadas</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Demanda por Centro de Costo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-purple-500" />
              Demanda por Centro de Costo / Área
            </h3>

            <div className="mt-4 space-y-3">
              {gastoPorCentroCosto.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay datos por centro de costo aún.
                </div>
              ) : (
                gastoPorCentroCosto.map((cc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold mr-2">
                        {cc.codigo}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cc.nombre}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">
                        {cc.totalItems} insumos
                      </span>
                      <p className="text-[10px] text-slate-400">{cc.totalSolicitudes} solicitudes</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PRODUCTIVIDAD BODEGUEROS */}
      {activeTab === 'BODEGUEROS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Truck className="w-4 h-4 text-emerald-500" />
            Productividad y Actividad Operativa de Usuarios / Bodegueros
          </h3>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3 text-center">Entradas (Compras/Ajustes)</th>
                  <th className="py-2.5 px-3 text-center">Salidas (Consumos)</th>
                  <th className="py-2.5 px-3 text-right">Total Transacciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {actividadUsuarios.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.user?.nombre || 'Desconocido'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">@{item.user?.username}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.user?.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{item.entradas}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                      -{item.salidas}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                      {item.totalMovimientos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: EXISTENCIAS VALORIZADAS DETALLE */}
      {activeTab === 'INVENTARIO' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                Matriz de Existencias Valorizadas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Saldo físico actual y su valorización por Precio Promedio Ponderado (PPP)</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Clasificación</th>
                  <th className="py-2.5 px-3 text-right">Stock Físico</th>
                  <th className="py-2.5 px-3 text-right">PPP Unitario</th>
                  <th className="py-2.5 px-3 text-right">Valorizado Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products
                  .filter((p) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q);
                  })
                  .slice(0, 100)
                  .map((p) => {
                    const totalStock = p.stocks.reduce((acc: number, s: any) => {
                      if (selectedSucursal === 'TODAS' || s.bodega?.sucursalId === selectedSucursal) {
                        return acc + s.cantidad;
                      }
                      return acc;
                    }, 0);
                    const valorizado = totalStock * (p.ppp || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {p.codigo}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {p.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {p.clasificacion || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                          {totalStock.toLocaleString('es-CL')} {p.unidad || 'UND'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {fmtCLP(p.ppp || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {fmtCLP(valorizado)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
