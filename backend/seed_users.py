from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, auth_utils

def seed_users():
    db = SessionLocal()
    # Aseguramos que las tablas existan (por si acaso)
    models.Base.metadata.create_all(bind=engine)
    
    users_to_create = [
        {"username": "avalenzuela", "nombre": "A. Valenzuela"},
        {"username": "jmarchant", "nombre": "J. Marchant"},
        {"username": "njofre", "nombre": "N. Jofré"},
        {"username": "apalma", "nombre": "A. Palma"},
        {"username": "fnilo", "nombre": "F. Nilo"},
        {"username": "furbina", "nombre": "F. Urbina"},
    ]
    
    default_password = "Tabancura2026!"
    hashed_password = auth_utils.get_password_hash(default_password)
    
    print("Iniciando sembrado de usuarios...")
    
    for u in users_to_create:
        existing = db.query(models.User).filter(models.User.username == u["username"]).first()
        if not existing:
            new_user = models.User(
                username=u["username"],
                email=f"{u['username']}@policlinicotabancura.cl",
                hashed_password=hashed_password,
                nombre_completo=u["nombre"],
                rol="operador"
            )
            db.add(new_user)
            print(f"✅ Usuario {u['username']} creado.")
        else:
            print(f"ℹ️ Usuario {u['username']} ya existe.")
    
    try:
        db.commit()
        print("🚀 Sembrado de usuarios finalizado con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante el sembrado: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
