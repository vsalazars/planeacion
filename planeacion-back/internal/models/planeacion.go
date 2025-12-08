package models

import "time"

type Planeacion struct {
	ID                 int64     `json:"id"`
	DocenteID          int64     `json:"docente_id"`
	UnidadAcademicaID int64     `json:"unidad_academica_id"`
	NombrePlaneacion   string    `json:"nombre_planeacion"`
	Asignatura         *string   `json:"asignatura"`
	Periodo            *string   `json:"periodo"`
	Grupo              *string   `json:"grupo"`
	Status             string    `json:"status"`
	SeccionesCompletas []byte    `json:"secciones_completas"`
	FinalizadaAt       *time.Time `json:"finalizada_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}
