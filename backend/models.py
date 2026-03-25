from sqlalchemy import Column, Integer, String, Text, DECIMAL, ForeignKey, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class CuentaContable(Base):
    __tablename__ = "cuentas_contables"
    id = Column(Integer, primary_key=True, index=True) # Identificador único autoincremental
    clase = Column(String(50), nullable=False) # Ej: 1000, 2000, 3000
    nombre = Column(String(100), nullable=False) # Ej: VEHÍCULOS, EQUIPOS DENTALES, MUEBLES Y UTILES
    codigo = Column(String(50), unique=True, nullable=False) # Ej: 120201, 120301, 120401 (Nro Cuenta Bancaria/Contable)
    descripcion = Column(Text, nullable=True) # Ej: "Cuenta para activos fijos de transporte operativo"
    creado_en = Column(DateTime(timezone=True), server_default=func.now()) # Fecha y hora de creación automática

class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True) # ID único
    rut = Column(String(20), unique=True, nullable=False) # Ej: 76.123.456-K (RUT con puntos y guion)
    nombre = Column(String(150), nullable=False) # Ej: DISTRIBUIDORA MEDICA S.A.
    correo_contacto = Column(String(100), nullable=True) # Ej: ventas@proveedor.cl
    telefono_contacto = Column(String(50), nullable=True) # Ej: +56 9 1234 5678
    creado_en = Column(DateTime(timezone=True), server_default=func.now()) # Automatizada

class Sucursal(Base):
    __tablename__ = "sucursales"
    id = Column(Integer, primary_key=True, index=True) # ID único
    nombre = Column(String(100), nullable=False) # Ej: SEDE CENTRAL, SUCURSAL NORTE, CENTRO CLINICO
    direccion = Column(Text, nullable=True) # Ej: Av. Providencia 1234, Santiago, Oficina 401
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class Bodega(Base):
    __tablename__ = "bodegas"
    id = Column(Integer, primary_key=True, index=True) # ID único
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False) # FK: ID de la sucursal (ej: 1, 2)
    nombre = Column(String(100), nullable=False) # Ej: BODEGA PRINCIPAL, BODEGA DE INSUMOS DENTALES
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class Ubicacion(Base):
    __tablename__ = "ubicaciones"
    id = Column(Integer, primary_key=True, index=True) # ID único
    bodega_id = Column(Integer, ForeignKey("bodegas.id"), nullable=False) # FK: ID de la bodega (ej: 1, 5)
    nombre = Column(String(100), nullable=False) # Ej: ESTANTE A-1, REFRIGERADOR 2, PASILLO 5, CAJON 3
    descripcion = Column(Text, nullable=True) # Ej: "Sector de productos que requieren cadena de frío"
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class CentroCosto(Base):
    __tablename__ = "centros_costos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False) # Ej: ADM, ADE, ASM, AME, AMC
    nombre = Column(String(100), nullable=False) # Ej: ADMINISTRACIÓN, ATENCIÓN DENTAL, ATENCIÓN MENTAL
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False) # Ej: ART-001, 12020101010 (Código interno del producto)
    nombre = Column(String(150), nullable=False) # Ej: CAMIONETA FORD F-150, SILLON DENTAL X2, MONITOR LCD
    cuenta_contable_id = Column(Integer, ForeignKey("cuentas_contables.id"), nullable=False) # FK: ID de la Clase Contable
    unidad_medida = Column(String(20), nullable=False) # Ej: UN, KG, LT, CAJA, BOLSA
    ppp_actual = Column(DECIMAL(15, 2), default=0.00) # Ej: 15500.50 (Costo promedio ponderado)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class TipoMovimiento(Base):
    __tablename__ = "tipos_movimientos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False) # Ej: ENT-COM, SAL-CON, ENT-AJU
    nombre = Column(String(100), nullable=False) # Ej: ENTRADA POR COMPRA, SALIDA POR CONSUMO
    multiplicador = Column(Integer, nullable=False) # 1 (suma al stock) o -1 (resta al stock)
    requiere_proveedor = Column(Boolean, default=False) # Define si pide proveedor al registrar
    requiere_centro_costo = Column(Boolean, default=False) # Define si pide Centro de Costo al registrar

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False) # FK: ID del producto que se mueve
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=False) # FK: ID de la ubicación de destino/origen
    tipo_movimiento_id = Column(Integer, ForeignKey("tipos_movimientos.id"), nullable=False) # FK: ID del tipo
    cantidad = Column(DECIMAL(15, 2), nullable=False) # Ej: 10.00 (Cantidad física)
    precio_unitario = Column(DECIMAL(15, 2), nullable=False) # Ej: 1200.00 (A este precio entra o sale)
    valor_total = Column(DECIMAL(15, 2), nullable=False) # Ej: 12000.00 (Calc: cantidad * precio)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True) # FK opcional: ID del proveedor
    centro_costo_id = Column(Integer, ForeignKey("centros_costos.id"), nullable=True) # FK opcional: ID del CC
    referencia_documento = Column(String(100), nullable=True) # Ej: FACTURA 123, GUIA DE DESPACHO 456
    notas = Column(Text, nullable=True) # Ej: "Ingreso inicial por inventario físico de marzo"
    fecha_movimiento = Column(DateTime(timezone=True), server_default=func.now()) # Fecha de ejecución del movimiento
    creado_por = Column(String(100), nullable=True) # Ej: "Usuario Bodega 1"

class SaldoInventario(Base):
    __tablename__ = "saldos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False) # FK: ID del producto
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=False) # FK: ID de la ubicación
    cantidad = Column(DECIMAL(15, 2), default=0.00) # Stock consolidado en tiempo real en esa ubicación
    ultima_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) # Auditoría
    
    __table_args__ = (UniqueConstraint('producto_id', 'ubicacion_id', name='uix_producto_ubicacion'),)
