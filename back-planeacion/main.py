# main.py
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

# --- 🔽 IMPORTS NUEVOS (JWT / Seguridad) ---
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# --- 🔼 ---

from db import get_db
from models import UnidadAcademica, Usuario, UserRole
from schemas import (
    UnidadCreate, UnidadOut, UnidadUpdate,
    RegisterIn, UserOut
)
# 🔽 si ya existe en schemas, se usa; si no, lo tienes más abajo como BaseModel
from schemas import LoginIn  # asegúrate que existe en schemas.py

load_dotenv()

app = FastAPI(title="API Planeación")

# CORS (para Next.js)
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 🔽 CONFIG JWT NUEVA ---
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
# --- 🔼 ---

# ---------- Health ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- Unidades ----------
@app.get("/unidades", response_model=list[UnidadOut])
def list_unidades(
    q: str | None = Query(None, description="Buscar por nombre o abreviatura"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(UnidadAcademica)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (UnidadAcademica.nombre.ilike(like)) | (UnidadAcademica.abreviatura.ilike(like))
        )
    stmt = stmt.offset(skip).limit(limit)
    rows = db.execute(stmt).scalars().all()
    return rows

@app.get("/unidades/{unidad_id}", response_model=UnidadOut)
def get_unidad(unidad_id: int, db: Session = Depends(get_db)):
    unidad = db.get(UnidadAcademica, unidad_id)
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    return unidad

@app.post("/unidades", response_model=UnidadOut, status_code=status.HTTP_201_CREATED)
def create_unidad(payload: UnidadCreate, db: Session = Depends(get_db)):
    exists = db.execute(
        select(UnidadAcademica).where(UnidadAcademica.nombre == payload.nombre)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Ya existe una unidad con ese nombre")
    obj = UnidadAcademica(nombre=payload.nombre, abreviatura=payload.abreviatura)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.patch("/unidades/{unidad_id}", response_model=UnidadOut)
def update_unidad(unidad_id: int, payload: UnidadUpdate, db: Session = Depends(get_db)):
    unidad = db.get(UnidadAcademica, unidad_id)
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    if payload.nombre is not None:
        unidad.nombre = payload.nombre
    if payload.abreviatura is not None:
        unidad.abreviatura = payload.abreviatura
    db.commit()
    db.refresh(unidad)
    return unidad

@app.delete("/unidades/{unidad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unidad(unidad_id: int, db: Session = Depends(get_db)):
    unidad = db.get(UnidadAcademica, unidad_id)
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    db.delete(unidad)
    db.commit()
    return

# ---------- Auth: Registro de usuarios ----------
@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    # Confirmaciones servidor
    if payload.email.lower().strip() != payload.email2.lower().strip():
        raise HTTPException(status_code=400, detail="Los correos no coinciden")
    if payload.password != payload.password2:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    # Unidad válida
    unidad = db.get(UnidadAcademica, payload.unidad_id)
    if not unidad:
        raise HTTPException(status_code=400, detail="Unidad académica inválida")

    # Email único
    exists = db.execute(
        select(Usuario).where(Usuario.email == payload.email.lower().strip())
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    # Crear usuario (rol por defecto: profesor)
    u = Usuario(
        nombre_completo=payload.nombre.strip(),
        email=payload.email.lower().strip(),
        password_hash=pwd.hash(payload.password),
        unidad_id=payload.unidad_id,
        role=UserRole.profesor,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

# ---------- Auth: Login (NUEVO) ----------
@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    # Buscar usuario por email
    user = db.execute(
        select(Usuario).where(Usuario.email == payload.email.lower().strip())
    ).scalar_one_or_none()

    if not user or not pwd.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre_completo": user.nombre_completo,
            "email": user.email,
            "unidad_id": user.unidad_id,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        },
    }

# ---------- Perfil autenticado (NUEVO, para probar token) ----------
@app.get("/me", response_model=UserOut)
def me(creds: HTTPAuthorizationCredentials = Depends(security),
       db: Session = Depends(get_db)):
    token = creds.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Token inválido (sin sub)")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.get(Usuario, int(sub))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    return user
