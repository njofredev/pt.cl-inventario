from fastapi import APIRouter
from . import maestros, movimientos

router = APIRouter()
router.include_router(maestros.router)
router.include_router(movimientos.router)
