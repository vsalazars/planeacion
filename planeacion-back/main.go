package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/vsalazars/planeacion-back/internal/routes"
)

var db *pgxpool.Pool

// --------------------
// Utilidades ENV
// --------------------
func loadEnv() {
	_ = godotenv.Load() // Carga .env si existe
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

// --------------------
// Conexión a Postgres
// --------------------
func connectDB(ctx context.Context) *pgxpool.Pool {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	pass := getEnv("DB_PASS", "")
	name := getEnv("DB_NAME", "planeacion")

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, pass, host, port, name,
	)

	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatal("❌ Error al parsear DSN de Postgres:", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatal("❌ Error al crear pool de Postgres:", err)
	}

	// Probar conexión
	if err := pool.Ping(ctx); err != nil {
		log.Fatal("❌ No se pudo conectar (ping) a Postgres:", err)
	}

	log.Println("✅ Conectado a Postgres (planeacion)")
	return pool
}

// --------------------
// MAIN
// --------------------
func main() {
	// 1. Cargar variables
	loadEnv()
	ctx := context.Background()

	// 2. Conectar BD
	db = connectDB(ctx)
	defer db.Close()

	// 3. Levantar router
	port := getEnv("PORT", "8080")
	r := routes.SetupRouter(db)

	log.Printf("🚀 Servidor escuchando en :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("❌ Error al iniciar servidor:", err)
	}
}
