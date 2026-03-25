import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def seed_db():
    with engine.connect() as conn:
        print("Insertando tipos de movimiento...")
        # Entradas
        conn.execute(text("INSERT INTO tipos_movimientos (codigo, nombre, multiplicador, requiere_proveedor, requiere_centro_costo) VALUES ('ENT-COM', 'Entrada por Compra', 1, true, false)"))
        conn.execute(text("INSERT INTO tipos_movimientos (codigo, nombre, multiplicador, requiere_proveedor, requiere_centro_costo) VALUES ('ENT-AJU', 'Entrada por Ajuste', 1, false, false)"))
        # Salidas
        conn.execute(text("INSERT INTO tipos_movimientos (codigo, nombre, multiplicador, requiere_proveedor, requiere_centro_costo) VALUES ('SAL-CON', 'Salida por Consumo', -1, false, true)"))
        conn.execute(text("INSERT INTO tipos_movimientos (codigo, nombre, multiplicador, requiere_proveedor, requiere_centro_costo) VALUES ('SAL-MER', 'Salida por Merma', -1, false, false)"))
        
        conn.commit()
        print("Seed completado.")

if __name__ == "__main__":
    seed_db()
