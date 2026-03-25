from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/maestros",
    tags=["Maestros"]
)

# --- Sucursales ---
@router.post("/sucursales/", response_model=schemas.Sucursal)
def crear_sucursal(sucursal: schemas.SucursalCreate, db: Session = Depends(get_db)):
    db_sucursal = models.Sucursal(**sucursal.model_dump())
    db.add(db_sucursal)
    db.commit()
    db.refresh(db_sucursal)
    return db_sucursal

@router.get("/sucursales/", response_model=List[schemas.Sucursal])
def listar_sucursales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Sucursal).offset(skip).limit(limit).all()

@router.put("/sucursales/{sucursal_id}", response_model=schemas.Sucursal)
def actualizar_sucursal(sucursal_id: int, sucursal: schemas.SucursalCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Sucursal).filter(models.Sucursal.id == sucursal_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    for key, value in sucursal.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Bodegas ---
@router.post("/bodegas/", response_model=schemas.Bodega)
def crear_bodega(bodega: schemas.BodegaCreate, db: Session = Depends(get_db)):
    db_bodega = models.Bodega(**bodega.model_dump())
    db.add(db_bodega)
    db.commit()
    db.refresh(db_bodega)
    return db_bodega

@router.get("/bodegas/", response_model=List[schemas.Bodega])
def listar_bodegas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Bodega).offset(skip).limit(limit).all()

@router.put("/bodegas/{bodega_id}", response_model=schemas.Bodega)
def actualizar_bodega(bodega_id: int, bodega: schemas.BodegaCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Bodega).filter(models.Bodega.id == bodega_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    for key, value in bodega.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Ubicaciones ---
@router.post("/ubicaciones/", response_model=schemas.Ubicacion)
def crear_ubicacion(ubicacion: schemas.UbicacionCreate, db: Session = Depends(get_db)):
    db_ubic = models.Ubicacion(**ubicacion.model_dump())
    db.add(db_ubic)
    db.commit()
    db.refresh(db_ubic)
    return db_ubic

@router.get("/ubicaciones/", response_model=List[schemas.Ubicacion])
def listar_ubicaciones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Ubicacion).offset(skip).limit(limit).all()

@router.put("/ubicaciones/{ubicacion_id}", response_model=schemas.Ubicacion)
def actualizar_ubicacion(ubicacion_id: int, ubicacion: schemas.UbicacionCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Ubicacion).filter(models.Ubicacion.id == ubicacion_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")
    for key, value in ubicacion.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Proveedores ---
@router.post("/proveedores/", response_model=schemas.Proveedor)
def crear_proveedor(proveedor: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    db_prov = models.Proveedor(**proveedor.model_dump())
    db.add(db_prov)
    db.commit()
    db.refresh(db_prov)
    return db_prov

@router.get("/proveedores/", response_model=List[schemas.Proveedor])
def listar_proveedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Proveedor).offset(skip).limit(limit).all()

@router.put("/proveedores/{proveedor_id}", response_model=schemas.Proveedor)
def actualizar_proveedor(proveedor_id: int, proveedor: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Proveedor).filter(models.Proveedor.id == proveedor_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for key, value in proveedor.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Cuentas Contables (Simplificado: Clase + Descripción + Código) ---
@router.post("/cuentas_contables/", response_model=schemas.CuentaContable)
def crear_cuenta(cuenta: schemas.CuentaContableCreate, db: Session = Depends(get_db)):
    db_cuenta = models.CuentaContable(**cuenta.model_dump())
    db.add(db_cuenta)
    db.commit()
    db.refresh(db_cuenta)
    return db_cuenta

@router.get("/cuentas_contables/", response_model=List[schemas.CuentaContable])
def listar_cuentas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.CuentaContable).offset(skip).limit(limit).all()

@router.put("/cuentas_contables/{cuenta_id}", response_model=schemas.CuentaContable)
def actualizar_cuenta(cuenta_id: int, cuenta: schemas.CuentaContableCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.CuentaContable).filter(models.CuentaContable.id == cuenta_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    for key, value in cuenta.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Centros de Costo ---
@router.post("/centros_costos/", response_model=schemas.CentroCosto)
def crear_centro(centro: schemas.CentroCostoCreate, db: Session = Depends(get_db)):
    db_centro = models.CentroCosto(**centro.model_dump())
    db.add(db_centro)
    db.commit()
    db.refresh(db_centro)
    return db_centro

@router.get("/centros_costos/", response_model=List[schemas.CentroCosto])
def listar_centros(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.CentroCosto).offset(skip).limit(limit).all()

@router.put("/centros_costos/{centro_id}", response_model=schemas.CentroCosto)
def actualizar_centro(centro_id: int, centro: schemas.CentroCostoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.CentroCosto).filter(models.CentroCosto.id == centro_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Centro de costo no encontrado")
    for key, value in centro.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Productos ---
@router.post("/productos/", response_model=schemas.Producto)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    db_prod = models.Producto(**producto.model_dump())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.get("/productos/", response_model=List[schemas.Producto])
def listar_productos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Producto).offset(skip).limit(limit).all()

@router.put("/productos/{producto_id}", response_model=schemas.Producto)
def actualizar_producto(producto_id: int, producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in producto.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj
