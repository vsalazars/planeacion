package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DatosGeneralesHandler struct {
	DB *pgxpool.Pool
}

func RegisterDatosGeneralesRoutes(rg *gin.RouterGroup, h *DatosGeneralesHandler) {
	g := rg.Group("/planeaciones/:id/datos-generales")
	g.GET("", h.Get)
	g.PUT("", h.Update)
}

// GET /api/planeaciones/:id/datos-generales
func (h *DatosGeneralesHandler) Get(c *gin.Context) {
	planeacionID, _ := strconv.Atoi(c.Param("id"))

	row := h.DB.QueryRow(c, `
		SELECT id, asignatura, periodo, grupo, proposito, metodologia, consideraciones
		FROM planeacion_datos_generales
		WHERE planeacion_id=$1
		LIMIT 1
	`, planeacionID)

	var (
		id            int64
		asignatura    *string
		periodo       *string
		grupo         *string
		proposito     *string
		metodologia   *string
		consideracion *string
	)

	err := row.Scan(&id, &asignatura, &periodo, &grupo, &proposito, &metodologia, &consideracion)

	if err != nil {
		// Si NO existe registro, devolvemos vacío (es válido en borrador)
		c.JSON(http.StatusOK, gin.H{
			"id":               nil,
			"asignatura":       nil,
			"periodo":          nil,
			"grupo":            nil,
			"proposito":        nil,
			"metodologia":      nil,
			"consideraciones":  nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":               id,
		"asignatura":       asignatura,
		"periodo":          periodo,
		"group":            grupo,
		"proposito":        proposito,
		"metodologia":      metodologia,
		"consideraciones":  consideracion,
	})
}

// PUT /api/planeaciones/:id/datos-generales
func (h *DatosGeneralesHandler) Update(c *gin.Context) {
	planeacionID, _ := strconv.Atoi(c.Param("id"))

	var body struct {
		Asignatura     *string `json:"asignatura"`
		Periodo        *string `json:"periodo"`
		Grupo          *string `json:"grupo"`
		Proposito      *string `json:"proposito"`
		Metodologia    *string `json:"metodologia"`
		Consideraciones *string `json:"consideraciones"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	_, err := h.DB.Exec(c, `
		INSERT INTO planeacion_datos_generales
		(planeacion_id, asignatura, periodo, grupo, proposito, metodologia, consideraciones)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (planeacion_id) DO UPDATE SET
			asignatura = EXCLUDED.asignatura,
			periodo = EXCLUDED.periodo,
			grupo = EXCLUDED.grupo,
			proposito = EXCLUDED.proposito,
			metodologia = EXCLUDED.metodologia,
			consideraciones = EXCLUDED.consideraciones,
			updated_at = now()
	`, planeacionID, body.Asignatura, body.Periodo, body.Grupo, body.Proposito, body.Metodologia, body.Consideraciones)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando datos: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
