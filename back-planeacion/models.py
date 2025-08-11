# models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, Enum, ForeignKey, Text, TIMESTAMP, func
)
from sqlalchemy.orm import declarative_base
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    admin = "admin"
    profesor = "profesor"

class UnidadAcademica(Base):
    __tablename__ = "unidades_academicas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    abreviatura = Column(String(50))

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    unidad_id = Column(Integer, ForeignKey("unidades_academicas.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.profesor)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
