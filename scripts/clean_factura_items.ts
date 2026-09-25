import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando limpieza de desgloses de facturas...');
  
  await prisma.$transaction(async (tx) => {
    // 1. Eliminar todos los ítems de las facturas/documentos
    const deletedItems = await tx.documentoMovimientoItem.deleteMany({});
    console.log(`DocumentoMovimientoItems eliminados: ${deletedItems.count}`);

    // 2. Eliminar movimientos asociados
    const deletedMovs = await tx.movimiento.deleteMany({});
    console.log(`Movimientos eliminados: ${deletedMovs.count}`);

    // 3. Resetear cantidades de stock físico a 0
    const resetStock = await tx.stock.updateMany({
      data: { cantidad: 0 }
    });
    console.log(`Registros de Stock reseteados a 0: ${resetStock.count}`);

    // 4. Resetear PPP y costo neto en productos
    const resetProducts = await tx.product.updateMany({
      data: { ppp: 0, costoNeto: 0 }
    });
    console.log(`Costos/PPP de productos reseteados: ${resetProducts.count}`);
  });

  const docsCount = await prisma.documentoMovimiento.count();
  const itemsCount = await prisma.documentoMovimientoItem.count();
  const totalStock = await prisma.stock.aggregate({ _sum: { cantidad: true } });

  console.log('--- ESTADO FINAL ---');
  console.log(`Facturas/Documentos preservados: ${docsCount}`);
  console.log(`Ítems en documentos: ${itemsCount}`);
  console.log(`Total Stock en bodegas: ${totalStock._sum.cantidad ?? 0}`);
}

main()
  .catch((e) => {
    console.error('Error al ejecutar limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
