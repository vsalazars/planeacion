package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/vsalazars/planeacion-back/internal/handlers"
)

// AuthMiddleware valida el token JWT en Authorization: Bearer <token>
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token no proporcionado"})
			c.Abort()
			return
		}

		tokenStr := strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))

		secret := os.Getenv("JWT_SECRET")
		if strings.TrimSpace(secret) == "" {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "configuración de JWT inválida (JWT_SECRET vacío)",
			})
			c.Abort()
			return
		}

		// Parsear token con tus claims
		token, err := jwt.ParseWithClaims(
			tokenStr,
			&handlers.PlaneacionClaims{},
			func(t *jwt.Token) (interface{}, error) {
				if t.Method != jwt.SigningMethodHS256 {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(secret), nil
			},
		)

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*handlers.PlaneacionClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token malformado"})
			c.Abort()
			return
		}

		// Inyectar valores en el contexto
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("unidad_id", claims.UnidadID)

		c.Next()
	}
}
