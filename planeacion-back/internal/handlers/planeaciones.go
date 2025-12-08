package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// =============================
// Handler de Planeaciones
// =============================

type PlaneacionesHandler struct {
	DB *pgxpool.Pool
}

// Registro de rutas /api/planeaciones
func RegisterPlaneacionesRoutes(rg *gin.RouterGroup, h *PlaneacionesHandler) {
	g := rg.Group("/planeaciones")

	g.GET("", h.List)       // GET /api/planeaciones
	g.POST("", h.Create)    // POST /api/planeaciones
	g.GET("/:id", h.GetOne) // GET /api/planeaciones/:id
	g.PUT("/:id", h.Update) // PUT /api/planeaciones/:id
	g.DELETE("/:id", h.Delete)
}

// =============================
// Helper: obtener claims desde Authorization: Bearer
// (usa PlaneacionClaims y getJWTSecret definidos en auth.go)
// =============================

func getClaimsFromHeader(c *gin.Context) (*PlaneacionClaims, error) {
	authHeader := c.GetHeader("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("token no proporcionado")
	}

	tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))

	secret, err := getJWTSecret()
	if err != nil {
		return nil, err
	}

	token, err := jwt.ParseWithClaims(tokenStr, &PlaneacionClaims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("algoritmo de firma inválido")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("token inválido")
	}

	claims, ok := token.Claims.(*PlaneacionClaims)
	if !ok {
		return nil, errors.New("claims inválidos")
	}

	return claims, nil
}

// =============================
// GET /api/planeaciones
// Lista SOLO las planeaciones del docente autenticado
// =============================

func (h *PlaneacionesHandler) List(c *gin.Context) {
	claims, err := getClaimsFromHeader(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	rows, err := h.DB.Query(
		c,
		`
		SELECT id, docente_id, unidad_academica_id, nombre_planeacion, status, created_at, updated_at
		FROM planeaciones
		WHERE docente_id = $1
		ORDER BY created_at DESC
		`,
		claims.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
		return
	}
	defer rows.Close()

	list := []gin.H{}

	for rows.Next() {
		var (
			id, docenteID, unidadID int64
			nombre, status          string
			created, updated        time.Time
		)

		if err := rows.Scan(&id, &docenteID, &unidadID, &nombre, &status, &created, &updated); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo filas: " + err.Error()})
			return
		}

		list = append(list, gin.H{
			"id":                  id,
			"docente_id":          docenteID,
			"unidad_academica_id": unidadID,
			"nombre_planeacion":   nombre,
			"status":              status,
			// Puedes formatear si quieres string:
			// "created_at": created.Format(time.RFC3339),
			// "updated_at": updated.Format(time.RFC3339),
			"created_at": created,
			"updated_at": updated,
		})
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error en cursor: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

// =============================
// POST /api/planeaciones
// Crea planeación con docente_id / unidad_academica_id del JWT
// Body: { "nombre_planeacion": "..." }
// =============================

type createPlaneacionRequest struct {
	NombrePlaneacion string `json:"nombre_planeacion"`
}

func (h *PlaneacionesHandler) Create(c *gin.Context) {
	claims, err := getClaimsFromHeader(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var body createPlaneacionRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	name := strings.TrimSpace(body.NombrePlaneacion)
	if name == "" {
		name = "Planeación sin título"
	}

	var newID int64
	err = h.DB.QueryRow(
		c,
		`
		INSERT INTO planeaciones (docente_id, unidad_academica_id, nombre_planeacion)
		VALUES ($1, $2, $3)
		RETURNING id
		`,
		claims.UserID,
		claims.UnidadID,
		name,
	).Scan(&newID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo crear planeación: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": newID})
}

// =============================
// GET /api/planeaciones/:id
// Valida que la planeación sea del docente del token
// =============================

func (h *PlaneacionesHandler) GetOne(c *gin.Context) {
	claims, err := getClaimsFromHeader(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	row := h.DB.QueryRow(
		c,
		`
		SELECT id, docente_id, unidad_academica_id, nombre_planeacion, status, secciones_completas, created_at, updated_at
		FROM planeaciones
		WHERE id = $1 AND docente_id = $2
		`,
		id,
		claims.UserID,
	)

	var (
		pid, docenteID, unidadID int64
		nombre, status           string
		sections                 []byte
		created, updated         time.Time
	)

	if err := row.Scan(&pid, &docenteID, &unidadID, &nombre, &status, &sections, &created, &updated); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                  pid,
		"docente_id":          docenteID,
		"unidad_academica_id": unidadID,
		"nombre_planeacion":   nombre,
		"status":              status,
		// secciones_completas es jsonb; por ahora lo mandamos como string
		"secciones_completas": string(sections),
		// Igual que arriba, puedes formatear a string si lo prefieres
		"created_at": created,
		"updated_at": updated,
	})
}

// =============================
// PUT /api/planeaciones/:id
// (por ahora solo actualiza nombre_planeacion y status)
// =============================

type updatePlaneacionRequest struct {
	NombrePlaneacion *string `json:"nombre_planeacion"`
	Status           *string `json:"status"`
}

func (h *PlaneacionesHandler) Update(c *gin.Context) {
	claims, err := getClaimsFromHeader(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var body updatePlaneacionRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// Ejecutar UPDATE
	res, err := h.DB.Exec(
		c,
		`
		UPDATE planeaciones
		SET
			nombre_planeacion = COALESCE($1, nombre_planeacion),
			status            = COALESCE($2, status)
		WHERE id = $3 AND docente_id = $4
		`,
		body.NombrePlaneacion,
		body.Status,
		id,
		claims.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada o no pertenece al usuario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// =============================
// DELETE /api/planeaciones/:id
// Solo borra si la planeación es del docente del token
// =============================

func (h *PlaneacionesHandler) Delete(c *gin.Context) {
	claims, err := getClaimsFromHeader(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	res, err := h.DB.Exec(
		c,
		`DELETE FROM planeaciones WHERE id = $1 AND docente_id = $2`,
		id,
		claims.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada o no pertenece al usuario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
