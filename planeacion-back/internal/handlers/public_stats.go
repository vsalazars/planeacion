package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PublicStatsHandler struct {
	DB *pgxpool.Pool
}

type PublicStatsResponse struct {
	PlaneacionesTotal       int64      `json:"planeaciones_total"`
	PlaneacionesFinalizadas int64      `json:"planeaciones_finalizadas"`
	DocentesParticipantes   int64      `json:"docentes_participantes"`
	UnidadesTematicasTotal  int64      `json:"unidades_tematicas_total"`
	SesionesDidacticasTotal int64      `json:"sesiones_didacticas_total"`
	UltimaActualizacion     *time.Time `json:"ultima_actualizacion,omitempty"`
	UltimaPublicacion       *time.Time `json:"ultima_publicacion,omitempty"`
}

// GET /api/public/stats
func (h *PublicStatsHandler) Get(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	const q = `
SELECT
  (SELECT COUNT(*)::bigint FROM planeaciones) AS planeaciones_total,
  (SELECT COUNT(*)::bigint FROM planeaciones WHERE status='finalizada') AS planeaciones_finalizadas,
  (SELECT COUNT(DISTINCT docente_id)::bigint FROM planeaciones) AS docentes_participantes,
  (SELECT COUNT(*)::bigint FROM unidades_tematicas) AS unidades_tematicas_total,
  (SELECT COUNT(*)::bigint FROM sesiones_didacticas) AS sesiones_didacticas_total,
  (SELECT MAX(updated_at) FROM planeaciones) AS ultima_actualizacion,
  (SELECT MAX(finalizada_at) FROM planeaciones WHERE status='finalizada') AS ultima_publicacion;
`

	var resp PublicStatsResponse
	if err := h.DB.QueryRow(ctx, q).Scan(
		&resp.PlaneacionesTotal,
		&resp.PlaneacionesFinalizadas,
		&resp.DocentesParticipantes,
		&resp.UnidadesTematicasTotal,
		&resp.SesionesDidacticasTotal,
		&resp.UltimaActualizacion,
		&resp.UltimaPublicacion,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "DB error: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}
