'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  UserCheck, 
  Building2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { createProveedor } from './actions';

interface ProveedorItem {
  id: string;
  rut: string;
  razonSocial: string;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  condicionPago?: string | null;
}

interface Props {
  suppliers: ProveedorItem[];
  initialSearch: string;
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ProveedoresClient({ suppliers, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Form Fields
  const [rut, setRut] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [condicionPago, setCondicionPago] = useState('30 Días');

  const normSearch = removeAccents(search.trim());
  const filteredSuppliers = search.trim()
    ? suppliers.filter(s =>
        removeAccents(s.razonSocial).includes(normSearch) ||
        removeAccents(s.rut).includes(normSearch) ||
        (s.contacto && removeAccents(s.contacto).includes(normSearch))
      )
    : suppliers;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rut.trim() || !razonSocial.trim()) {
      setStatus({ success: false, message: 'El RUT y la Razón Social son obligatorios.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('rut', rut.trim());
    formData.append('razonSocial', razonSocial.trim());
    formData.append('contacto', contacto.trim());
    formData.append('email', email.trim());
    formData.append('telefono', telefono.trim());
    formData.append('direccion', direccion.trim());
    formData.append('condicionPago', condicionPago.trim());

    const res = await createProveedor(formData);
    setLoading(false);

    if (res.success) {
      setStatus({ success: true, message: `Proveedor ${razonSocial} creado exitosamente.` });
      setRut('');
      setRazonSocial('');
      setContacto('');
      setEmail('');
      setTelefono('');
      setDireccion('');
      setTimeout(() => {
        setIsModalOpen(false);
        setStatus(null);
      }, 1200);
    } else {
      setStatus({ success: false, message: res.error });
    }
  }

  return (
    <div className="space-y-5">
      {/* Action Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por RUT, Razón Social o Contacto..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setStatus(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#05b875]/20 transition-all active-scale-down cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          No se encontraron proveedores que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((supplier) => (
            <div 
              key={supplier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all group"
            >
              <div className="space-y-3.5">
                {/* RUT & Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    RUT: {supplier.rut}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="Activo"></span>
                </div>

                {/* Company Name */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {supplier.razonSocial}
                  </h3>
                  {supplier.direccion && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate flex items-center">
                      <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 mr-1 shrink-0" />
                      <span>{supplier.direccion}</span>
                    </p>
                  )}
                </div>

                {/* Contact detail list */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {supplier.contacto && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-slate-400" /> Contacto:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{supplier.contacto}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" /> E-mail:
                      </span>
                      <a 
                        href={`mailto:${supplier.email}`}
                        className="font-bold text-teal-600 dark:text-teal-400 hover:underline truncate max-w-[180px]"
                      >
                        {supplier.email.toLowerCase()}
                      </a>
                    </div>
                  )}
                  {supplier.telefono && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> Teléfono:
                      </span>
                      <a 
                        href={`tel:${supplier.telefono}`}
                        className="font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {supplier.telefono}
                      </a>
                    </div>
                  )}
                  {supplier.condicionPago && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-slate-400" /> Pago:
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        {supplier.condicionPago}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Agregar Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Agregar Nuevo Proveedor
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ingresa los datos comerciales del proveedor de insumos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* RUT */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    RUT Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="Ej. 76.123.456-7"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Condicion de Pago */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Condición de Pago
                  </label>
                  <select
                    value={condicionPago}
                    onChange={(e) => setCondicionPago(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="Contado">Contado</option>
                    <option value="15 Días">15 Días</option>
                    <option value="30 Días">30 Días</option>
                    <option value="60 Días">60 Días</option>
                  </select>
                </div>
              </div>

              {/* Razón Social */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej. Droguería Médica Tabancura SpA"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Contacto & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Contacto Principal
                  </label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ventas@proveedor.cl"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Telefono & Direccion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Dirección Comercial
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Av. Vitacura 1234, Santiago"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Feedback */}
              {status && (
                <div className={`p-3 text-xs font-bold rounded-xl border flex items-center gap-2 ${
                  status.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}>
                  {status.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                  <span>{status.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-[#05b875] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Guardar Proveedor</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
