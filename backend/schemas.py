from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# --- Cuentas Contables (Simplificado: Clase + Descripción + Código) ---
class CuentaContableBase(BaseModel):
    clase: str
    nombre: str
    codigo: str
    descripcion: Optional[str] = None

class CuentaContableCreate(CuentaContableBase):
    pass

class CuentaContable(CuentaContableBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Proveedores ---
class ProveedorBase(BaseModel):
    rut: str
    nombre: str
    correo_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class Proveedor(ProveedorBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Sucursales ---
class SucursalBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None

class SucursalCreate(SucursalBase):
    pass

class Sucursal(SucursalBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Bodegas ---
class BodegaBase(BaseModel):
    nombre: str
    sucursal_id: int

class BodegaCreate(BodegaBase):
    pass

class Bodega(BodegaBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Ubicaciones ---
class UbicacionBase(BaseModel):
    nombre: str
    bodega_id: int
    descripcion: Optional[str] = None

class UbicacionCreate(UbicacionBase):
    pass

class Ubicacion(UbicacionBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Centros de Costo ---
class CentroCostoBase(BaseModel):
    codigo: str
    nombre: str

class CentroCostoCreate(CentroCostoBase):
    pass

class CentroCosto(CentroCostoBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Productos ---
class ProductoBase(BaseModel):
    sku: str
    nombre: str
    cuenta_contable_id: int
    unidad_medida: str

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int
    ppp_actual: Decimal
    creado_en: datetime

    class Config:
        from_attributes = True

# --- Tipos de Movimiento ---
class TipoMovimientoBase(BaseModel):
    codigo: str
    nombre: str
    multiplicador: int
    requiere_proveedor: bool = False
    requiere_centro_costo: bool = False

class TipoMovimientoCreate(TipoMovimientoBase):
    pass

class TipoMovimiento(TipoMovimientoBase):
    id: int

    class Config:
        from_attributes = True

# --- Movimientos Inventario ---
class MovimientoInventarioBase(BaseModel):
    producto_id: int
    ubicacion_id: int
    tipo_movimiento_id: int
    cantidad: Decimal
    precio_unitario: Decimal
    proveedor_id: Optional[int] = None
    centro_costo_id: Optional[int] = None
    referencia_documento: Optional[str] = None
    notas: Optional[str] = None
    creado_por: Optional[str] = None

class MovimientoInventarioCreate(MovimientoInventarioBase):
    pass

class MovimientoInventario(MovimientoInventarioBase):
    id: int
    valor_total: Decimal
    fecha_movimiento: datetime

    class Config:
        from_attributes = True

# --- Saldos Inventario ---
class SaldoInventario(BaseModel):
    id: int
    producto_id: int
    ubicacion_id: int
    cantidad: Decimal
    ultima_actualizacion: datetime

    class Config:
        from_attributes = True

# --- Usuarios ---
class UserBase(BaseModel):
    username: str
    email: str
    nombre_completo: Optional[str] = None
    rol: str = "operador"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User
