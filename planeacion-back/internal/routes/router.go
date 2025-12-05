package routes

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vsalazars/planeacion-back/internal/handlers"
)

// SetupRouter arma el router principal y cuelga los grupos de rutas.
func SetupRouter(db *pgxpool.Pool) *gin.Engine {
	r := gin.Default()

	// Evitar warning de proxies
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Fatal("❌ Error configurando proxies:", err)
	}

	// 🔥 CORS para permitir llamadas desde Next.js (localhost:3000)
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rutas básicas de salud
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Probar conexión a la BD en tiempo de request
	r.GET("/db-check", func(c *gin.Context) {
		var now string
		if err := db.QueryRow(c.Request.Context(), "SELECT now()::text").Scan(&now); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"ok":    false,
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"ok":  true,
			"now": now,
		})
	})

	// Grupo /api
	api := r.Group("/api")

	authHandler := &handlers.AuthHandler{DB: db}
	handlers.RegisterAuthRoutes(api, authHandler)

	unidadesHandler := &handlers.UnidadesHandler{DB: db}
	handlers.RegisterUnidadesRoutes(api, unidadesHandler)

	return r
}
