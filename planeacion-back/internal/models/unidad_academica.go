package models

// UnidadAcademica representa la tabla public.unidades_academicas.
type UnidadAcademica struct {
	ID          int    `json:"id"`
	Nombre      string `json:"nombre"`
	Abreviatura string `json:"abreviatura"`
}
