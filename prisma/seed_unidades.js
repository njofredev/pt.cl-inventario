require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, '../scratch/opciones_columnas_I_K_M.txt');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const uniqueUnits = Array.from(new Set(lines));
  console.log(`Found ${uniqueUnits.length} unique units to seed.`);

  let createdCount = 0;
  for (const unidad of uniqueUnits) {
    await prisma.unidadMedida.upsert({
      where: { nombre: unidad },
      update: {},
      create: { nombre: unidad },
    });
    createdCount++;
  }

  console.log(`Successfully seeded ${createdCount} units into UnidadMedida.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
