package handlers

import "github.com/gin-gonic/gin"

// Registro de rutas públicas: /api/public/stats
func RegisterPublicStatsRoutes(rg *gin.RouterGroup, h *PublicStatsHandler) {
	g := rg.Group("/public")
	g.GET("/stats", h.Get) // GET /api/public/stats
}
