from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

from auth_utils import get_current_user

router = APIRouter(
    prefix="/tipos",
    tags=["Configuración / Tipos de Movimiento"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=List[schemas.TipoMovimiento])
def listar_tipos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.TipoMovimiento).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.TipoMovimiento)
def crear_tipo(tipo: schemas.TipoMovimientoCreate, db: Session = Depends(get_db)):
    db_tipo = models.TipoMovimiento(**tipo.model_dump())
    db.add(db_tipo)
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

@router.put("/tipos/{tipo_id}", response_model=schemas.TipoMovimiento)
def actualizar_tipo(tipo_id: int, tipo: schemas.TipoMovimientoCreate, db: Session = Depends(get_db)):
    db_obj = db.query(models.TipoMovimiento).filter(models.TipoMovimiento.id == tipo_id).first()
    if not db_obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tipo de movimiento no encontrado")
    for key, value in tipo.model_dump().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj
