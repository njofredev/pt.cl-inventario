import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PrintTrigger from './PrintTrigger';

export const metadata = {
  title: 'Catálogo Maestro de Categorías y Tipos | Policlínico Tabancura',
  description: 'Documento oficial para impresión de las 7 categorías, tipos de insumos y estructura de codificación real de la Base de Datos.',
};

const CATEGORIAS_REALES = [
  {
    codigo: "CLD",
    nombre: "INSUMOS CLÍNICOS DENTALES",
    cuentaCodigo: "1.1.05.03",
    totalItems: 538,
    descripcion: "Materiales e instrumental especializado para odontología, ortodoncia, endodoncia y rehabilitación.",
    tipos: [
      { codigo: "OR", nombre: "Ortodoncia y Periodoncia", cant: 205, detalle: "Brackets, arcos, ligaduras, instrumental y accesorios ortodónticos" },
      { codigo: "FR", nombre: "Fresas y Piedras", cant: 142, detalle: "Fresas diamantadas, carburo de tungsteno, pulidores y piedras montadas" },
      { codigo: "MI", nombre: "Materiales de Impresión", cant: 64, detalle: "Siliconas de adición y condensación, alginatos, cubetas, yesos dentales" },
      { codigo: "MC", nombre: "Materiales Restauradores", cant: 49, detalle: "Resinas compuestas, ionómeros de vidrio, sistemas adhesivos, grabadores" },
      { codigo: "IO", nombre: "Instrumental Odontológico", cant: 25, detalle: "Espejos, exploradores, fórceps, curetas, espátulas de modelado" },
      { codigo: "AM", nombre: "Aislación y Matrices", cant: 19, detalle: "Diques de goma, clamps, portamatrices, bandas metálicas y cuñas" },
      { codigo: "EN", nombre: "Material de Endodoncia", cant: 18, detalle: "Limas manuales y rotatorias, conos de gutapercha, conos de papel, selladores" },
      { codigo: "LD", nombre: "Soluciones y Químicos Dentales", cant: 16, detalle: "Líquidos de profilaxis, desensibilizantes, barnices de flúor" }
    ]
  },
  {
    codigo: "CLT",
    nombre: "INSUMOS CLÍNICOS TRANSVERSALES",
    cuentaCodigo: "1.1.05.03",
    totalItems: 961,
    descripcion: "Insumos clínicos de uso común, curación, vías, apósitos y materiales consumibles generales.",
    tipos: [
      { codigo: "MC", nombre: "Misceláneos Clínicos General", cant: 855, detalle: "Rollos de algodón, eyectores, baberos, vasos plásticos, gasas, campos clínicos" },
      { codigo: "CH", nombre: "Curación, Heridas y Fisioterapia", cant: 42, detalle: "Apósitos, cintas micropore, compresas, vendas, apósitos de hidrocoloide" },
      { codigo: "VP", nombre: "Vías, Punción e Inyección", cant: 37, detalle: "Jeringas de distintas capacidades, agujas descartables, bránulas, mariposas" },
      { codigo: "IQ", nombre: "Instrumental y Diagnóstico Clínico", cant: 27, detalle: "Tijeras clínicas, pinzas quirúrgicas, mangos de bisturí, termómetros" }
    ]
  },
  {
    codigo: "ADM",
    nombre: "INSUMOS DE ADMINISTRACIÓN Y OFICINA",
    cuentaCodigo: "1.1.05.02",
    totalItems: 193,
    descripcion: "Papelería, útiles de escritorio y consumibles operativos para secretaría, fichas y soporte.",
    tipos: [
      { codigo: "AE", nombre: "Artículos de Escritorio", cant: 87, detalle: "Lápices, destacadores, corchetes, clips, tijeras, cintas adhesivas" },
      { codigo: "PO", nombre: "Papelería de Oficina", cant: 51, detalle: "Resmas de papel carta/oficio, talonarios de recetas, sobres, carpetas de fichas" },
      { codigo: "IG", nombre: "Insumos Electrónicos y Generales", cant: 30, detalle: "Pilas, cables, teclados, mouse, pendrives, extensiones eléctricas" },
      { codigo: "II", nombre: "Insumos de Impresión", cant: 15, detalle: "Tóner para impresoras láser monocromáticas y color, cartuchos de tinta" },
      { codigo: "HA", nombre: "Herramientas de Oficina", cant: 12, detalle: "Perforadoras, corcheteras de palanca, bandejas de documentos" }
    ]
  },
  {
    codigo: "ASE",
    nombre: "INSUMOS DE ASEO Y DESINFECCIÓN",
    cuentaCodigo: "1.1.05.01",
    totalItems: 140,
    descripcion: "Productos para higiene de instalaciones, desinfección de superficies y retiro normativo de desechos.",
    tipos: [
      { codigo: "DQ", nombre: "Detergentes y Químicos Desinfectantes", cant: 48, detalle: "Desinfectantes de nivel intermedio, amonio cuaternario, cloro, detergente enzimático" },
      { codigo: "AL", nombre: "Material de Limpieza Física", cant: 41, detalle: "Guantes de aseo doméstico, mopas, paños de microfibra, escobillones" },
      { codigo: "IM", nombre: "Manejo de Desechos / REAS", cant: 27, detalle: "Contenedores cortopunzantes, bolsas amarillas y rojas REAS, bolsas de basura" },
      { codigo: "PA", nombre: "Papelería de Aseo", cant: 24, detalle: "Papel toalla interdoblado en dispensador, papel higiénico institucional" }
    ]
  },
  {
    codigo: "EPP",
    nombre: "ELEMENTOS DE PROTECCIÓN PERSONAL",
    cuentaCodigo: "1.1.05.03",
    totalItems: 105,
    descripcion: "Equipamiento de barrera y bioseguridad para odontólogos, técnicos, enfermería y pacientes.",
    tipos: [
      { codigo: "PF", nombre: "Protección Ocular y Facial", cant: 65, detalle: "Escudos y pantallas faciales transparentes, antiparras de seguridad" },
      { codigo: "GU", nombre: "Guantes de Procedimiento", cant: 20, detalle: "Guantes de látex, nitrilo y vinilo (tallas XS, S, M, L)" },
      { codigo: "MR", nombre: "Mascarillas y Respiradores", cant: 11, detalle: "Mascarillas quirúrgicas de 3 pliegues con elástico, respiradores KN95 / N95" },
      { codigo: "RD", nombre: "Ropa Desechable", cant: 9, detalle: "Pecheras plásticas impermeables, cofias, delantales desechables, cubrezapatos" }
    ]
  },
  {
    codigo: "FAR",
    nombre: "INSUMOS DE FARMACIA Y MEDICAMENTOS",
    cuentaCodigo: "1.1.05.03",
    totalItems: 27,
    descripcion: "Fármacos, anestésicos locales dentales y soluciones de administración directa.",
    tipos: [
      { codigo: "MD", nombre: "Medicamentos Generales e Inyectables", cant: 23, detalle: "Antiinflamatorios, analgésicos, antibióticos y soluciones inyectables" },
      { codigo: "AN", nombre: "Anestesia Local y Carpul", cant: 2, detalle: "Tubos carpule anestésicos con y sin vasoconstrictor (Mepivacaína, Lidocaína)" }
    ]
  },
  {
    codigo: "EST",
    nombre: "INSUMOS DE ESTERILIZACIÓN",
    cuentaCodigo: "1.1.05.03",
    totalItems: 17,
    descripcion: "Materiales y controles de proceso para el ciclo de esterilizado por autoclave.",
    tipos: [
      { codigo: "EM", nombre: "Empaques y Mangas", cant: 15, detalle: "Rollos de papel mixto grado médico para termosellado, sobres autosellables" },
      { codigo: "IN", nombre: "Controles e Indicadores", cant: 2, detalle: "Tiras químicas integradoras Clase 5, cintas de control testigo y biológicos" }
    ]
  }
];

export default function ResumenCategoriasPDFPage() {
  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalInsumos = CATEGORIAS_REALES.reduce((acc, c) => acc + c.totalItems, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:text-black print:min-h-0">
      {/* Barra superior visible solo en pantalla (oculta al imprimir) */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-3.5 shadow-md flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/productos"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Productos
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Vista Previa Oficial de Impresión (7 Categorías • 1.981 Insumos DB)
          </span>
        </div>

        <PrintTrigger />
      </div>

      {/* Contenedor del documento A4 optimizado para imprimir */}
      <main id="catalogo-imprimible" className="max-w-[880px] mx-auto my-8 p-10 bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none print:m-0 print:p-0 print:max-w-none">
        {/* Encabezado del documento */}
        <header className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-mono tracking-widest font-extrabold text-[#162158] uppercase">
                Policlínico Tabancura — Sistema de Gestión de Inventario
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Catálogo Maestro: Categorías, Tipos y Codificación
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Estructura integral activa en Base de Datos: <strong>7 Categorías</strong> y <strong>31 Subtipos</strong> para un total de <strong>{totalInsumos.toLocaleString('es-CL')} insumos</strong> registrados.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 rounded-md font-mono text-[11px] font-black">
                DOC-REF-01 (V2.0)
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Emisión: {fechaHoy}</p>
            </div>
          </div>

          {/* Regla de codificación y resumen rápido */}
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wider">
                Fórmula de Código Maestro:
              </span>
              <div className="mt-1 font-mono font-bold text-[#162158] flex items-center gap-1.5">
                <span className="bg-white px-2 py-0.5 border border-slate-300 rounded shadow-2xs">
                  [CATEGORÍA 3 LETRAS]-[SUBTIPO 2 LETRAS]-[CORRELATIVO 4 DÍGITOS]
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 block mt-1">
                Ejemplos reales: <strong className="font-mono text-slate-700">CLD-MC-0197</strong>, <strong className="font-mono text-slate-700">CLT-CH-0012</strong>, <strong className="font-mono text-slate-700">FAR-AN-0001</strong>.
              </span>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 flex flex-col justify-center">
              <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider block">
                Resumen de existencias en catálogo:
              </span>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-700 flex-wrap">
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">CLD: 538</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">CLT: 961</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">ADM: 193</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">ASE: 140</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">EPP: 105</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">FAR: 27</span>
                <span className="bg-slate-200/70 px-2 py-0.5 rounded font-mono">EST: 17</span>
              </div>
            </div>
          </div>
        </header>

        {/* Listado de las 7 Categorías Reales */}
        <div className="space-y-6">
          {CATEGORIAS_REALES.map((cat) => (
            <section
              key={cat.codigo}
              className="border border-slate-300 rounded-xl overflow-hidden break-inside-avoid print:border-slate-400 shadow-2xs print:shadow-none"
            >
              {/* Cabecera de la categoría */}
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between print:bg-slate-900 print:text-white">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black bg-teal-500 text-slate-950 px-2.5 py-0.5 rounded">
                    {cat.codigo}
                  </span>
                  <h2 className="text-sm font-extrabold tracking-wide uppercase">
                    {cat.nombre}
                  </h2>
                  <span className="text-[11px] font-bold text-teal-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    {cat.totalItems} insumos en BD
                  </span>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-300">
                  Cuenta Contable: <span className="text-white font-bold">{cat.cuentaCodigo}</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 italic">
                {cat.descripcion}
              </div>

              {/* Tabla de Subtipos */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2 px-3 w-16 text-center font-mono">Subtipo</th>
                    <th className="py-2 px-3 w-64">Nombre del Subtipo</th>
                    <th className="py-2 px-3 w-20 text-center">Insumos</th>
                    <th className="py-2 px-3">Ejemplos / Insumos Comprendidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {cat.tipos.map((t) => (
                    <tr key={t.codigo} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#162158] bg-slate-50/50">
                        {t.codigo}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {t.nombre}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-semibold text-slate-600">
                        {t.cant}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {t.detalle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        {/* Pie de página oficial del PDF */}
        <footer className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <div>
            Policlínico Tabancura • Documento Oficial de Clasificación y Codificación de Inventario
          </div>
          <div>
            1.981 Insumos Auditados • Sistema PT Inventario
          </div>
        </footer>
      </main>
    </div>
  );
}
