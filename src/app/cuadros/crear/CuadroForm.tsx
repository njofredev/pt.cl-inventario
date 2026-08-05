'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCuadroAction, getLatestPriceAction } from "../actions";
import { Plus, Trash, ArrowLeft, Save, Search, User, MapPin } from "lucide-react";
import Link from "next/link";

interface Sucursal {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
}

interface CuadroFormProps {
  sucursales: Sucursal[];
  productos: Product[];
}

interface FormItem {
  key: string; // identificador único temporal
  productoId: string;
  nombreArticulo: string;
  unidad: string;
  cantidad: number;
  precioUnitario1: number;
  precioUnitario2: number;
  precioUnitario3: number;
  ultimoPrecio: number;
  ultimoProveedor: string;
  showDropdown?: boolean;
}

export default function CuadroForm({ sucursales, productos }: CuadroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados generales
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id || "");
  const [proveedor1, setProveedor1] = useState("Proveedor A");
  const [proveedor2, setProveedor2] = useState("Proveedor B");
  const [proveedor3, setProveedor3] = useState("Proveedor C");
  const [ganador, setGanador] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("Proveedor es distribuidor directo de este insumo, por tanto no hay más proveedores para comparar");

  // Estado de los items
  const [items, setItems] = useState<FormItem[]>([
    {
      key: Math.random().toString(36).substring(7),
      productoId: "",
      nombreArticulo: "",
      unidad: "UND",
      cantidad: 1,
      precioUnitario1: 0,
      precioUnitario2: 0,
      precioUnitario3: 0,
      ultimoPrecio: 0,
      ultimoProveedor: ""
    }
  ]);

  // Agregar fila
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        key: Math.random().toString(36).substring(7),
        productoId: "",
        nombreArticulo: "",
        unidad: "UND",
        cantidad: 1,
        precioUnitario1: 0,
        precioUnitario2: 0,
        precioUnitario3: 0,
        ultimoPrecio: 0,
        ultimoProveedor: ""
      }
    ]);
  };

  // Eliminar fila
  const handleRemoveItem = (key: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.key !== key));
    }
  };

  // Modificar campo de una fila
  const handleUpdateItem = (key: string, field: keyof FormItem, value: any) => {
    setItems(
      items.map(item => {
        if (item.key === key) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Al seleccionar un producto del buscador
  const handleSelectProduct = async (key: string, product: Product) => {
    // Buscar historial de compras de este producto
    const history = await getLatestPriceAction(product.id);

    setItems(
      items.map(item => {
        if (item.key === key) {
          return {
            ...item,
            productoId: product.id,
            nombreArticulo: `[${product.codigo}] ${product.nombre}`,
            unidad: product.unidad || "UND",
            ultimoPrecio: history.precio,
            ultimoProveedor: history.proveedor,
            showDropdown: false
          };
        }
        return item;
      })
    );
  };

  // Cálculos matemáticos globales
  const calculateTotals = () => {
    let neto1 = 0;
    let neto2 = 0;
    let neto3 = 0;

    items.forEach(item => {
      neto1 += item.cantidad * item.precioUnitario1;
      neto2 += item.cantidad * item.precioUnitario2;
      neto3 += item.cantidad * item.precioUnitario3;
    });

    const iva1 = Math.round(neto1 * 0.19);
    const iva2 = Math.round(neto2 * 0.19);
    const iva3 = Math.round(neto3 * 0.19);

    const bruto1 = neto1 + iva1;
    const bruto2 = neto2 + iva2;
    const bruto3 = neto3 + iva3;

    return {
      p1: { neto: neto1, iva: iva1, bruto: bruto1 },
      p2: { neto: neto2, iva: iva2, bruto: bruto2 },
      p3: { neto: neto3, iva: iva3, bruto: bruto3 }
    };
  };

  const totals = calculateTotals();

  // Obtener el monto de la orden según el ganador
  const getOrderTotal = () => {
    if (ganador === 1) return totals.p1.bruto;
    if (ganador === 2) return totals.p2.bruto;
    if (ganador === 3) return totals.p3.bruto;
    return 0;
  };

  const totalOrden = getOrderTotal();

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar datos mínimos
    const invalidItems = items.filter(item => !item.nombreArticulo.trim() || item.cantidad <= 0);
    if (invalidItems.length > 0) {
      setError("Por favor complete el nombre y una cantidad válida (mayor a 0) en todas las filas.");
      setLoading(false);
      return;
    }

    if (!ganador) {
      setError("Debe adjudicar el cuadro a una cotización ganadora para continuar.");
      setLoading(false);
      return;
    }

    const payload = {
      fecha,
      sucursalId: sucursalId || undefined,
      proveedor1,
      proveedor2,
      proveedor3,
      ganador,
      observaciones,
      totalOrdenCompra: totalOrden,
      items: items.map(item => ({
        productoId: item.productoId || undefined,
        nombreArticulo: item.nombreArticulo,
        cantidad: item.cantidad,
        precioUnitario1: item.precioUnitario1,
        precioUnitario2: item.precioUnitario2,
        precioUnitario3: item.precioUnitario3,
        ultimoPrecio: item.ultimoPrecio,
        ultimoProveedor: item.ultimoProveedor
      }))
    };

    const res = await saveCuadroAction(payload);

    if (res.success) {
      router.push("/cuadros");
      router.refresh();
    } else {
      setError(res.error || "Ocurrió un error al guardar el cuadro comparativo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/cuadros"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver al Historial
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold bg-brand-teal text-slate-950 rounded-xl hover:bg-brand-teal/95 transition-all shadow-sm hover:shadow disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {loading ? "Guardando..." : "Guardar Comparativa"}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* General Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha del Documento</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-teal"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sucursal Destino</label>
          <select
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-teal"
          >
            <option value="">-- General / Ninguna --</option>
            {sucursales.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Último Precio Compra (Ayuda)</label>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 font-medium flex items-center gap-1.5 select-none">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Consulta historial automáticamente
          </div>
        </div>
      </div>

      {/* Providers Columns Names Inputs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Nombres de Proveedores a Cotizar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor 1</label>
            <input
              type="text"
              value={proveedor1}
              onChange={(e) => setProveedor1(e.target.value)}
              required
              placeholder="Nombre Proveedor A"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-teal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor 2</label>
            <input
              type="text"
              value={proveedor2}
              onChange={(e) => setProveedor2(e.target.value)}
              required
              placeholder="Nombre Proveedor B"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-teal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proveedor 3</label>
            <input
              type="text"
              value={proveedor3}
              onChange={(e) => setProveedor3(e.target.value)}
              required
              placeholder="Nombre Proveedor C"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-teal"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Planilla de Cotizaciones</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center text-xs font-bold text-brand-teal hover:underline"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar Fila
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4 w-12 text-center">Fila</th>
                <th className="py-3.5 px-4 w-16">Cant.</th>
                <th className="py-3.5 px-4 w-80">Descripción del Artículo (Producto)</th>
                
                {/* Proveedor 1 */}
                <th className="py-3.5 px-4 bg-slate-50/20 text-brand-teal border-x border-slate-100 text-center" colSpan={2}>
                  {proveedor1 || "Proveedor 1"}
                </th>

                {/* Proveedor 2 */}
                <th className="py-3.5 px-4 bg-slate-50/20 text-slate-600 border-x border-slate-100 text-center" colSpan={2}>
                  {proveedor2 || "Proveedor 2"}
                </th>

                {/* Proveedor 3 */}
                <th className="py-3.5 px-4 bg-slate-50/20 text-slate-600 border-x border-slate-100 text-center" colSpan={2}>
                  {proveedor3 || "Proveedor 3"}
                </th>

                {/* Histórico */}
                <th className="py-3.5 px-4 bg-amber-50/40 text-amber-800 text-center" colSpan={2}>
                  Último Historial Compra
                </th>
                <th className="py-3.5 px-4 w-12 text-center"></th>
              </tr>
              <tr className="bg-slate-100/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th></th>
                <th></th>
                <th></th>
                {/* P1 */}
                <th className="py-2 px-3 border-l border-slate-100 text-right">P. Unit</th>
                <th className="py-2 px-3 border-r border-slate-100 text-right">Total</th>
                {/* P2 */}
                <th className="py-2 px-3 border-l border-slate-100 text-right">P. Unit</th>
                <th className="py-2 px-3 border-r border-slate-100 text-right">Total</th>
                {/* P3 */}
                <th className="py-2 px-3 border-l border-slate-100 text-right">P. Unit</th>
                <th className="py-2 px-3 border-r border-slate-100 text-right">Total</th>
                {/* Historial */}
                <th className="py-2 px-3 border-l border-slate-200 text-right text-amber-700">Precio x Un</th>
                <th className="py-2 px-3 border-r border-slate-200 text-amber-700">Proveedor</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, index) => {
                const totalItem1 = item.cantidad * item.precioUnitario1;
                const totalItem2 = item.cantidad * item.precioUnitario2;
                const totalItem3 = item.cantidad * item.precioUnitario3;

                // Filtrar autocomplete de productos
                const searchTerm = item.nombreArticulo.toLowerCase();
                const filteredProducts = productos.filter(p => 
                  p.nombre.toLowerCase().includes(searchTerm) || 
                  p.codigo.toLowerCase().includes(searchTerm)
                ).slice(0, 5);

                return (
                  <tr key={item.key} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">
                      {index + 1}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleUpdateItem(item.key, "cantidad", Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-700 focus:outline-none focus:border-brand-teal"
                      />
                    </td>
                    <td className="py-3 px-2 relative">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                        <input
                          type="text"
                          value={item.nombreArticulo}
                          onChange={(e) => {
                            handleUpdateItem(item.key, "nombreArticulo", e.target.value);
                            handleUpdateItem(item.key, "showDropdown", true);
                          }}
                          placeholder="Escriba el nombre o código..."
                          className="w-full bg-transparent focus:outline-none text-xs text-slate-700 font-medium"
                        />
                        {item.productoId && (
                          <span className="text-[9px] font-extrabold text-brand-teal bg-brand-teal/10 px-1 py-0.5 rounded">
                            {item.unidad}
                          </span>
                        )}
                      </div>
                      
                      {/* Dropdown de autocompletado */}
                      {item.showDropdown && item.nombreArticulo.length > 2 && (
                        <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl z-20 overflow-hidden divide-y divide-slate-50">
                          {filteredProducts.map(prod => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleSelectProduct(item.key, prod)}
                              className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700">{prod.nombre}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">{prod.codigo}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {prod.unidad || "UND"}
                              </span>
                            </button>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div className="p-3 text-[10px] text-slate-400 italic text-center">
                              No se encontraron productos coincidentes. Puedes escribir libremente.
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.key, "showDropdown", false)}
                            className="w-full text-center bg-slate-50 py-1.5 text-[9px] text-slate-500 font-semibold uppercase hover:bg-slate-100"
                          >
                            Cerrar Sugerencias
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Proveedor 1 Prices */}
                    <td className="py-3 px-2 border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        value={item.precioUnitario1}
                        onChange={(e) => handleUpdateItem(item.key, "precioUnitario1", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-right font-semibold text-slate-700 focus:outline-none focus:border-brand-teal"
                      />
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-right font-bold text-slate-700">
                      ${totalItem1.toLocaleString("es-CL")}
                    </td>

                    {/* Proveedor 2 Prices */}
                    <td className="py-3 px-2 border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        value={item.precioUnitario2}
                        onChange={(e) => handleUpdateItem(item.key, "precioUnitario2", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-right font-semibold text-slate-700 focus:outline-none focus:border-brand-teal"
                      />
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-right font-bold text-slate-700">
                      ${totalItem2.toLocaleString("es-CL")}
                    </td>

                    {/* Proveedor 3 Prices */}
                    <td className="py-3 px-2 border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        value={item.precioUnitario3}
                        onChange={(e) => handleUpdateItem(item.key, "precioUnitario3", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-right font-semibold text-slate-700 focus:outline-none focus:border-brand-teal"
                      />
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 text-right font-bold text-slate-700">
                      ${totalItem3.toLocaleString("es-CL")}
                    </td>

                    {/* Histórico */}
                    <td className="py-3 px-4 border-l border-slate-200 text-right font-semibold text-amber-700 bg-amber-50/10">
                      {item.ultimoPrecio ? `$${item.ultimoPrecio.toLocaleString("es-CL")}` : "-"}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 font-medium text-amber-800 bg-amber-50/10 max-w-[120px] truncate" title={item.ultimoProveedor}>
                      {item.ultimoProveedor || "-"}
                    </td>

                    {/* Eliminar Fila */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.key)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors disabled:opacity-30"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Totales Block */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-700 text-xs">
                <td className="py-4 px-6 text-center" colSpan={3}>TOTAL NETO</td>
                <td className="py-4 px-4 text-right" colSpan={2}>${totals.p1.neto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 text-right" colSpan={2}>${totals.p2.neto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 text-right" colSpan={2}>${totals.p3.neto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 bg-amber-50/10 border-x border-slate-200" colSpan={2}></td>
                <td></td>
              </tr>
              <tr className="bg-slate-50 font-semibold text-slate-500 text-xs">
                <td className="py-3 px-6 text-center" colSpan={3}>IVA (19%)</td>
                <td className="py-3 px-4 text-right" colSpan={2}>${totals.p1.iva.toLocaleString("es-CL")}</td>
                <td className="py-3 px-4 text-right" colSpan={2}>${totals.p2.iva.toLocaleString("es-CL")}</td>
                <td className="py-3 px-4 text-right" colSpan={2}>${totals.p3.iva.toLocaleString("es-CL")}</td>
                <td className="py-3 px-4 bg-amber-50/10 border-x border-slate-200" colSpan={2}></td>
                <td></td>
              </tr>
              <tr className="bg-brand-teal/5 font-extrabold text-slate-900 border-t border-slate-200 text-xs">
                <td className="py-4 px-6 text-center text-brand-teal" colSpan={3}>TOTAL BRUTO</td>
                <td className="py-4 px-4 text-right text-brand-teal" colSpan={2}>${totals.p1.bruto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 text-right" colSpan={2}>${totals.p2.bruto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 text-right" colSpan={2}>${totals.p3.bruto.toLocaleString("es-CL")}</td>
                <td className="py-4 px-4 bg-amber-50/10 border-x border-slate-200" colSpan={2}></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjudication selection and observations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Adjudicación */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Adjudicación de la Orden</h3>
            <p className="text-[10px] text-slate-400">Seleccione cuál de las 3 cotizaciones será la ganadora.</p>
          </div>
          
          <div className="space-y-2.5">
            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              ganador === 1 ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-100 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ganador"
                  checked={ganador === 1}
                  onChange={() => setGanador(1)}
                  className="w-4 h-4 text-brand-teal focus:ring-brand-teal border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">{proveedor1 || "Proveedor 1"}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">${totals.p1.bruto.toLocaleString("es-CL")} Bruto</span>
            </label>

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              ganador === 2 ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-100 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ganador"
                  checked={ganador === 2}
                  onChange={() => setGanador(2)}
                  className="w-4 h-4 text-brand-teal focus:ring-brand-teal border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">{proveedor2 || "Proveedor 2"}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">${totals.p2.bruto.toLocaleString("es-CL")} Bruto</span>
            </label>

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              ganador === 3 ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-100 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ganador"
                  checked={ganador === 3}
                  onChange={() => setGanador(3)}
                  className="w-4 h-4 text-brand-teal focus:ring-brand-teal border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">{proveedor3 || "Proveedor 3"}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">${totals.p3.bruto.toLocaleString("es-CL")} Bruto</span>
            </label>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Orden de Compra</span>
            <span className="text-lg font-black text-brand-teal">${totalOrden.toLocaleString("es-CL")}</span>
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observaciones y Justificación</label>
            <textarea
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Indique las justificaciones de la adjudicación..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-teal resize-none"
            />
          </div>

          {/* Firmas Preview */}
          <div className="border border-dashed border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aprobaciones del Documento</div>
            <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-500 font-semibold text-center">
              <div className="bg-white p-2 rounded border border-slate-100 space-y-1">
                <span className="block text-slate-400">Adquisiciones</span>
                <span className="block text-slate-700 font-bold">Andrea Palma</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100 space-y-1">
                <span className="block text-slate-400">Admin y Finanzas</span>
                <span className="block text-slate-700 font-bold">Alejandro V.</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-100 space-y-1">
                <span className="block text-slate-400">Dir. Ejecutiva</span>
                <span className="block text-slate-700 font-bold">Teresa C.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
