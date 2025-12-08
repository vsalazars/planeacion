package routes

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vsalazars/planeacion-back/internal/handlers"
	"github.com/vsalazars/planeacion-back/internal/middleware"
)

func SetupRouter(db *pgxpool.Pool) *gin.Engine {
	r := gin.Default()

	// Evitar warning de proxies
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Fatal("❌ Error configurando proxies:", err)
	}

	// ======================================
	// CORS (Next.js 3000)
	// ======================================
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

	// ======================================
	// Healthcheck
	// ======================================
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/db-check", func(c *gin.Context) {
		var now string
		if err := db.QueryRow(c.Request.Context(), "SELECT now()::text").Scan(&now); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"ok":    false,
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "now": now})
	})

	// ==========================
	// Grupo /api
	// ==========================
	api := r.Group("/api")

	// ---- AUTENTICACIÓN PÚBLICA ----
	authHandler := &handlers.AuthHandler{DB: db}
	handlers.RegisterAuthRoutes(api, authHandler)

	unidadesHandler := &handlers.UnidadesHandler{DB: db}
	handlers.RegisterUnidadesRoutes(api, unidadesHandler)

	// ==========================
	// Grupo PROTEGIDO
	// ==========================
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())

	planeacionesHandler := &handlers.PlaneacionesHandler{DB: db}
	handlers.RegisterPlaneacionesRoutes(protected, planeacionesHandler)

	datosHandler := &handlers.DatosGeneralesHandler{DB: db}
	handlers.RegisterDatosGeneralesRoutes(protected, datosHandler)

	return r
}
