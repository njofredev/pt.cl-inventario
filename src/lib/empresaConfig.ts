import { prisma } from "@/lib/prisma";

export interface EmpresaConfig {
  id: string;
  nombreEmpresa: string;
  rutEmpresa: string;
  pppIncluyeIva: boolean;
}

const DEFAULT_CONFIG: EmpresaConfig = {
  id: "DEFAULT",
  nombreEmpresa: "Policlínico Tabancura",
  rutEmpresa: "76.123.456-7",
  pppIncluyeIva: false, // Por defecto Neto (sin IVA)
};

/**
 * Obtiene la configuración de empresa activa desde la base de datos
 * Si la tabla aún no tiene fila, crea la por defecto.
 */
export async function getConfiguracionEmpresa(): Promise<EmpresaConfig> {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT "id", "nombreEmpresa", "rutEmpresa", "pppIncluyeIva"
      FROM "ConfiguracionEmpresa"
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      return {
        id: rows[0].id,
        nombreEmpresa: rows[0].nombreEmpresa || DEFAULT_CONFIG.nombreEmpresa,
        rutEmpresa: rows[0].rutEmpresa || DEFAULT_CONFIG.rutEmpresa,
        pppIncluyeIva: Boolean(rows[0].pppIncluyeIva),
      };
    }

    // Inicializar fila por defecto
    await prisma.$executeRaw`
      INSERT INTO "ConfiguracionEmpresa" ("id", "nombreEmpresa", "rutEmpresa", "pppIncluyeIva", "updatedAt", "createdAt")
      VALUES (${DEFAULT_CONFIG.id}, ${DEFAULT_CONFIG.nombreEmpresa}, ${DEFAULT_CONFIG.rutEmpresa}, ${DEFAULT_CONFIG.pppIncluyeIva}, NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING
    `;

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn("No se pudo leer ConfiguracionEmpresa, usando configuración por defecto:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Actualiza si el cálculo de PPP considera o no el IVA
 */
export async function updateConfiguracionPPP(pppIncluyeIva: boolean, nombreEmpresa?: string, rutEmpresa?: string) {
  const nombre = nombreEmpresa || DEFAULT_CONFIG.nombreEmpresa;
  const rut = rutEmpresa || DEFAULT_CONFIG.rutEmpresa;

  await prisma.$executeRaw`
    INSERT INTO "ConfiguracionEmpresa" ("id", "nombreEmpresa", "rutEmpresa", "pppIncluyeIva", "updatedAt", "createdAt")
    VALUES ('DEFAULT', ${nombre}, ${rut}, ${pppIncluyeIva}, NOW(), NOW())
    ON CONFLICT ("id") DO UPDATE
    SET "pppIncluyeIva" = ${pppIncluyeIva},
        "nombreEmpresa" = ${nombre},
        "rutEmpresa" = ${rut},
        "updatedAt" = NOW()
  `;
}
