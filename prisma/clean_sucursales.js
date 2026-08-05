require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Limpieza y Normalización de Sucursales ---');

  // 1. Crear/Asegurar las 2 Sucursales Oficiales
  const casaMatriz = await prisma.sucursal.upsert({
    where: { nombre: 'Sucursal Casa Matriz' },
    update: {},
    create: { nombre: 'Sucursal Casa Matriz' },
  });

  const vitacura = await prisma.sucursal.upsert({
    where: { nombre: 'Sucursal Vitacura' },
    update: {},
    create: { nombre: 'Sucursal Vitacura' },
  });

  console.log('Sucursales Oficiales creadas:', [casaMatriz.nombre, vitacura.nombre]);

  // 2. Re-asociar bodegas de sucursales antiguas a las 2 oficiales
  const todasSucursales = await prisma.sucursal.findMany({
    include: { bodegas: true, cuadros: true },
  });

  for (const s of todasSucursales) {
    if (s.id === casaMatriz.id || s.id === vitacura.id) continue;

    // Determinar destino (Vitacura vs Casa Matriz)
    const destSucursal = s.nombre.toLowerCase().includes('vitacura') ? vitacura : casaMatriz;

    console.log(`Re-asignando dependencias de "${s.nombre}" -> "${destSucursal.nombre}"...`);

    // Mover bodegas
    if (s.bodegas.length > 0) {
      await prisma.bodega.updateMany({
        where: { sucursalId: s.id },
        data: { sucursalId: destSucursal.id },
      });
    }

    // Mover cuadros
    if (s.cuadros.length > 0) {
      await prisma.cuadroComparativo.updateMany({
        where: { sucursalId: s.id },
        data: { sucursalId: destSucursal.id },
      });
    }

    // Eliminar sucursal obsoleta
    await prisma.sucursal.delete({
      where: { id: s.id },
    });
    console.log(`- Sucursal obsoleta eliminada: "${s.nombre}"`);
  }

  // 3. Normalizar nombres de las 8 bodegas principales
  const bodegasAjustadas = [
    { nombre: 'Bodega Clínica (Vitacura)', sucursalId: vitacura.id },
    { nombre: 'Bodega Clínica (Casa Matriz)', sucursalId: casaMatriz.id },
    { nombre: 'Bodega Aseo (Vitacura)', sucursalId: vitacura.id },
    { nombre: 'Bodega Aseo (Casa Matriz)', sucursalId: casaMatriz.id },
    { nombre: 'Bodega Oficina (Vitacura)', sucursalId: vitacura.id },
    { nombre: 'Bodega Oficina (Casa Matriz)', sucursalId: casaMatriz.id },
    { nombre: 'Bodega TI (Vitacura)', sucursalId: vitacura.id },
    { nombre: 'Bodega TI (Casa Matriz)', sucursalId: casaMatriz.id },
  ];

  // Actualizar o crear las bodegas de la lista
  for (const item of bodegasAjustadas) {
    const existe = await prisma.bodega.findFirst({
      where: {
        nombre: item.nombre,
      },
    });

    if (existe) {
      await prisma.bodega.update({
        where: { id: existe.id },
        data: {
          nombre: item.nombre,
          sucursalId: item.sucursalId,
        },
      });
    } else {
      await prisma.bodega.create({
        data: item,
      });
    }
  }

  // Si había bodegas antiguas con nombres "(Los Tribunales)", actualizarlas a "(Casa Matriz)"
  const bodegasTribunales = await prisma.bodega.findMany({
    where: {
      nombre: { contains: 'Tribunales', mode: 'insensitive' },
    },
  });

  for (const b of bodegasTribunales) {
    const nuevoNombre = b.nombre.replace(/Los Tribunales|Tribunales/gi, 'Casa Matriz').replace(/Tribu/gi, 'Casa Matriz');
    await prisma.bodega.update({
      where: { id: b.id },
      data: {
        nombre: nuevoNombre,
        sucursalId: casaMatriz.id,
      },
    });
  }

  const bodegasTribu = await prisma.bodega.findMany({
    where: {
      nombre: { contains: 'Tribu', mode: 'insensitive' },
    },
  });

  for (const b of bodegasTribu) {
    const nuevoNombre = b.nombre.replace(/Tribu/gi, 'Casa Matriz');
    await prisma.bodega.update({
      where: { id: b.id },
      data: {
        nombre: nuevoNombre,
        sucursalId: casaMatriz.id,
      },
    });
  }

  console.log('=== Limpieza completada exitosamente. ===');
}

main()
  .catch((e) => {
    console.error('Error durante la limpieza de sucursales:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
