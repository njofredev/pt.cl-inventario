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
  ubicacionId: string;
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

export async function createDocumentoMovimiento(input: CreateDocumentInput) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const user = session ? await verifyJWT(session) : null;

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' };
    }

    if (!input.numeroDocumento.trim()) {
      return { success: false, error: 'El número de documento es obligatorio.' };
    }

    if (!input.rutProveedor.trim()) {
      return { success: false, error: 'El RUT del proveedor es obligatorio.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos un producto al desglose.' };
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

    // 2. Determine initial Concatenation & Reconciliation State
    let estadoConciliacion = 'CUADRADO';
    if (input.tipoDocumento === 'GUIA_DESPACHO') {
      estadoConciliacion = 'PENDIENTE_FACTURA';
    } else if (input.tipoDocumento === 'FACTURA' && input.esRecepcionIncompleta) {
      estadoConciliacion = 'REQUIERE_NOTA_CREDITO';
    }

    // 3. Find default TipoMovimiento for Compra
    const tipoMov = await prisma.tipoMovimiento.findFirst({
      where: { esEntrada: true },
    });

    if (!tipoMov) {
      return { success: false, error: 'No se encontró un tipo de movimiento de entrada configurado.' };
    }

    // 4. DB Transaction: Create Header, Items, Movimientos, and Update Physical Stock
    await prisma.$transaction(async (tx) => {
      // Create Header
      const docHeader = await tx.documentoMovimiento.create({
        data: {
          categoria: input.categoria,
          tipoDocumento: input.tipoDocumento,
          numeroDocumento: input.numeroDocumento.trim(),
          fechaDocumento: new Date(input.fechaDocumento),
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
            bodegaId: item.bodegaId,
            ubicacionId: item.ubicacionId,
          },
        });

        // Create individual Movement audit log
        await tx.movimiento.create({
          data: {
            fecha: new Date(input.fechaDocumento),
            productoId: item.productoId,
            tipoMovimientoId: tipoMov.id,
            cantidad: item.cantidad,
            valorUnitario: valorUnitarioNeto,
            bodegaId: item.bodegaId,
            ubicacionId: item.ubicacionId,
            proveedorId: proveedor.id,
            usuarioId: user.userId,
            documentoTipo: input.tipoDocumento,
            documentoNumero: input.numeroDocumento.trim(),
            documentoMovimientoId: docHeader.id,
          },
        });

        // Increment physical stock in specific location
        await tx.stock.upsert({
          where: {
            productoId_bodegaId_ubicacionId: {
              productoId: item.productoId,
              bodegaId: item.bodegaId,
              ubicacionId: item.ubicacionId,
            },
          },
          update: {
            cantidad: { increment: item.cantidad },
          },
          create: {
            productoId: item.productoId,
            bodegaId: item.bodegaId,
            ubicacionId: item.ubicacionId,
            cantidad: item.cantidad,
          },
        });
      }
    });

    revalidatePath('/movimientos');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating documento movimiento:', error);
    return { success: false, error: error.message || 'Error interno al registrar el movimiento.' };
  }
}

export async function engancharFacturaAGuia(docId: string, numeroFactura: string, fechaFactura: string) {
  try {
    if (!numeroFactura.trim()) {
      return { success: false, error: 'El número de factura es obligatorio.' };
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
        facturaEnganchadaFecha: new Date(fechaFactura),
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
