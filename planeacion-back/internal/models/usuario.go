package models

import "time"

// Usuario representa la tabla public.usuarios en la BD planeacion.
type Usuario struct {
	ID             int       `db:"id" json:"id"`
	UnidadID       int       `db:"unidad_id" json:"unidad_id"`
	NombreCompleto string    `db:"nombre_completo" json:"nombre_completo"`
	Email          string    `db:"email" json:"email"`
	PasswordHash   string    `db:"password_hash" json:"-"`
	Role           string    `db:"role" json:"role"`
	IsActive       bool      `db:"is_active" json:"is_active"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}
