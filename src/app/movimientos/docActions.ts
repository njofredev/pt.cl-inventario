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
  return new Date(`${dateStr}T12:00:00`);
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

      // Process each item
      for (const item of input.items) {
        // Calculate net unit price for inventory valuation (PPP)
        let valorUnitarioNeto = item.precioUnitario;
        if (item.esAfecto && item.incluyeIva) {
          valorUnitarioNeto = item.precioUnitario / 1.19;
        }

        // Round to 2 decimals for net unit price
        valorUnitarioNeto = Math.round(valorUnitarioNeto * 100) / 100;

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
            valorUnitario: valorUnitarioNeto,
            pppCalculado: valorUnitarioNeto,
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
