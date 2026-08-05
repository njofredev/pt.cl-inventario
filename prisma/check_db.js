require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.product.count();
  console.log(`Total products in DB: ${total}`);

  const counts = await prisma.product.groupBy({
    by: ['clasificacion'],
    _count: {
      _all: true
    }
  });
  console.log("\nCounts by clasificacion in DB:");
  console.log(counts);

  const sample = await prisma.product.findMany({
    take: 5,
    select: {
      codigo: true,
      nombre: true,
      clasificacion: true,
      tipoProducto: true
    }
  });
  console.log("\nSample products:");
  console.log(sample);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
