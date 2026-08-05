require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map Categories to Account codes and names
const CTA_MAPPING = {
  'ELEMENTOS DE PROTECCIÓN PERSONAL': { codigo: '1.1.05.03', nombre: 'Existencias Artículos Dentales' },
  'INSUMOS CLÍNICOS DENTALES': { codigo: '1.1.05.03', nombre: 'Existencias Artículos Dentales' },
  'INSUMOS CLÍNICOS TRANSVERSALES': { codigo: '1.1.05.05', nombre: 'Existencias Clínicas Transversales' },
  'INSUMOS DE ADMINISTRACIÓN Y OFICINA': { codigo: '1.1.05.02', nombre: 'Existencias Artículos de Oficina' },
  'INSUMOS DE ASEO Y DESINFECCIÓN': { codigo: '1.1.05.01', nombre: 'Existencias Aseo' },
  'INSUMOS DE ESTERILIZACIÓN': { codigo: '1.1.05.03', nombre: 'Existencias Artículos Dentales' },
  'INSUMOS DE FARMACIA Y MEDICAMENTOS': { codigo: '1.1.05.06', nombre: 'Existencias Fármacos y Medicamentos' }
};

async function main() {
  console.log("Iniciando migración de inventario...");

  // 1. Clear database tables
  console.log("Limpiando tablas dependientes y tabla Product...");
  await prisma.solicitudItem.deleteMany({});
  await prisma.cuadroComparativoItem.deleteMany({});
  await prisma.movimiento.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Tablas limpiadas con éxito.");

  // 2. Ensure all Cuentas Contables exist and fetch their IDs
  console.log("Verificando cuentas contables...");
  const cuentaCache = {}; // codigo -> id
  for (const [catName, ctaInfo] of Object.entries(CTA_MAPPING)) {
    let cta = await prisma.cuentaContable.findUnique({
      where: { codigo: ctaInfo.codigo }
    });
    if (!cta) {
      console.log(`Creando Cuenta Contable inexistente: ${ctaInfo.codigo} - ${ctaInfo.nombre}`);
      cta = await prisma.cuentaContable.create({
        data: {
          codigo: ctaInfo.codigo,
          nombre: ctaInfo.nombre
        }
      });
    }
    cuentaCache[catName] = cta.id;
  }
  console.log("Cuentas contables verificadas y listas.");

  // 3. Read JSON data
  const jsonPath = path.join(__dirname, '../scratch/productos_para_migrar.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: No se encontró el archivo JSON en: ${jsonPath}`);
    process.exit(1);
  }
  const productsRaw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Leídos ${productsRaw.length} productos del archivo JSON.`);

  // 4. Map records for Prisma insertion
  const productsData = productsRaw.map(p => {
    const cuentaContableId = cuentaCache[p.clasificacion] || null;
    return {
      codigo: p.codigo,
      nombre: p.nombre,
      clasificacion: p.clasificacion,
      tipoProducto: p.tipoProducto,
      unidad: p.unidad,
      ppp: p.ppp,
      costoNeto: p.costoNeto,
      stockCritico: p.stockCritico,
      cuentaContableId: cuentaContableId
    };
  });

  // 5. Bulk insert products
  console.log("Insertando productos en la base de datos...");
  const result = await prisma.product.createMany({
    data: productsData,
    skipDuplicates: true
  });
  console.log(`Se insertaron ${result.count} productos exitosamente.`);
}

main()
  .catch((e) => {
    console.error("Error durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
