package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vsalazars/planeacion-back/internal/models"
)

// UnidadesHandler agrupa dependencias para /unidades.
type UnidadesHandler struct {
	DB *pgxpool.Pool
}

// RegisterUnidadesRoutes registra rutas de catálogo de unidades académicas.
func RegisterUnidadesRoutes(rg *gin.RouterGroup, h *UnidadesHandler) {
	// GET /api/unidades        → lista todas las unidades_academicas
	rg.GET("/unidades", h.GetAllUnidades)

	// GET /api/unidades/:id    → obtiene una unidad por id
	rg.GET("/unidades/:id", h.GetUnidadByID)

	// Ping opcional
	rg.GET("/unidades/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "msg": "unidades handler listo"})
	})
}

// GetAllUnidades maneja GET /api/unidades.
func (h *UnidadesHandler) GetAllUnidades(c *gin.Context) {
	ctx := c.Request.Context()

	const query = `
		SELECT id, nombre, abreviatura
		FROM public.unidades_academicas
		ORDER BY nombre;
	`

	rows, err := h.DB.Query(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al consultar public.unidades_academicas",
			"msg":   err.Error(),
		})
		return
	}
	defer rows.Close()

	unidades := make([]models.UnidadAcademica, 0)

	for rows.Next() {
		var u models.UnidadAcademica
		if err := rows.Scan(&u.ID, &u.Nombre, &u.Abreviatura); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "error al leer fila de public.unidades_academicas",
				"msg":   err.Error(),
			})
			return
		}
		unidades = append(unidades, u)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al iterar resultados de public.unidades_academicas",
			"msg":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": unidades,
		"total": len(unidades),
	})
}

// GetUnidadByID maneja GET /api/unidades/:id.
func (h *UnidadesHandler) GetUnidadByID(c *gin.Context) {
	ctx := c.Request.Context()
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id inválido, debe ser un entero positivo",
		})
		return
	}

	const query = `
		SELECT id, nombre, abreviatura
		FROM public.unidades_academicas
		WHERE id = $1;
	`

	var u models.UnidadAcademica
	err = h.DB.QueryRow(ctx, query, id).Scan(&u.ID, &u.Nombre, &u.Abreviatura)
	if err != nil {
		// No usamos pgx.ErrNoRows explícito para mantenerlo simple por ahora
		c.JSON(http.StatusNotFound, gin.H{
			"error": "unidad_academica no encontrada",
			"id":    id,
		})
		return
	}

	c.JSON(http.StatusOK, u)
}
