package handlers

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/vsalazars/planeacion-back/internal/models"
)

// =============================
// AuthHandler
// =============================

type AuthHandler struct {
	DB *pgxpool.Pool
}

// RegisterAuthRoutes registra las rutas de autenticación.
func RegisterAuthRoutes(rg *gin.RouterGroup, h *AuthHandler) {
	// Primero: registro
	rg.POST("/auth/register", h.Register)

	// Luego: login
	rg.POST("/auth/login", h.Login)

	// Usuario actual
	rg.GET("/me", h.Me)
}

// =============================
// DTOs
// =============================

type registerRequest struct {
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Password string `json:"password"`
	UnidadID int    `json:"unidad_id"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// =============================
// JWT claims
// =============================

type PlaneacionClaims struct {
	UserID   int    `json:"user_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	UnidadID int    `json:"unidad_id"`
	jwt.RegisteredClaims
}

// =============================
// Helpers internos
// =============================

func validateRegisterRequest(req registerRequest) error {
	if strings.TrimSpace(req.Nombre) == "" {
		return errors.New("el nombre completo es obligatorio")
	}
	if !strings.Contains(req.Email, "@") {
		return errors.New("email inválido")
	}
	if len(req.Password) < 8 {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}
	if req.UnidadID <= 0 {
		return errors.New("unidad_id debe ser un entero positivo")
	}
	return nil
}

func getJWTSecret() (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if strings.TrimSpace(secret) == "" {
		return "", errors.New("JWT_SECRET no está definido en el entorno")
	}
	return secret, nil
}

func hashMatchesPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// =============================
// Handler: REGISTER
// =============================

// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payload inválido",
		})
		return
	}

	if err := validateRegisterRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// 1) Verificar que la unidad académica exista
	const checkUnidadSQL = `
		SELECT 1
		FROM public.unidades_academicas
		WHERE id = $1;
	`

	var dummy int
	if err := h.DB.QueryRow(ctx, checkUnidadSQL, req.UnidadID).Scan(&dummy); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "la unidad académica especificada no existe",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al validar unidad académica",
			"msg":   err.Error(),
		})
		return
	}

	// 2) Verificar que el email NO esté ya registrado
	const checkEmailSQL = `
		SELECT 1
		FROM public.usuarios
		WHERE email = $1;
	`

	if err := h.DB.QueryRow(ctx, checkEmailSQL, strings.TrimSpace(req.Email)).Scan(&dummy); err == nil {
		// Encontró un registro → ya existe
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ya existe un usuario registrado con ese email",
		})
		return
	} else if !errors.Is(err, pgx.ErrNoRows) {
		// Error distinto a "no rows"
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al validar email único",
			"msg":   err.Error(),
		})
		return
	}

	// 3) Hashear password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "no se pudo procesar la contraseña",
			"msg":   err.Error(),
		})
		return
	}

	// 4) Insertar en BD
	const insertSQL = `
		INSERT INTO public.usuarios (unidad_id, nombre_completo, email, password_hash, role, is_active)
		VALUES ($1, $2, $3, $4, 'profesor', true)
		RETURNING id, unidad_id, nombre_completo, email, role, is_active, created_at, updated_at;
	`

	var u models.Usuario
	if err := h.DB.QueryRow(
		ctx,
		insertSQL,
		req.UnidadID,
		strings.TrimSpace(req.Nombre),
		strings.TrimSpace(req.Email),
		string(hashed),
	).Scan(
		&u.ID,
		&u.UnidadID,
		&u.NombreCompleto,
		&u.Email,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al registrar usuario",
			"msg":   err.Error(),
		})
		return
	}

	// 5) Responder con el usuario (sin password_hash, gracias al tag json:"-")
	c.JSON(http.StatusCreated, gin.H{
		"user": u,
	})
}

// =============================
// Handler: LOGIN
// =============================

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payload inválido",
		})
		return
	}

	email := strings.TrimSpace(req.Email)
	if email == "" || strings.TrimSpace(req.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "email y password son obligatorios",
		})
		return
	}

	secret, err := getJWTSecret()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "configuración de JWT inválida",
			"msg":   err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	const query = `
		SELECT id, unidad_id, nombre_completo, email, password_hash, role, is_active, created_at, updated_at
		FROM public.usuarios
		WHERE email = $1;
	`

	var u models.Usuario
	var passwordHash string

	err = h.DB.QueryRow(ctx, query, email).Scan(
		&u.ID,
		&u.UnidadID,
		&u.NombreCompleto,
		&u.Email,
		&passwordHash,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "credenciales inválidas",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al consultar usuario",
			"msg":   err.Error(),
		})
		return
	}

	if !u.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "usuario inactivo",
		})
		return
	}

	// Comparar password con hash (bcrypt)
	if err := hashMatchesPassword(passwordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "credenciales inválidas",
		})
		return
	}

	// Crear token JWT
	now := time.Now()
	claims := &PlaneacionClaims{
		UserID:   u.ID,
		Email:    u.Email,
		Role:     u.Role,
		UnidadID: u.UnidadID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.Itoa(u.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)), // 24h
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "no se pudo firmar el token",
			"msg":   err.Error(),
		})
		return
	}

	// Respuesta compatible con tu front:
	// busca access_token || token || accessToken y user
	c.JSON(http.StatusOK, gin.H{
		"access_token": signed,
		"token_type":   "bearer",
		"user":         u,
	})
}

// =============================
// Handler: ME (usuario actual)
// =============================

// GET /api/me
func (h *AuthHandler) Me(c *gin.Context) {
	// Leer header Authorization: "Bearer <token>"
	authHeader := c.GetHeader("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "token no proporcionado",
		})
		return
	}

	tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))

	secret, err := getJWTSecret()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "configuración de JWT inválida",
			"msg":   err.Error(),
		})
		return
	}

	// Parsear y validar el token
	token, err := jwt.ParseWithClaims(tokenStr, &PlaneacionClaims{}, func(t *jwt.Token) (interface{}, error) {
		// Aseguramos algoritmo HS256
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("algoritmo de firma inválido")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "token inválido",
		})
		return
	}

	claims, ok := token.Claims.(*PlaneacionClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "claims inválidos",
		})
		return
	}

	// Consultar usuario en BD
	const query = `
		SELECT id, unidad_id, nombre_completo, email, role, is_active, created_at, updated_at
		FROM public.usuarios
		WHERE id = $1;
	`

	var u models.Usuario
	ctx := c.Request.Context()

	err = h.DB.QueryRow(ctx, query, claims.UserID).Scan(
		&u.ID,
		&u.UnidadID,
		&u.NombreCompleto,
		&u.Email,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "usuario no encontrado",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "error al consultar usuario",
			"msg":   err.Error(),
		})
		return
	}

	// Responder el usuario (sin password_hash por el json:"-" del modelo)
	c.JSON(http.StatusOK, u)
}
