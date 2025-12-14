package handlers

import "github.com/gin-gonic/gin"

// Registro de rutas públicas: /api/public/planeaciones
func RegisterPublicPlaneacionesRoutes(rg *gin.RouterGroup, h *PublicPlaneacionesHandler) {
	g := rg.Group("/public/planeaciones")
	g.GET("", h.Search)              // GET /api/public/planeaciones?profesor=&unidad=&ua=
	g.GET("/:id", h.GetOne)          // GET /api/public/planeaciones/:id
	g.GET("/slug/:slug", h.GetBySlug) // GET /api/public/planeaciones/slug/:slug
}
