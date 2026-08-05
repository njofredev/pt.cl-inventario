require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Iniciando Seeding de Sucursales y Bodegas Oficiales ---');

  // 1. Asegurar exactamente las 2 Sucursales oficiales
  const sucursalCasaMatriz = await prisma.sucursal.upsert({
    where: { nombre: 'Sucursal Casa Matriz' },
    update: {},
    create: { nombre: 'Sucursal Casa Matriz' },
  });

  const sucursalVitacura = await prisma.sucursal.upsert({
    where: { nombre: 'Sucursal Vitacura' },
    update: {},
    create: { nombre: 'Sucursal Vitacura' },
  });

  console.log('Sucursales Oficiales:', [sucursalCasaMatriz.nombre, sucursalVitacura.nombre]);

  // 2. Lista de Bodegas Principales
  const bodegasAInsertar = [
    { nombre: 'Bodega Clínica (Vitacura)', sucursalId: sucursalVitacura.id },
    { nombre: 'Bodega Clínica (Casa Matriz)', sucursalId: sucursalCasaMatriz.id },
    { nombre: 'Bodega Aseo (Vita)', sucursalId: sucursalVitacura.id },
    { nombre: 'Bodega Aseo (Casa Matriz)', sucursalId: sucursalCasaMatriz.id },
    { nombre: 'Bodega Oficina (Vita)', sucursalId: sucursalVitacura.id },
    { nombre: 'Bodega Oficina (Casa Matriz)', sucursalId: sucursalCasaMatriz.id },
    { nombre: 'Bodega TI (Vita)', sucursalId: sucursalVitacura.id },
    { nombre: 'Bodega TI (Casa Matriz)', sucursalId: sucursalCasaMatriz.id },
  ];

  let creadas = 0;
  for (const item of bodegasAInsertar) {
    const existe = await prisma.bodega.findFirst({
      where: {
        nombre: item.nombre,
      },
    });

    if (!existe) {
      await prisma.bodega.create({
        data: item,
      });
      creadas++;
      console.log(`+ Creada bodega: ${item.nombre}`);
    } else {
      await prisma.bodega.update({
        where: { id: existe.id },
        data: { sucursalId: item.sucursalId },
      });
      console.log(`= Actualizada bodega: ${item.nombre}`);
    }
  }

  console.log(`=== Seeding de bodegas finalizado. ===`);
}

main()
  .catch((e) => {
    console.error('Error durante seeding de bodegas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
