import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def reset_db():
    tables = [
        "movimientos_inventario",
        "saldos_inventario",
        "productos",
        "clasificaciones_productos",
        "cuentas_contables",
        "ubicaciones",
        "bodegas",
        "sucursales",
        "proveedores",
        "centros_costos",
        "tipos_movimientos"
    ]
    
    with engine.connect() as conn:
        print("Limpiando tablas con CASCADE...")
        for table in tables:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            except Exception as e:
                print(f"Error dropeando {table}: {e}")
        conn.commit()
        print("Limpieza completada.")

if __name__ == "__main__":
    reset_db()
