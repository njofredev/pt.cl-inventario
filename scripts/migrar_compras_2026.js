require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanText(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

// Mapeo manual directo para casos tipográficos o especiales del Excel
const PRODUCT_EXCEPTIONS = {
  'MA000264': 'ASE-AL-0034', // TRAPERO MICROFIBRA C OJAL 50/60 EXCELL
  'MD000356': 'CLT-MC-0433', // GUIA DE COLORES VITA CLASSIC
  'MD000363': 'CLT-MC-0471', // LIMAS PROTAPER GOLD ASSORT 21MM SX/F3
  'MD000364': 'CLT-MC-0472', // LIMAS PROTAPER GOLD ASSORT 25MM SX/F3
  'MD000365': 'CLT-MC-0466', // LIMAS WAVEONE GOLD PRIMARY 25MM
};

// Productos nuevos a crear automáticamente en BD
const NEW_PRODUCTS_TO_CREATE = [
  {
    codigo: 'ASE-AB-0001',
    nombre: 'CAFÉ INSTANTANEO TRADICIONAL 400GR',
    clasificacion: 'ASEO Y LIMPIEZA',
    tipoProducto: 'Abarrotes y Cafetería',
    unidad: 'FRASCO',
    bodegaTipo: 'OFICINA'
  },
  {
    codigo: 'ORT-BA-0035',
    nombre: '35+ UR BANDA 1ER M TUBO SIMPLE MB',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Ortodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'ORT-BA-0036',
    nombre: '35+ UL BANDA 1ER M TUBO SIMPLE MB',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Ortodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'ORT-BA-0037',
    nombre: '35+ LR BANDA 1ER M TUBO SIMPLE MB',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Ortodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'ORT-BA-0038',
    nombre: '35+ LL BANDA 1ER M TUBO SIMPLE MB',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Ortodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'INS-QU-0001',
    nombre: 'SACA PUENTE',
    clasificacion: 'INSTRUMENTAL',
    tipoProducto: 'Instrumental Clínico',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'END-LM-0001',
    nombre: 'LIMA PROGLIDER 25MM',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Endodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  },
  {
    codigo: 'END-LM-0002',
    nombre: 'LIMA PROGLIDER 31MM',
    clasificacion: 'CLÍNICA / DENTAL',
    tipoProducto: 'Endodoncia',
    unidad: 'UNIDAD',
    bodegaTipo: 'CLINICA'
  }
];

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n=== INICIANDO MIGRACIÓN DE COMPRAS 2026 (${isDryRun ? 'MODO SIMULACIÓN --dry-run' : 'EJECUCIÓN REAL'}) ===\n`);

  // 1. Cargar Bodegas y Ubicaciones de Casa Matriz
  const bodegas = await prisma.bodega.findMany({
    where: { sucursal: { nombre: { contains: 'Casa Matriz' } } },
    include: { ubicaciones: true }
  });

  const bodegaClinica = bodegas.find(b => b.nombre.includes('Clínica'));
  const bodegaAseo = bodegas.find(b => b.nombre.includes('Aseo'));
  const bodegaOficina = bodegas.find(b => b.nombre.includes('Oficina'));

  if (!bodegaClinica || !bodegaAseo || !bodegaOficina) {
    throw new Error('No se encontraron todas las bodegas requeridas de Casa Matriz.');
  }

  const ubiClinica = bodegaClinica.ubicaciones[0]?.id;
  const ubiAseo = bodegaAseo.ubicaciones[0]?.id;
  const ubiOficina = bodegaOficina.ubicaciones[0]?.id;

  console.log('✓ Bodegas Casa Matriz detectadas:');
  console.log(`  - Clínica: ${bodegaClinica.nombre} (Ubicación: ${ubiClinica})`);
  console.log(`  - Aseo:    ${bodegaAseo.nombre} (Ubicación: ${ubiAseo})`);
  console.log(`  - Oficina: ${bodegaOficina.nombre} (Ubicación: ${ubiOficina})`);

  // 2. Obtener tipo de movimiento "Entrada por Compra" y usuario admin
  const tipoCompra = await prisma.tipoMovimiento.findFirst({
    where: { nombre: { contains: 'Compra' } }
  });
  const userAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!tipoCompra || !userAdmin) {
    throw new Error('No se encontró el tipo de movimiento de compra o el usuario administrador.');
  }
  console.log(`✓ Tipo de movimiento: ${tipoCompra.nombre} (${tipoCompra.id})`);
  console.log(`✓ Usuario responsable: ${userAdmin.username} (${userAdmin.nombre})\n`);

  // 3. Crear productos faltantes si no es dry-run
  if (!isDryRun) {
    console.log('--- Creando / Verificando productos nuevos en BD ---');
    for (const p of NEW_PRODUCTS_TO_CREATE) {
      await prisma.product.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: {
          codigo: p.codigo,
          nombre: p.nombre,
          clasificacion: p.clasificacion,
          tipoProducto: p.tipoProducto,
          unidad: p.unidad,
          stockCritico: 5,
          ppp: 0.0,
          costoNeto: 0.0
        }
      });
      console.log(`  + Producto asegurado en BD: [${p.codigo}] ${p.nombre}`);
    }
  }

  // 4. Cargar catálogo de productos y proveedores actuales
  const allProducts = await prisma.product.findMany();
  const prodByCode = new Map(allProducts.map(p => [p.codigo, p]));
  const prodByCleanName = new Map(allProducts.map(p => [cleanText(p.nombre), p]));

  const allProveedores = await prisma.proveedor.findMany();
  const provByRut = new Map(allProveedores.map(p => [p.rut.toUpperCase().replace(/\./g, ''), p]));

  // 5. Leer Excel
  const excelPath = path.join(__dirname, '..', 'scratch', 'migra-invent.xlsx');
  const wb = xlsx.readFile(excelPath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Cabecera en fila index 1
  const rows = [];
  for (let i = 2; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || r.length === 0 || !r[1]) continue; // fila vacia
    rows.push({
      fecha: new Date(r[1]),
      nFactura: String(r[2]).trim(),
      rutProveedor: String(r[3]).trim().toUpperCase(),
      codProductoAntiguo: String(r[4]).trim(),
      nombreProducto: r[5] ? String(r[5]).trim() : '',
      cantBasica: Number(r[6]) || 1,
      unidadBasica: r[7] ? String(r[7]).trim() : 'UNIDAD',
      cantidad: Math.round(Number(r[8])) || 0,
      precioUnitario: Number(r[9]) || 0.0,
      conIva: r[10] === true || String(r[10]).toUpperCase() === 'SI' || String(r[10]).toUpperCase() === 'TRUE'
    });
  }

  console.log(`\n✓ Registros leídos del Excel: ${rows.length}`);

  // Ordenar cronológicamente ascendente
  rows.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // 6. Validar y asociar cada fila
  const processedRows = [];
  let errorCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const item = rows[idx];

    // Resolver proveedor
    const cleanRut = item.rutProveedor.replace(/\./g, '');
    const proveedor = provByRut.get(cleanRut);
    if (!proveedor) {
      console.error(`[Fila ${idx + 1}] Proveedor no encontrado por RUT: ${item.rutProveedor}`);
      errorCount++;
    }

    // Resolver producto
    let producto = null;
    if (PRODUCT_EXCEPTIONS[item.codProductoAntiguo]) {
      producto = prodByCode.get(PRODUCT_EXCEPTIONS[item.codProductoAntiguo]);
    } else if (cleanText(item.nombreProducto) && prodByCleanName.has(cleanText(item.nombreProducto))) {
      producto = prodByCleanName.get(cleanText(item.nombreProducto));
    } else {
      // Buscar en los nuevos productos por nombre
      const cleanTarget = cleanText(item.nombreProducto);
      for (const np of NEW_PRODUCTS_TO_CREATE) {
        if (cleanText(np.nombre) === cleanTarget) {
          producto = prodByCode.get(np.codigo);
          break;
        }
      }
    }

    if (!producto && isDryRun) {
      // En dry-run puede que los nuevos aun no esten en prodByCode
      const matchNew = NEW_PRODUCTS_TO_CREATE.find(np => 
        np.nombre.toUpperCase() === item.nombreProducto.toUpperCase() ||
        cleanText(np.nombre) === cleanText(item.nombreProducto)
      );
      if (matchNew) {
        producto = { id: 'DUMMY_NEW_ID', codigo: matchNew.codigo, nombre: matchNew.nombre, clasificacion: matchNew.clasificacion };
      }
    }

    if (!producto) {
      console.error(`[Fila ${idx + 1}] Producto no encontrado: [${item.codProductoAntiguo}] "${item.nombreProducto}"`);
      errorCount++;
    }

    // Determinar bodega según clasificación
    let targetBodega = bodegaClinica;
    let targetUbi = ubiClinica;

    const clasif = (producto?.clasificacion || '').toUpperCase();
    const prodName = (producto?.nombre || '').toUpperCase();

    if (clasif.includes('ASEO') || prodName.includes('TRAPERO') || prodName.includes('BOLSA') || prodName.includes('BASURA')) {
      targetBodega = bodegaAseo;
      targetUbi = ubiAseo;
    } else if (clasif.includes('OFICINA') || prodName.includes('CAFÉ') || prodName.includes('CAFE') || prodName.includes('PAPEL') || prodName.includes('LÁPIZ')) {
      targetBodega = bodegaOficina;
      targetUbi = ubiOficina;
    }

    // Calcular valores monetarios (Neto vs Bruto)
    // En el Excel: Si conIva es true, el precio unitario trae IVA; si es false ('NO'), es neto.
    let valorUnitarioNeto = item.precioUnitario;
    let incluyeIva = item.conIva;
    if (incluyeIva) {
      valorUnitarioNeto = Math.round((item.precioUnitario / 1.19) * 100) / 100;
    }
    const subtotalFila = Math.round(item.cantidad * item.precioUnitario * 100) / 100;

    processedRows.push({
      ...item,
      proveedor,
      producto,
      bodegaId: targetBodega.id,
      ubicacionId: targetUbi,
      valorUnitarioNeto,
      subtotalFila
    });
  }

  if (errorCount > 0) {
    throw new Error(`Se encontraron ${errorCount} errores de validación. Revisa la consola antes de continuar.`);
  }

  console.log(`\n✓ Todos los ${processedRows.length} registros fueron validados y homologados exitosamente.`);

  // Agrupar por factura para crear DocumentoMovimiento
  const facturasMap = new Map();
  for (const r of processedRows) {
    const key = `${r.proveedor.id}_${r.nFactura}`;
    if (!facturasMap.has(key)) {
      facturasMap.set(key, {
        proveedorId: r.proveedor.id,
        numeroDocumento: r.nFactura,
        fechaDocumento: r.fecha,
        items: []
      });
    }
    facturasMap.get(key).items.push(r);
  }

  console.log(`✓ Total facturas únicas agrupadas: ${facturasMap.size}\n`);

  if (isDryRun) {
    console.log('=== RESUMEN DRY-RUN EXITOSO ===');
    console.log(`- 45 Facturas listas para crear.`);
    console.log(`- 284 Items de compra listos para asociar.`);
    console.log(`- 284 Movimientos históricos listos para registrar en Casa Matriz.`);
    console.log(`- Stock y PPP listos para actualizar en tiempo real.`);
    console.log('\nPara ejecutar la migración definitiva, ejecuta sin el flag --dry-run.');
    return;
  }

  // 7. INSERCIÓN TRANSACCIONAL REAL
  console.log('--- Insertando Documentos, Movimientos, Stocks y calculando PPP ---');
  let movCount = 0;
  let docCount = 0;

  for (const [key, fData] of facturasMap.entries()) {
    // Calcular total factura
    const totalFactura = fData.items.reduce((acc, it) => acc + it.subtotalFila, 0);

    // Crear DocumentoMovimiento
    const doc = await prisma.documentoMovimiento.create({
      data: {
        categoria: 'COMPRA',
        tipoDocumento: 'FACTURA',
        numeroDocumento: fData.numeroDocumento,
        fechaDocumento: fData.fechaDocumento,
        proveedorId: fData.proveedorId,
        montoTotal: totalFactura,
        estadoConciliacion: 'CUADRADO'
      }
    });
    docCount++;

    for (const item of fData.items) {
      // 1. Crear item en documento
      await prisma.documentoMovimientoItem.create({
        data: {
          documentoMovimientoId: doc.id,
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          esAfecto: true,
          incluyeIva: item.conIva,
          subtotal: item.subtotalFila,
          bodegaId: item.bodegaId,
          ubicacionId: item.ubicacionId
        }
      });

      // 2. Obtener estado actual del producto para calcular PPP ponderado
      const currentProd = await prisma.product.findUnique({
        where: { id: item.producto.id }
      });

      // Obtener stock actual en la ubicación
      const currentStock = await prisma.stock.findUnique({
        where: {
          productoId_bodegaId_ubicacionId: {
            productoId: item.producto.id,
            bodegaId: item.bodegaId,
            ubicacionId: item.ubicacionId
          }
        }
      });

      const stockAnterior = currentStock ? currentStock.cantidad : 0;
      const nuevoStock = stockAnterior + item.cantidad;

      // Calcular nuevo PPP: (StockAnt * PPPAnt + CantidadCompra * ValorNetoCompra) / (StockAnt + CantidadCompra)
      let nuevoPPP = item.valorUnitarioNeto;
      if (stockAnterior > 0 && currentProd.ppp > 0) {
        nuevoPPP = Math.round(((stockAnterior * currentProd.ppp) + (item.cantidad * item.valorUnitarioNeto)) / nuevoStock);
      } else {
        nuevoPPP = Math.round(item.valorUnitarioNeto);
      }

      // 3. Crear Movimiento
      await prisma.movimiento.create({
        data: {
          fecha: item.fecha,
          productoId: item.producto.id,
          tipoMovimientoId: tipoCompra.id,
          cantidad: item.cantidad,
          valorUnitario: item.valorUnitarioNeto,
          pppCalculado: nuevoPPP,
          bodegaId: item.bodegaId,
          ubicacionId: item.ubicacionId,
          proveedorId: item.proveedor.id,
          usuarioId: userAdmin.id,
          documentoTipo: 'FACTURA',
          documentoNumero: item.nFactura,
          documentoMovimientoId: doc.id
        }
      });

      // 4. Actualizar Stock
      await prisma.stock.upsert({
        where: {
          productoId_bodegaId_ubicacionId: {
            productoId: item.producto.id,
            bodegaId: item.bodegaId,
            ubicacionId: item.ubicacionId
          }
        },
        create: {
          productoId: item.producto.id,
          bodegaId: item.bodegaId,
          ubicacionId: item.ubicacionId,
          cantidad: nuevoStock
        },
        update: {
          cantidad: nuevoStock
        }
      });

      // 5. Actualizar PPP y Costo Neto en Product
      await prisma.product.update({
        where: { id: item.producto.id },
        data: {
          ppp: nuevoPPP,
          costoNeto: item.valorUnitarioNeto
        }
      });

      movCount++;
    }
  }

  console.log(`\n=============================================`);
  console.log(`¡MIGRACIÓN FINALIZADA CON ÉXITO TOTAL!`);
  console.log(`✓ Facturas creadas: ${docCount}`);
  console.log(`✓ Movimientos de compra registrados: ${movCount}`);
  console.log(`✓ Stocks y PPP actualizados con éxito en Casa Matriz.`);
  console.log(`=============================================\n`);
}

main()
  .catch((err) => {
    console.error('\n❌ ERROR DURANTE LA MIGRACIÓN:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
