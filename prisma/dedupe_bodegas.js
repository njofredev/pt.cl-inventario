require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const bg = await prisma.bodega.findFirst({
    where: { nombre: 'Bodega General' },
    include: {
      _count: { select: { stocks: true, movimientos: true, ubicaciones: true } },
    },
  });

  if (bg) {
    console.log('Bodega General counts:', bg._count);
    if (bg._count.stocks === 0 && bg._count.movimientos === 0) {
      await prisma.bodega.delete({ where: { id: bg.id } });
      console.log('Bodega General eliminada ya que no poseía movimientos.');
    }
  }

  const finalBodegas = await prisma.bodega.findMany({
    include: { sucursal: true },
    orderBy: [{ sucursal: { nombre: 'asc' } }, { nombre: 'asc' }],
  });

  console.log(`Total Bodegas Oficiales (${finalBodegas.length}):`);
  finalBodegas.forEach((b, i) => {
    console.log(`${i + 1}. [${b.sucursal.nombre}] ${b.nombre}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
