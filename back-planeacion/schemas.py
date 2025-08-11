# schemas.py
from pydantic import BaseModel, Field, EmailStr

# ----------------------
# Unidades Académicas
# ----------------------
class UnidadBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=255)
    abreviatura: str | None = Field(None, max_length=50)

class UnidadCreate(UnidadBase):
    pass

class UnidadUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=3, max_length=255)
    abreviatura: str | None = Field(None, max_length=50)

class UnidadOut(UnidadBase):
    id: int
    class Config:
        from_attributes = True  # Pydantic v2: mapea desde ORM


# ----------------------
# Usuarios / Auth
# ----------------------
class RegisterIn(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    email2: EmailStr
    password: str = Field(..., min_length=8)
    password2: str = Field(..., min_length=8)
    unidad_id: int  # obligatorio

class UserOut(BaseModel):
    id: int
    nombre_completo: str
    email: EmailStr
    unidad_id: int
    role: str
    class Config:
        from_attributes = True

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
