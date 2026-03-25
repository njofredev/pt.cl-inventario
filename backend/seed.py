from database import SessionLocal
from models import TipoMovimiento

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(TipoMovimiento).first() is None:
        tipos = [
            TipoMovimiento(codigo="ENTRADA_COMPRA", nombre="Entrada por Compra", multiplicador=1, requiere_proveedor=True, requiere_centro_costo=False),
            TipoMovimiento(codigo="ENTRADA_REGALO", nombre="Entrada por Regalo", multiplicador=1, requiere_proveedor=False, requiere_centro_costo=False),
            TipoMovimiento(codigo="ENTRADA_AJUSTE", nombre="Entrada por Ajuste", multiplicador=1, requiere_proveedor=False, requiere_centro_costo=False),
            TipoMovimiento(codigo="SALIDA_CONSUMO", nombre="Salida por Consumo", multiplicador=-1, requiere_proveedor=False, requiere_centro_costo=True),
            TipoMovimiento(codigo="SALIDA_MERMA", nombre="Salida por Merma/Vencimiento", multiplicador=-1, requiere_proveedor=False, requiere_centro_costo=False),
            TipoMovimiento(codigo="SALIDA_AJUSTE", nombre="Salida por Ajuste", multiplicador=-1, requiere_proveedor=False, requiere_centro_costo=False),
        ]
        db.add_all(tipos)
        db.commit()
        print("Datos semilla insertados correctamente.")
    else:
        print("Los datos semilla ya existen.")
        
    db.close()

if __name__ == "__main__":
    seed_data()
