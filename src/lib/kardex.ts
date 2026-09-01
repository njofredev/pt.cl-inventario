import { PrismaClient } from '@prisma/client';

/**
 * Recalculates the chronological Kardex / PPP history and current PPP for a product.
 * It sorts all movements strictly chronologically by `fecha` asc, `createdAt` asc.
 * 
 * - For Entry movements (esEntrada = true):
 *     If valorUnitario > 0:
 *       nuevoPPP = ( (stockPrevio * pppPrevio) + (cantEntrada * valorUnitario) ) / (stockPrevio + cantEntrada)
 *     Else:
 *       keeps pppPrevio
 *     stockActual = stockPrevio + cantEntrada
 * 
 * - For Exit movements (esEntrada = false):
 *     keeps pppPrevio (cost of goods sold is at current PPP)
 *     stockActual = max(0, stockPrevio - cantSalida)
 * 
 * Updates every Movimiento record with its exact `pppCalculado` at that point in time,
 * and updates `product.ppp` with the final resulting PPP.
 */
export async function recalcularPPPProducto(tx: PrismaClient | any, productoId: string) {
  // 1. Fetch all movements for this product ordered chronologically
  const movimientos = await tx.movimiento.findMany({
    where: { productoId },
    include: { tipoMovimiento: true },
    orderBy: [
      { fecha: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  if (movimientos.length === 0) {
    return;
  }

  let runningStock = 0;
  let runningPPP = 0;

  for (const mov of movimientos) {
    const isEntry = mov.tipoMovimiento?.esEntrada ?? true;
    const cant = mov.cantidad;
    const valorUnit = mov.valorUnitario || 0;

    if (isEntry) {
      if (valorUnit > 0) {
        const valorInventarioPrevio = runningStock * runningPPP;
        const valorNuevoIngreso = cant * valorUnit;
        const nuevoStock = runningStock + cant;
        
        if (nuevoStock > 0) {
          runningPPP = (valorInventarioPrevio + valorNuevoIngreso) / nuevoStock;
        } else {
          runningPPP = valorUnit;
        }
      }
      runningStock += cant;
    } else {
      // Exit movement
      runningStock = Math.max(0, runningStock - cant);
      // PPP does not change on exits
    }

    // Round PPP for audit tracking
    const pppPuntoEnTiempo = Math.round(runningPPP * 10000) / 10000;

    // Update the movement snapshot if different
    if (mov.pppCalculado !== pppPuntoEnTiempo) {
      await tx.movimiento.update({
        where: { id: mov.id },
        data: { pppCalculado: pppPuntoEnTiempo },
      });
    }
  }

  // Update Product's current official PPP
  const finalPPP = Math.round(runningPPP * 10000) / 10000;
  await tx.product.update({
    where: { id: productoId },
    data: {
      ppp: finalPPP,
    },
  });

  return finalPPP;
}
