'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export interface DocumentItemInput {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  esAfecto: boolean;    // true: 19% IVA, false: Exento (0%)
  incluyeIva: boolean;  // si el precioUnitario ingresado incluye IVA
  subtotal: number;
  bodegaId: string;
  ubicacionId?: string;
}

export interface CreateDocumentInput {
  categoria: 'COMPRA' | 'OTRO';
  tipoDocumento: 'FACTURA' | 'GUIA_DESPACHO';
  numeroDocumento: string;
  fechaDocumento: string;
  rutProveedor: string;
  razonSocialProveedor?: string;
  montoTotal: number; // Total con IVA incluido
  esRecepcionIncompleta: boolean;
  observaciones?: string;
  items: DocumentItemInput[];
}

/**
 * Utility to parse HTML date string (YYYY-MM-DD) into local Date
 * preventing 1-day backward timezone shift (UTC-4 / UTC-3).
 */
function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  
  // Extraer fecha seleccionada y adjuntar la hora/minuto actual para preservar el orden cronológico del día
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return new Date(`${dateStr}T${hours}:${minutes}:${seconds}`);
}

export async function createDocumentoMovimiento(input: CreateDocumentInput) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const user = session ? await verifyJWT(session) : null;

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    // Verify user ID exists in DB to prevent foreign key failure
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    const validUserId = dbUser ? dbUser.id : (await prisma.user.findFirst())?.id;

    if (!validUserId) {
      return { success: false, error: 'No existe un usuario activo para registrar el movimiento.' };
    }

    if (!input.numeroDocumento || !input.numeroDocumento.trim()) {
      return { success: false, error: 'El número de documento es obligatorio.' };
    }

    if (!input.rutProveedor || !input.rutProveedor.trim()) {
      return { success: false, error: 'El RUT del proveedor es obligatorio.' };
    }

    if (!input.fechaDocumento || isNaN(Date.parse(input.fechaDocumento))) {
      return { success: false, error: 'Por favor ingresa una fecha de emisión válida.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos un producto al desglose.' };
    }

    const { getUserPermissions } = await import("@/lib/permissions");
    const permissions = await getUserPermissions();
    if (permissions?.isFiltered) {
      for (const item of input.items) {
        if (item.bodegaId && !permissions.bodegasIds.includes(item.bodegaId)) {
          return { success: false, error: 'No tienes permisos para registrar movimientos en una o más de las bodegas seleccionadas.' };
        }
      }
    }

    // 1. Proveedor lookup or auto-creation
    const cleanRut = input.rutProveedor.trim().toUpperCase();
    let proveedor = await prisma.proveedor.findUnique({
      where: { rut: cleanRut },
    });

    if (!proveedor) {
      proveedor = await prisma.proveedor.create({
        data: {
          rut: cleanRut,
          razonSocial: input.razonSocialProveedor?.trim() || `PROVEEDOR ${cleanRut}`,
        },
      });
    }

    // 2. Check for duplicate document (proveedor + tipoDocumento + numeroDocumento)
    const existingDoc = await prisma.documentoMovimiento.findFirst({
      where: {
        proveedorId: proveedor.id,
        tipoDocumento: input.tipoDocumento,
        numeroDocumento: input.numeroDocumento.trim(),
      },
    });

    if (existingDoc) {
      const tipoLabel = input.tipoDocumento === 'FACTURA' ? 'Factura' : 'Guía de Despacho';
      return { 
        success: false, 
        error: `Ya existe una ${tipoLabel} N° "${input.numeroDocumento.trim()}" registrada para el proveedor ${proveedor.razonSocial} (${cleanRut}). No se permiten documentos duplicados.` 
      };
    }

    // 3. Determine initial Concatenation & Reconciliation State
    let estadoConciliacion = 'CUADRADO';
    if (input.tipoDocumento === 'GUIA_DESPACHO') {
      estadoConciliacion = 'PENDIENTE_FACTURA';
    } else if (input.tipoDocumento === 'FACTURA' && input.esRecepcionIncompleta) {
      estadoConciliacion = 'REQUIERE_NOTA_CREDITO';
    }

    // 4. Find default TipoMovimiento for Compra
    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { esEntrada: true },
    });

    if (!tipoMov) {
      return { success: false, error: 'No se encontró un tipo de movimiento de entrada configurado.' };
    }

    const docDate = parseLocalDate(input.fechaDocumento);

    // 5. DB Transaction: Create Header, Items, Movimientos, and Update Physical Stock & Costs
    await prisma.$transaction(async (tx) => {
      // Create Header
      const docHeader = await tx.documentoMovimiento.create({
        data: {
          categoria: input.categoria,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim(),
          fechaDocumento: docDate,
          proveedorId: proveedor.id,
          montoTotal: input.montoTotal,
          estadoConciliacion,
          esRecepcionIncompleta: input.esRecepcionIncompleta,
          observaciones: input.observaciones || null,
        },
      });

      // Fetch Empresa configuration for PPP (Neto vs Con IVA)
      const { getConfiguracionEmpresa } = await import('@/lib/empresaConfig');
      const empresaConfig = await getConfiguracionEmpresa();
      const pppConsideraIva = empresaConfig.pppIncluyeIva;

      // Regla General de Cuadratura: Ajustar diferencia residual (±$1 o ±$2 pesos) en el ítem de mayor valor
      const itemsPrepared = input.items.map(it => ({
        ...it,
        subtotal: Math.round(it.subtotal)
      }));
      const sumaCalculada = itemsPrepared.reduce((acc, it) => acc + it.subtotal, 0);
      const difResidual = Math.round(input.montoTotal) - sumaCalculada;

      if (itemsPrepared.length > 0 && Math.abs(difResidual) > 0 && Math.abs(difResidual) <= 3) {
        // Encontrar el ítem de mayor subtotal y asignarle la diferencia para que la suma sea exactamente igual al montoTotal
        let maxItem = itemsPrepared[0];
        for (const it of itemsPrepared) {
          if (it.subtotal > maxItem.subtotal) {
            maxItem = it;
          }
        }
        maxItem.subtotal += difResidual;
      }

      // Process each item
      for (const item of itemsPrepared) {
        // Calculate unit price for inventory valuation (PPP)
        let valorUnitarioValuacion = item.precioUnitario;

        if (pppConsideraIva) {
          // El PPP considera el IVA: Si el precio ingresado era neto afecto, se le suma el 19%
          if (item.esAfecto && !item.incluyeIva) {
            valorUnitarioValuacion = item.precioUnitario * 1.19;
          }
        } else {
          // El PPP NO considera el IVA (Valor Neto): Si venía con IVA, se le descuenta el 19%
          if (item.esAfecto && item.incluyeIva) {
            valorUnitarioValuacion = item.precioUnitario / 1.19;
          }
        }

        // Preserve exact decimal precision for valuation and stock unit value
        const valorUnitarioFinal = valorUnitarioValuacion;

        // Resolve or fallback Ubicacion if not explicitly set
        let finalUbicacionId = item.ubicacionId;
        if (!finalUbicacionId && item.bodegaId) {
          const defaultUbi = await tx.ubicacion.findFirst({
            where: { bodegaId: item.bodegaId },
            orderBy: { nombre: 'asc' },
          });
          if (defaultUbi) {
            finalUbicacionId = defaultUbi.id;
          } else {
            const newDefault = await tx.ubicacion.create({
              data: {
                nombre: 'General / Principal',
                bodegaId: item.bodegaId,
              },
            });
            finalUbicacionId = newDefault.id;
          }
        }

        // Create Item line in Document
        await tx.documentoMovimientoItem.create({
          data: {
            documentoMovimientoId: docHeader.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            esAfecto: item.esAfecto,
            incluyeIva: item.incluyeIva,
            subtotal: item.subtotal,
            bodegaId: item.bodegaId || null,
            ubicacionId: finalUbicacionId || null,
          },
        });

        // Create individual Movement audit log
        await tx.movimiento.create({
          data: {
            fecha: docDate,
            productoId: item.productoId,
            tipoMovimientoId: tipoMov.id,
            cantidad: item.cantidad,
            valorUnitario: valorUnitarioFinal,
            pppCalculado: valorUnitarioFinal,
            bodegaId: item.bodegaId || null,
            ubicacionId: finalUbicacionId || null,
            proveedorId: proveedor.id,
            usuarioId: validUserId,
            documentoTipo: input.tipoDocumento,
            documentoNumero: input.numeroDocumento.trim(),
            documentoMovimientoId: docHeader.id,
          },
        });

        // Increment physical stock in specific location
        if (item.bodegaId && finalUbicacionId) {
          await tx.stock.upsert({
            where: {
              productoId_bodegaId_ubicacionId: {
                productoId: item.productoId,
                bodegaId: item.bodegaId,
                ubicacionId: finalUbicacionId,
              },
            },
            update: {
              cantidad: { increment: item.cantidad },
            },
            create: {
              productoId: item.productoId,
              bodegaId: item.bodegaId,
              ubicacionId: finalUbicacionId,
              cantidad: item.cantidad,
            },
          });
        }
      }

      // Chronological PPP Recalculation:
      // Recalculate historical and current PPP based on full chronological movement history
      const { recalcularPPPProducto } = await import('@/lib/kardex');
      const uniqueProductIds = Array.from(new Set(input.items.map(it => it.productoId)));
      for (const prodId of uniqueProductIds) {
        await recalcularPPPProducto(tx, prodId);
      }
    });

    revalidatePath('/movimientos');
    revalidatePath('/productos');
    revalidatePath('/novedades/kardex');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating documento movimiento:', error);
    return { success: false, error: error.message || 'Error interno al registrar el movimiento.' };
  }
}

export async function engancharFacturaAGuia(docId: string, numeroFactura: string, fechaFactura: string) {
  try {
    if (!numeroFactura || !numeroFactura.trim()) {
      return { success: false, error: 'El número de factura es obligatorio.' };
    }

    if (!fechaFactura || isNaN(Date.parse(fechaFactura))) {
      return { success: false, error: 'Por favor ingresa una fecha de factura válida.' };
    }

    const doc = await prisma.documentoMovimiento.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return { success: false, error: 'Documento no encontrado.' };
    }

    await prisma.documentoMovimiento.update({
      where: { id: docId },
      data: {
        facturaEnganchadaNumero: numeroFactura.trim(),
        facturaEnganchadaFecha: parseLocalDate(fechaFactura),
        estadoConciliacion: 'CUADRADO',
      },
    });

    revalidatePath('/movimientos');
    return { success: true };
  } catch (error: any) {
    console.error('Error enganchando factura:', error);
    return { success: false, error: error.message || 'Error al enganchar la factura.' };
  }
}

export interface GuardarDesgloseFacturaInput {
  documentoId: string;
  items: DocumentItemInput[];
}

export async function guardarDesgloseFactura(input: GuardarDesgloseFacturaInput) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const user = session ? await verifyJWT(session) : null;

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    const validUserId = dbUser ? dbUser.id : (await prisma.user.findFirst())?.id;

    if (!validUserId) {
      return { success: false, error: 'No existe un usuario activo para registrar los movimientos.' };
    }

    const doc = await prisma.documentoMovimiento.findUnique({
      where: { id: input.documentoId },
      include: {
        proveedor: true,
        items: true,
        movimientos: true,
      },
    });

    if (!doc) {
      return { success: false, error: 'Documento / Factura no encontrada.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos un producto al desglose.' };
    }

    const { getUserPermissions } = await import('@/lib/permissions');
    const permissions = await getUserPermissions();
    if (permissions?.isFiltered) {
      for (const item of input.items) {
        if (item.bodegaId && !permissions.bodegasIds.includes(item.bodegaId)) {
          return { success: false, error: 'No tienes permisos para registrar movimientos en una o más de las bodegas seleccionadas.' };
        }
      }
    }

    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { esEntrada: true },
    });

    if (!tipoMov) {
      return { success: false, error: 'No se encontró un tipo de movimiento de entrada configurado.' };
    }

    const { getConfiguracionEmpresa } = await import('@/lib/empresaConfig');
    const empresaConfig = await getConfiguracionEmpresa();
    const pppConsideraIva = empresaConfig.pppIncluyeIva;

    // Ajuste residual centavos/pesos si la diferencia con el total de la factura es pequeña (±$3)
    const itemsPrepared = input.items.map(it => ({
      ...it,
      subtotal: Math.round(it.subtotal)
    }));
    const sumaCalculada = itemsPrepared.reduce((acc, it) => acc + it.subtotal, 0);
    const difResidual = Math.round(doc.montoTotal) - sumaCalculada;

    if (itemsPrepared.length > 0 && Math.abs(difResidual) > 0 && Math.abs(difResidual) <= 3) {
      let maxItem = itemsPrepared[0];
      for (const it of itemsPrepared) {
        if (it.subtotal > maxItem.subtotal) {
          maxItem = it;
        }
      }
      maxItem.subtotal += difResidual;
    }

    // Identificar productos afectados previos y nuevos para recalcular Kardex
    const previousProductIds = doc.items.map(it => it.productoId);
    const newProductIds = input.items.map(it => it.productoId);
    const allTouchedProductIds = Array.from(new Set([...previousProductIds, ...newProductIds]));

    await prisma.$transaction(async (tx) => {
      // 1. Revertir stock de ítems previos si existían
      for (const oldItem of doc.items) {
        if (oldItem.bodegaId && oldItem.ubicacionId) {
          await tx.stock.updateMany({
            where: {
              productoId: oldItem.productoId,
              bodegaId: oldItem.bodegaId,
              ubicacionId: oldItem.ubicacionId,
            },
            data: {
              cantidad: { decrement: oldItem.cantidad },
            },
          });
        }
      }

      // 2. Eliminar ítems previos y movimientos previos ligados a este doc
      await tx.documentoMovimientoItem.deleteMany({
        where: { documentoMovimientoId: doc.id },
      });

      await tx.movimiento.deleteMany({
        where: { documentoMovimientoId: doc.id },
      });

      // 3. Crear nuevos DocumentoMovimientoItem y Movimientos, e incrementar stock
      for (const item of itemsPrepared) {
        let valorUnitarioValuacion = item.precioUnitario;
        if (pppConsideraIva) {
          if (item.esAfecto && !item.incluyeIva) {
            valorUnitarioValuacion = item.precioUnitario * 1.19;
          }
        } else {
          if (item.esAfecto && item.incluyeIva) {
            valorUnitarioValuacion = item.precioUnitario / 1.19;
          }
        }
        const valorUnitarioFinal = valorUnitarioValuacion;

        let finalUbicacionId = item.ubicacionId;
        if (!finalUbicacionId && item.bodegaId) {
          const defaultUbi = await tx.ubicacion.findFirst({
            where: { bodegaId: item.bodegaId },
            orderBy: { nombre: 'asc' },
          });
          if (defaultUbi) {
            finalUbicacionId = defaultUbi.id;
          } else {
            const newDefault = await tx.ubicacion.create({
              data: {
                nombre: 'General / Principal',
                bodegaId: item.bodegaId,
              },
            });
            finalUbicacionId = newDefault.id;
          }
        }

        // Crear item en la factura
        await tx.documentoMovimientoItem.create({
          data: {
            documentoMovimientoId: doc.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            esAfecto: item.esAfecto,
            incluyeIva: item.incluyeIva,
            subtotal: item.subtotal,
            bodegaId: item.bodegaId || null,
            ubicacionId: finalUbicacionId || null,
          },
        });

        // Crear auditoría en Movimiento
        await tx.movimiento.create({
          data: {
            fecha: doc.fechaDocumento,
            productoId: item.productoId,
            tipoMovimientoId: tipoMov.id,
            cantidad: item.cantidad,
            valorUnitario: valorUnitarioFinal,
            pppCalculado: valorUnitarioFinal,
            bodegaId: item.bodegaId || null,
            ubicacionId: finalUbicacionId || null,
            proveedorId: doc.proveedorId,
            usuarioId: validUserId,
            documentoTipo: doc.tipoDocumento,
            documentoNumero: doc.numeroDocumento,
            documentoMovimientoId: doc.id,
          },
        });

        // Incrementar stock físico
        if (item.bodegaId && finalUbicacionId) {
          await tx.stock.upsert({
            where: {
              productoId_bodegaId_ubicacionId: {
                productoId: item.productoId,
                bodegaId: item.bodegaId,
                ubicacionId: finalUbicacionId,
              },
            },
            update: {
              cantidad: { increment: item.cantidad },
            },
            create: {
              productoId: item.productoId,
              bodegaId: item.bodegaId,
              ubicacionId: finalUbicacionId,
              cantidad: item.cantidad,
            },
          });
        }
      }

      // Actualizar estado de conciliación
      const nuevaSuma = itemsPrepared.reduce((acc, it) => acc + it.subtotal, 0);
      const cuadraExacto = Math.abs(Math.round(doc.montoTotal) - nuevaSuma) === 0;

      await tx.documentoMovimiento.update({
        where: { id: doc.id },
        data: {
          estadoConciliacion: cuadraExacto ? 'CUADRADO' : 'PENDIENTE_CONCILIACION',
        },
      });

      // Recalcular PPP para todos los productos afectados
      const { recalcularPPPProducto } = await import('@/lib/kardex');
      for (const prodId of allTouchedProductIds) {
        await recalcularPPPProducto(tx, prodId);
      }
    });

    revalidatePath('/movimientos');
    revalidatePath('/productos');
    revalidatePath('/novedades/kardex');
    return { success: true };
  } catch (error: any) {
    console.error('Error guardando desglose de factura:', error);
    return { success: false, error: error.message || 'Error al guardar el desglose de la factura.' };
  }
}
