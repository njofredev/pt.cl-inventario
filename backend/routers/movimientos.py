from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from decimal import Decimal

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/movimientos",
    tags=["Movimientos e Inventario"]
)

@router.post("/", response_model=schemas.MovimientoInventario)
def registrar_movimiento(mov: schemas.MovimientoInventarioCreate, db: Session = Depends(get_db)):
    # 1. Obtener Tipo de Movimiento
    tipo = db.query(models.TipoMovimiento).filter(models.TipoMovimiento.id == mov.tipo_movimiento_id).first()
    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de movimiento no encontrado")
        
    # 2. Obtener Producto
    producto = db.query(models.Producto).filter(models.Producto.id == mov.producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validaciones extras requeridas
    if tipo.requiere_proveedor and not mov.proveedor_id:
        raise HTTPException(status_code=400, detail="Este movimiento requiere indicar un proveedor.")
    if tipo.requiere_centro_costo and not mov.centro_costo_id:
        raise HTTPException(status_code=400, detail="Este movimiento requiere indicar un centro de costo.")

    # 3. Obtener Stock Global Actual del Producto
    stock_global_result = db.query(func.sum(models.SaldoInventario.cantidad)).filter(
        models.SaldoInventario.producto_id == mov.producto_id
    ).scalar()
    stock_global = Decimal(stock_global_result or 0.0)
    
    precio_unitario_aplicable = mov.precio_unitario

    # 4. Lógica Entradas y Salidas
    if tipo.multiplicador == 1:
        # ES UNA ENTRADA: Recalcular P.P.P.
        # Nuevo PPP = ((Stock Actual * PPP Actual) + (Cantidad Ingresada * Precio de Compra)) / (Stock Actual + Cantidad Ingresada)
        if (stock_global + mov.cantidad) > 0:
            numerador = (stock_global * producto.ppp_actual) + (mov.cantidad * mov.precio_unitario)
            denominador = stock_global + mov.cantidad
            nuevo_ppp = numerador / denominador
        else:
            nuevo_ppp = mov.precio_unitario
            
        producto.ppp_actual = round(nuevo_ppp, 2)
        
    elif tipo.multiplicador == -1:
        # ES UNA SALIDA: Verificar stock en la ubicación de origen específica.
        saldo_origen = db.query(models.SaldoInventario).filter(
            models.SaldoInventario.producto_id == mov.producto_id,
            models.SaldoInventario.ubicacion_id == mov.ubicacion_id
        ).first()
        
        stock_en_ubicacion = Decimal(saldo_origen.cantidad) if saldo_origen else Decimal(0)
        
        if stock_en_ubicacion < mov.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente en la ubicación indicada. Stock actual: {stock_en_ubicacion}")
            
        # El costo de la salida es estricto al P.P.P actual, ignoramos precio_unitario enviado
        precio_unitario_aplicable = producto.ppp_actual
        
    else:
        raise HTTPException(status_code=400, detail="Multiplicador inválido en el tipo de movimiento")

    # 5. Crear Movimiento
    valor_total = mov.cantidad * precio_unitario_aplicable
    nuevo_movimiento = models.MovimientoInventario(
        producto_id=mov.producto_id,
        ubicacion_id=mov.ubicacion_id,
        tipo_movimiento_id=mov.tipo_movimiento_id,
        cantidad=mov.cantidad,
        precio_unitario=precio_unitario_aplicable,
        valor_total=valor_total,
        proveedor_id=mov.proveedor_id,
        centro_costo_id=mov.centro_costo_id,
        referencia_documento=mov.referencia_documento,
        notas=mov.notas,
        creado_por=mov.creado_por
    )
    db.add(nuevo_movimiento)
    
    # 6. Actualizar Saldo por Ubicación específica
    saldo_ubicacion = db.query(models.SaldoInventario).filter(
        models.SaldoInventario.producto_id == mov.producto_id,
        models.SaldoInventario.ubicacion_id == mov.ubicacion_id
    ).first()
    
    variacion = mov.cantidad * tipo.multiplicador
    if saldo_ubicacion:
        saldo_ubicacion.cantidad += variacion
    else:
        # Si es el primer ingreso a esta ubicacion
        if variacion < 0:
            raise HTTPException(status_code=400, detail="Stock insuficiente.")
        saldo_ubicacion = models.SaldoInventario(
            producto_id=mov.producto_id,
            ubicacion_id=mov.ubicacion_id,
            cantidad=variacion
        )
        db.add(saldo_ubicacion)

    # Commitear toda la transaccion
    try:
        db.commit()
        db.refresh(nuevo_movimiento)
        return nuevo_movimiento
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en transacción: {e}")

@router.get("/", response_model=List[schemas.MovimientoInventario])
def listar_movimientos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.MovimientoInventario).order_by(models.MovimientoInventario.fecha_movimiento.desc()).offset(skip).limit(limit).all()

@router.get("/saldos", response_model=List[schemas.SaldoInventario])
def listar_saldos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.SaldoInventario).offset(skip).limit(limit).all()
