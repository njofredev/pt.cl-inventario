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
  CreditCard,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { createProveedor, updateProveedorAction } from './actions';

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
  const [editingSupplier, setEditingSupplier] = useState<ProveedorItem | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Form Fields
  const [rut, setRut] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [condicionPago, setCondicionPago] = useState('30 Días');

  // Dynamic Multi-Entry Fields
  const [contactos, setContactos] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);
  const [telefonos, setTelefonos] = useState<string[]>(['']);
  const [direcciones, setDirecciones] = useState<string[]>(['']);

  const normSearch = removeAccents(search.trim());
  const filteredSuppliers = search.trim()
    ? suppliers.filter(s =>
        removeAccents(s.razonSocial).includes(normSearch) ||
        removeAccents(s.rut).includes(normSearch) ||
        (s.contacto && removeAccents(s.contacto).includes(normSearch)) ||
        (s.email && removeAccents(s.email).includes(normSearch))
      )
    : suppliers;

  function handleOpenCreate() {
    setEditingSupplier(null);
    setRut('');
    setRazonSocial('');
    setCondicionPago('30 Días');
    setContactos(['']);
    setEmails(['']);
    setTelefonos(['']);
    setDirecciones(['']);
    setStatus(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(supplier: ProveedorItem) {
    setEditingSupplier(supplier);
    setRut(supplier.rut || '');
    setRazonSocial(supplier.razonSocial || '');
    setCondicionPago(supplier.condicionPago || '30 Días');

    // Parse multi-entries
    setContactos(supplier.contacto ? supplier.contacto.split('\n').filter(Boolean) : ['']);
    setEmails(supplier.email ? supplier.email.split(',').map(e => e.trim()).filter(Boolean) : ['']);
    setTelefonos(supplier.telefono ? supplier.telefono.split(',').map(t => t.trim()).filter(Boolean) : ['']);
    setDirecciones(supplier.direccion ? supplier.direccion.split('\n').filter(Boolean) : ['']);

    setStatus(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rut.trim() || !razonSocial.trim()) {
      setStatus({ success: false, message: 'El RUT y la Razón Social son obligatorios.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const joinedContactos = contactos.map(c => c.trim()).filter(Boolean).join('\n');
    const joinedEmails = emails.map(e => e.trim()).filter(Boolean).join(', ');
    const joinedTelefonos = telefonos.map(t => t.trim()).filter(Boolean).join(', ');
    const joinedDirecciones = direcciones.map(d => d.trim()).filter(Boolean).join('\n');

    const formData = new FormData();
    formData.append('rut', rut.trim());
    formData.append('razonSocial', razonSocial.trim());
    formData.append('contacto', joinedContactos);
    formData.append('email', joinedEmails);
    formData.append('telefono', joinedTelefonos);
    formData.append('direccion', joinedDirecciones);
    formData.append('condicionPago', condicionPago.trim());

    let res;
    if (editingSupplier) {
      res = await updateProveedorAction(editingSupplier.id, formData);
    } else {
      res = await createProveedor(formData);
    }

    setLoading(false);

    if (res.success) {
      setStatus({ 
        success: true, 
        message: editingSupplier 
          ? `Proveedor ${razonSocial} actualizado exitosamente.` 
          : `Proveedor ${razonSocial} registrado exitosamente.` 
      });

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
            placeholder="Buscar por RUT, Razón Social, Contacto o Email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
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
          {filteredSuppliers.map((supplier) => {
            const contactosList = supplier.contacto ? supplier.contacto.split('\n').filter(Boolean) : [];
            const emailsList = supplier.email ? supplier.email.split(',').map(e => e.trim()).filter(Boolean) : [];
            const telefonosList = supplier.telefono ? supplier.telefono.split(',').map(t => t.trim()).filter(Boolean) : [];
            const direccionesList = supplier.direccion ? supplier.direccion.split('\n').filter(Boolean) : [];

            return (
              <div 
                key={supplier.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 hover:shadow-md transition-all group"
              >
                <div className="space-y-3.5">
                  {/* RUT & Edit Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      RUT: {supplier.rut}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(supplier)}
                      className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  {/* Company Name */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {supplier.razonSocial}
                    </h3>
                  </div>

                  {/* Direcciones / Sedes List */}
                  {direccionesList.length > 0 && (
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {direccionesList.map((dir, dIdx) => (
                        <p key={dIdx} className="flex items-start gap-1.5 leading-tight">
                          <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{dir}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Contact detail list */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {/* Contactos */}
                    {contactosList.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-slate-400" /> Contactos ({contactosList.length}):
                        </span>
                        {contactosList.map((c, cIdx) => (
                          <p key={cIdx} className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] pl-4">
                            • {c}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Emails */}
                    {emailsList.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-slate-400 text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" /> Correos ({emailsList.length}):
                        </span>
                        <div className="flex flex-wrap gap-1 pl-4">
                          {emailsList.map((em, eIdx) => (
                            <a 
                              key={eIdx}
                              href={`mailto:${em}`}
                              className="font-bold text-teal-600 dark:text-teal-400 hover:underline text-[10px] bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-800/50"
                            >
                              {em.toLowerCase()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Telefonos */}
                    {telefonosList.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-slate-400 text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" /> Teléfonos ({telefonosList.length}):
                        </span>
                        <div className="flex flex-wrap gap-1 pl-4">
                          {telefonosList.map((tel, tIdx) => (
                            <a 
                              key={tIdx}
                              href={`tel:${tel}`}
                              className="font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                            >
                              {tel}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {supplier.condicionPago && (
                      <div className="flex justify-between items-center text-[11px] pt-1">
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
            );
          })}
        </div>
      )}

      {/* Modal: Agregar / Editar Proveedor con Multi-Ingreso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {editingSupplier ? 'Editar Datos del Proveedor' : 'Agregar Nuevo Proveedor'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Ingresa múltiples contactos, correos, teléfonos y sedes del proveedor.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* RUT & Condicion Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* MULTI-CONTACTOS */}
              <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span>Contactos de la Empresa</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setContactos(prev => [...prev, ''])}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Agregar otro contacto</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {contactos.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContactos(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder={`Contacto #${idx + 1} (Ej. Juan Pérez - Ventas)`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {contactos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setContactos(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MULTI-EMAILS */}
              <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-teal-600" />
                    <span>Correos Electrónicos</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmails(prev => [...prev, ''])}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Agregar otro email</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {emails.map((em, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={em}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEmails(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder={`Correo #${idx + 1} (Ej. ventas@proveedor.cl)`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEmails(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MULTI-TELEFONOS */}
              <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    <span>Teléfonos de Contacto</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTelefonos(prev => [...prev, ''])}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Agregar otro teléfono</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {telefonos.map((tel, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTelefonos(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder={`Teléfono #${idx + 1} (Ej. +56 9 1234 5678)`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {telefonos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTelefonos(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MULTI-DIRECCIONES / SEDES */}
              <div className="space-y-2 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    <span>Direcciones / Sedes Registradas</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDirecciones(prev => [...prev, ''])}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Agregar otra dirección</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {direcciones.map((dir, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={dir}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDirecciones(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder={`Sede #${idx + 1} (Ej. Casa Matriz: Av. Vitacura 1234)`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {direcciones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDirecciones(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{editingSupplier ? 'Guardar Cambios' : 'Guardar Proveedor'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
