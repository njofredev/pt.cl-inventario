require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetDatabase() {
  console.log('--- INICIANDO LIMPIEZA / REINICIO DE BASE DE DATOS ---');

  // 1. Eliminar movimientos
  const deletedMovimientos = await prisma.movimiento.deleteMany({});
  console.log(`✓ Movimientos eliminados: ${deletedMovimientos.count}`);

  // 2. Eliminar items de documentos y documentos de compra/guías
  const deletedDocItems = await prisma.documentoMovimientoItem.deleteMany({});
  console.log(`✓ Items de documentos eliminados: ${deletedDocItems.count}`);

  const deletedDocs = await prisma.documentoMovimiento.deleteMany({});
  console.log(`✓ Documentos de movimiento eliminados: ${deletedDocs.count}`);

  // 3. Eliminar solicitudes de materiales y sus items
  const deletedSolItems = await prisma.solicitudItem.deleteMany({});
  console.log(`✓ Items de solicitudes eliminados: ${deletedSolItems.count}`);

  const deletedSolicitudes = await prisma.solicitud.deleteMany({});
  console.log(`✓ Solicitudes de materiales eliminadas: ${deletedSolicitudes.count}`);

  // 4. Reiniciar stock físico en 0
  const updatedStocks = await prisma.stock.updateMany({
    data: {
      cantidad: 0
    }
  });
  console.log(`✓ Registros de Stock reiniciados a 0: ${updatedStocks.count}`);

  // 5. Reiniciar PPP y costoNeto de los productos a 0
  const updatedProducts = await prisma.product.updateMany({
    data: {
      ppp: 0.0,
      costoNeto: 0.0
    }
  });
  console.log(`✓ Productos reiniciados con PPP = 0 y Costo = 0: ${updatedProducts.count}`);

  console.log('--- REINICIO COMPLETADO CON ÉXITO ---');
}

resetDatabase()
  .catch((err) => {
    console.error('Error al reiniciar base de datos:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
