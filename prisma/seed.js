require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // 1. Limpieza de datos en orden para evitar violación de llaves foráneas
  console.log("Limpiando datos existentes...");
  await prisma.solicitudItem.deleteMany({});
  await prisma.solicitud.deleteMany({});
  await prisma.movimiento.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.proveedor.deleteMany({});
  await prisma.centroCosto.deleteMany({});
  await prisma.ubicacion.deleteMany({});
  await prisma.bodega.deleteMany({});
  await prisma.sucursal.deleteMany({});
  await prisma.cuentaContable.deleteMany({});
  await prisma.tipoMovimiento.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Semilla de Usuarios con roles y contraseña 'admin123'
  console.log("Creando usuarios...");
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  const users = [
    { username: "njofre", password: hashedPassword, nombre: "Nicolás Jofré Andrade", role: "ADMIN", rut: "11111111-1", areaTrabajo: "Sistemas", cargo: "Administrador General" },
    { username: "avalenzuela", password: hashedPassword, nombre: "A. Valenzuela", role: "ADMIN", rut: "22222222-2", areaTrabajo: "Sistemas", cargo: "Administrador General" },
    { username: "jmarchant", password: hashedPassword, nombre: "J. Marchant", role: "OPERADOR", rut: "33333333-3", areaTrabajo: "Bodega", cargo: "Bodeguero Principal" },
    { username: "furbina", password: hashedPassword, nombre: "F. Urbina", role: "OPERADOR", rut: "44444444-4", areaTrabajo: "Bodega", cargo: "Auxiliar de Bodega" },
    { username: "fnilo", password: hashedPassword, nombre: "F. Nilo", role: "OPERADOR", rut: "55555555-5", areaTrabajo: "Bodega", cargo: "Auxiliar de Bodega" },
    { username: "apalma", password: hashedPassword, nombre: "A. Palma", role: "CONTABLE", rut: "66666666-6", areaTrabajo: "Contabilidad", cargo: "Analista Contable" },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log("Usuarios creados exitosamente.");

  // 3. Semilla de Cuentas Contables
  console.log("Creando cuentas contables...");
  const cuentasContables = [
    { codigo: "1.1.05.01", nombre: "Existencias Aseo" },
    { codigo: "1.1.05.02", nombre: "Existencias Artículos de Oficina" },
    { codigo: "1.1.05.03", nombre: "Existencias Artículos Dentales" },
    { codigo: "1.1.05.04", nombre: "Existencias Medicamentos" },
  ];
  for (const cc of cuentasContables) {
    await prisma.cuentaContable.create({ data: cc });
  }
  console.log("Cuentas contables creadas.");

  // 4. Semilla de Estructura Físico-Geográfica (Sucursal -> Bodega -> Ubicaciones)
  console.log("Creando estructura geográfica...");
  const sucursal = await prisma.sucursal.create({
    data: { nombre: "Policlínico Tabancura Sucursal Vitacura" }
  });
  
  await prisma.sucursal.create({
    data: { nombre: "Sucursal Casa Matríz" }
  });

  const bodega = await prisma.bodega.create({
    data: {
      nombre: "Bodega General",
      sucursalId: sucursal.id
    }
  });

  const ubicaciones = ["Estantería A", "Estantería B", "Refrigerador 1"];
  for (const u of ubicaciones) {
    await prisma.ubicacion.create({
      data: {
        nombre: u,
        bodegaId: bodega.id
      }
    });
  }
  console.log("Estructura geográfica creada.");

  // 5. Semilla de Centros de Costos
  console.log("Creando centros de costos...");
  const centrosCosto = [
    { codigo: "CC-001", nombre: "Box Dental" },
    { codigo: "CC-002", nombre: "Box Médico" },
    { codigo: "CC-003", nombre: "Urgencias" },
    { codigo: "CC-004", nombre: "Administración" },
  ];
  for (const cc of centrosCosto) {
    await prisma.centroCosto.create({ data: cc });
  }
  console.log("Centros de costo creados.");

  // 6. Semilla de Tipos de Movimiento
  console.log("Creando tipos de movimiento...");
  const tiposMovimiento = [
    { nombre: "Entrada por Compra", esEntrada: true },
    { nombre: "Entrada por Regalo", esEntrada: true },
    { nombre: "Ajuste de Entrada", esEntrada: true },
    { nombre: "Salida por Consumo", esEntrada: false },
    { nombre: "Dada de Baja", esEntrada: false },
    { nombre: "Ajuste de Salida", esEntrada: false },
  ];
  for (const tm of tiposMovimiento) {
    await prisma.tipoMovimiento.create({ data: tm });
  }
  console.log("Tipos de movimiento creados.");

  console.log("Seeding finished successfully.");
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
