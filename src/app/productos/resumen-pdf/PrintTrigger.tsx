'use client';

import { useState } from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';

export default function PrintTrigger() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    try {
      setDownloading(true);
      const element = document.getElementById('catalogo-imprimible');
      if (!element) {
        window.print();
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Catalogo_Categorias_y_Tipos_Tabancura.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span>{downloading ? 'Generando PDF...' : 'Descargar PDF Directo'}</span>
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
        title="Abrir vista de impresión nativa del sistema"
      >
        <Printer className="h-4 w-4 text-slate-300" />
        <span>Imprimir (Ctrl+P)</span>
      </button>
    </div>
  );
}

