from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import maestros, tipos_mov, movimientos, auth

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")

app = FastAPI(title="Sistema de Inventario API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maestros.router)
app.include_router(tipos_mov.router)
app.include_router(movimientos.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Sistema de Inventario"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
