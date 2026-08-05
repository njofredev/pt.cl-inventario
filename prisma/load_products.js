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

// Asignaciones fijas de cuentas contables basadas en los IDs consultados en la base de datos:
const CUENTAS = {
  CLINICOS: 'cmrtdhtwj0008uguwj2qfepg7', // Existencias Artículos Dentales
  ASEO: 'cmrtdhtw30006uguwn87upfgl',     // Existencias Aseo
  OFICINA: 'cmrtdhtwa0007uguwhny6d0h1',  // Existencias Artículos de Oficina
};

function getCuentaContableId(clasificacion) {
  const norm = clasificacion.toUpperCase();
  if (norm.includes('CLINICOS') || norm.includes('EPP') || norm.includes('ESTERILIZACION')) {
    return CUENTAS.CLINICOS;
  }
  if (norm.includes('ASEO') || norm.includes('DESINFECCION')) {
    return CUENTAS.ASEO;
  }
  if (norm.includes('ADMINISTRACION') || norm.includes('OFICINA')) {
    return CUENTAS.OFICINA;
  }
  return CUENTAS.CLINICOS; // fallback
}

async function main() {
  console.log("Iniciando carga de productos desde CSV...");
  
  const csvPath = path.join(__dirname, '../scratch/inventario_limpio.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: No se encontró el archivo en ${csvPath}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(csvPath, 'utf-8');
  if (content.startsWith('\uFEFF')) {
    content = content.slice(1);
  }
  const lines = content.split(/\r?\n/);
  
  // La primera línea contiene los headers: NUEVO_CODIGO;NUEVA_CLASIFICACION;NUEVO_TIPO;PRODUCTOS;UNIDAD;CANTIDAD;INGRESO
  const headers = lines[0].split(';');
  console.log(`Headers detectados: ${headers.join(', ')}`);
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Separar por punto y coma, manejando posibles comillas simples o dobles
    const cols = line.split(';').map(col => col.replace(/^"(.*)"$/, '$1').trim());
    if (cols.length < 4) {
      console.warn(`Línea ${i + 1} inválida, saltando: ${line}`);
      skipped++;
      continue;
    }
    
    const codigo = cols[0];
    const clasificacion = cols[1];
    const tipo = cols[2];
    const nombre = cols[3];
    const unidad = cols[4] || 'UND';
    
    if (!codigo || !nombre) {
      console.warn(`Línea ${i + 1} sin código o nombre, saltando.`);
      skipped++;
      continue;
    }
    
    const cuentaContableId = getCuentaContableId(clasificacion);
    
    try {
      // Usar upsert para evitar fallar por llave única duplicada si se ejecuta dos veces
      await prisma.product.upsert({
        where: { codigo: codigo },
        update: {
          nombre: nombre,
          unidad: unidad,
          cuentaContable: cuentaContableId ? { connect: { id: cuentaContableId } } : undefined,
          costoNeto: 0.0 // Garantizar valor 0.0
        },
        create: {
          codigo: codigo,
          nombre: nombre,
          unidad: unidad,
          cuentaContable: cuentaContableId ? { connect: { id: cuentaContableId } } : undefined,
          costoNeto: 0.0,
          ppp: 0.0,
          stockCritico: 0
        }
      });
      inserted++;
      if (inserted % 100 === 0) {
        console.log(`Progreso: ${inserted} productos procesados...`);
      }
    } catch (err) {
      console.error(`Error procesando producto ${codigo} (${nombre}):`, err.message);
      errors++;
    }
  }
  
  console.log("\n--- Resumen de Carga ---");
  console.log(`Productos insertados/actualizados: ${inserted}`);
  console.log(`Productos saltados: ${skipped}`);
  console.log(`Errores: ${errors}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
