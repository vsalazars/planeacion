package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
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
	g.POST("/:id/reabrir", h.Reabrir) // ✅ NUEVO: POST /api/planeaciones/:id/reabrir
	g.DELETE("/:id", h.Delete)
}

// Helpers para manejar punteros → NULL en SQL
func strOrNil(p *string) any {
	if p == nil {
		return nil
	}
	return *p
}

func intOrNil(p *int) any {
	if p == nil {
		return nil
	}
	return *p
}

func floatOrNil(p *float64) any {
	if p == nil {
		return nil
	}
	return *p
}

func boolOrNil(p *bool) any {
	if p == nil {
		return nil
	}
	return *p
}

// Payload para referencias
type ReferenciaPayload struct {
	CitaAPA        string  `json:"cita_apa"`
	UnidadesAplica []int32 `json:"unidades_aplica"`
	Tipo           string  `json:"tipo"`
}

// >>> Payloads para unidades temáticas y sesiones (bloques)

// Actividades de una sesión
type ActividadesPayload struct {
	Inicio     string `json:"inicio"`
	Desarrollo string `json:"desarrollo"`
	Cierre     string `json:"cierre"`
}

// Bloque / sesión didáctica
type SesionBloquePayload struct {
	NumeroSesion    int                `json:"numero_sesion"`
	TemasSubtemas   string             `json:"temas_subtemas"`
	Actividades     ActividadesPayload `json:"actividades"`
	Recursos        []string           `json:"recursos"`
	Evidencias      []string           `json:"evidencias"`
	Instrumentos    []string           `json:"instrumentos"`
	ValorPorcentual int                `json:"valor_porcentual"`
}

// Periodo de desarrollo de la unidad
type PeriodoDesarrolloPayload struct {
	Del *string `json:"del"`
	Al  *string `json:"al"`
}

// Horas por espacio
type HorasPayload struct {
	Aula        *float64 `json:"aula"`
	Laboratorio *float64 `json:"laboratorio"`
	Taller      *float64 `json:"taller"`
	Clinica     *float64 `json:"clinica"`
	Otro        *float64 `json:"otro"`
}

// Sesiones por espacio
type SesionesPorEspacioPayload struct {
	Aula        *int `json:"aula"`
	Laboratorio *int `json:"laboratorio"`
	Taller      *int `json:"taller"`
	Clinica     *int `json:"clinica"`
	Otro        *int `json:"otro"`
}

// Unidad temática completa
type UnidadTematicaPayload struct {
	Numero                int                       `json:"numero"`
	NombreUnidadTematica  string                    `json:"nombre_unidad_tematica"`
	UnidadCompetencia     string                    `json:"unidad_competencia"`
	PeriodoDesarrollo     PeriodoDesarrolloPayload  `json:"periodo_desarrollo"`
	Horas                 HorasPayload              `json:"horas"`
	SesionesPorEspacio    SesionesPorEspacioPayload `json:"sesiones_por_espacio"`
	SesionesTotales       *int                      `json:"sesiones_totales"`
	AprendizajesEsperados []string                  `json:"aprendizajes_esperados"`
	Precisiones           *string                   `json:"precisiones"`
	Porcentaje            *int                      `json:"porcentaje"`
	PeriodoRegistroEval   *string                   `json:"periodo_registro_eval"`
	Bloques               []SesionBloquePayload     `json:"bloques"`
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
// Slug helpers (para URL pública)
// =============================

var reSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = reSlug.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
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
			"created_at":          created,
			"updated_at":          updated,
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
// Devuelve datos combinados de varias tablas para el formulario
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
SELECT json_build_object(
  'id', p.id,
  'docente_id', p.docente_id,
  'unidad_academica_id', p.unidad_academica_id,
  'nombre_planeacion', p.nombre_planeacion,
  'status', p.status,
  'created_at', p.created_at,
  'updated_at', p.updated_at,
  'secciones_completas', p.secciones_completas,

  -- ✅ SLUG + finalizada_at (NUEVO, no rompe nada)
  'slug', p.slug,
  'finalizada_at', p.finalizada_at,

  -- Datos generales
  'periodo_escolar', dg.periodo,
  'plan_estudios_anio', dg.plan_estudios_anio,
  'semestre_nivel', dg.semestre_nivel,
  'grupos', dg.grupos,
  'programa_academico', dg.programa_academico,
  'academia', dg.academia,
  'area_formacion', dg.area_formacion,
  'modalidad', dg.modalidad,
  'sesiones_por_semestre', dg.sesiones_por_semestre,
  'sesiones_aula', dg.sesiones_aula,
  'sesiones_laboratorio', dg.sesiones_laboratorio,
  'sesiones_clinica', dg.sesiones_clinica,
  'sesiones_otro', dg.sesiones_otro,
  'horas_teoria', dg.horas_teoria,
  'horas_practica', dg.horas_practica,
  'horas_aula', dg.horas_aula,
  'horas_laboratorio', dg.horas_laboratorio,
  'horas_clinica', dg.horas_clinica,
  'horas_otro', dg.horas_otro,
  'horas_total', dg.horas_total,
  'unidad_aprendizaje_nombre', p.asignatura,
  'creditos_tepic', dg.creditos_tepic,
  'creditos_satca', dg.creditos_satca,

  -- Relaciones / ejes
  'antecedentes', re.antecedentes,
  'laterales', re.laterales,
  'subsecuentes', re.subsecuentes,
  'ejes_compromiso_social_sustentabilidad', re.ejes_compromiso_social_sustentabilidad,
  'ejes_perspectiva_genero', re.ejes_perspectiva_genero,
  'ejes_internacionalizacion', re.ejes_internacionalizacion,

  -- Organización didáctica (header)
  'org_proposito', org.proposito,
  'org_estrategia', org.estrategia,
  'org_metodos', org.metodos,

  -- Plagio
  'plagio_ithenticate', pl.ithenticate,
  'plagio_turnitin', pl.turnitin,
  'plagio_otro', pl.otro,

  -- Referencias
  'referencias', COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'cita_apa', r.cita_apa,
          'unidades_aplica', r.unidades_aplica,
          'tipo', r.tipo
        )
        ORDER BY r.id
      )
      FROM planeacion_referencias r
      WHERE r.planeacion_id = p.id
    ),
    '[]'::json
  ),

  -- >>> Unidades temáticas + sesiones (bloques)
  'unidades_tematicas', COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', ut.id,
          'numero', ut.numero,
          'nombre_unidad_tematica', ut.nombre_unidad_tematica,
          'unidad_competencia', ut.unidad_competencia,
          'periodo_desarrollo', json_build_object(
            'del', ut.periodo_del,
            'al', ut.periodo_al
          ),
          'horas', json_build_object(
            'aula', ut.horas_aula,
            'laboratorio', ut.horas_laboratorio,
            'taller', ut.horas_taller,
            'clinica', ut.horas_clinica,
            'otro', ut.horas_otro
          ),
          'sesiones_por_espacio', json_build_object(
            'aula', ut.sesiones_aula,
            'laboratorio', ut.sesiones_laboratorio,
            'taller', ut.sesiones_taller,
            'clinica', ut.sesiones_clinica,
            'otro', ut.sesiones_otro
          ),
          'sesiones_totales', ut.sesiones_totales,
          'porcentaje', ut.porcentaje,
          'periodo_registro_eval', ut.periodo_registro_eval,
          'aprendizajes_esperados', ut.aprendizajes_esperados,
          'precisiones', ut.precisiones,
          'bloques', COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', sd.id,
                  'numero_sesion', sd.numero_sesion,
                  'temas_subtemas', sd.temas_subtemas,
                  'actividades', json_build_object(
                    'inicio', sd.actividades_inicio,
                    'desarrollo', sd.actividades_desarrollo,
                    'cierre', sd.actividades_cierre
                  ),
                  'recursos', sd.recursos,
                  'evidencias', sd.evidencias,
                  'instrumentos', sd.instrumentos,
                  'valor_porcentual', sd.valor_porcentual
                )
                ORDER BY sd.numero_sesion
              )
              FROM sesiones_didacticas sd
              WHERE sd.unidad_tematica_id = ut.id
            ),
            '[]'::json
          )
        )
        ORDER BY ut.numero
      )
      FROM unidades_tematicas ut
      WHERE ut.planeacion_id = p.id
    ),
    '[]'::json
  )
)
FROM planeaciones p
LEFT JOIN planeacion_datos_generales dg ON dg.planeacion_id = p.id
LEFT JOIN planeacion_relaciones_ejes re ON re.planeacion_id = p.id
LEFT JOIN planeacion_organizacion org ON org.planeacion_id = p.id
LEFT JOIN planeacion_plagio pl ON pl.planeacion_id = p.id
WHERE p.id = $1 AND p.docente_id = $2
		`,
		id,
		claims.UserID,
	)

	var rawJSON []byte
	if err := row.Scan(&rawJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
		return
	}

	var payload map[string]any
	if err := json.Unmarshal(rawJSON, &payload); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parseando JSON: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, payload)
}

// =============================
// POST /api/planeaciones/:id/reabrir
// ✅ Reabre una planeación finalizada para permitir edición.
// - status: borrador
// - finalizada_at: NULL
// - updated_at: now()
// - slug se conserva (no afecta URL pública)
// =============================

func (h *PlaneacionesHandler) Reabrir(c *gin.Context) {
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

	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar transacción: " + err.Error()})
		return
	}
	defer tx.Rollback(c)

	var status string
	err = tx.QueryRow(
		c,
		`SELECT status FROM planeaciones WHERE id = $1 AND docente_id = $2`,
		id,
		claims.UserID,
	).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada o no pertenece al usuario"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
		return
	}

	status = strings.TrimSpace(strings.ToLower(status))
	if status != "finalizada" {
		// idempotente “amable”: si ya está borrador, no falla
		if status == "borrador" {
			c.JSON(http.StatusOK, gin.H{"ok": true, "status": "borrador"})
			return
		}
		// si existieran otros estados a futuro:
		c.JSON(http.StatusConflict, gin.H{"error": "La planeación no está finalizada."})
		return
	}

	_, err = tx.Exec(
		c,
		`
UPDATE planeaciones
SET
  status = 'borrador',
  finalizada_at = NULL,
  updated_at = now()
WHERE id = $1 AND docente_id = $2
		`,
		id,
		claims.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo reabrir la planeación: " + err.Error()})
		return
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo confirmar transacción: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "status": "borrador"})
}

// =============================
// PUT /api/planeaciones/:id
// Actualiza campos de planeaciones + tablas por sección
// =============================

type updatePlaneacionRequest struct {
	NombrePlaneacion        *string `json:"nombre_planeacion"`
	Status                  *string `json:"status"`
	PeriodoEscolar          *string `json:"periodo_escolar"`
	PlanEstudiosAnio        *int    `json:"plan_estudios_anio"`
	SemestreNivel           *string `json:"semestre_nivel"`
	Grupos                  *string `json:"grupos"`
	ProgramaAcademico       *string `json:"programa_academico"`
	Academia                *string `json:"academia"`
	UnidadAprendizajeNombre *string `json:"unidad_aprendizaje_nombre"`
	AreaFormacion           *string `json:"area_formacion"`
	Modalidad               *string `json:"modalidad"`

	SesionesPorSemestre *int `json:"sesiones_por_semestre"`
	SesionesAula        *int `json:"sesiones_aula"`
	SesionesLaboratorio *int `json:"sesiones_laboratorio"`
	SesionesClinica     *int `json:"sesiones_clinica"`
	SesionesOtro        *int `json:"sesiones_otro"`

	HorasTeoria      *float64 `json:"horas_teoria"`
	HorasPractica    *float64 `json:"horas_practica"`
	HorasAula        *float64 `json:"horas_aula"`
	HorasLaboratorio *float64 `json:"horas_laboratorio"`
	HorasClinica     *float64 `json:"horas_clinica"`
	HorasOtro        *float64 `json:"horas_otro"`
	HorasTotal       *float64 `json:"horas_total"`

	CreditosTepic *float64 `json:"creditos_tepic"`
	CreditosSatca *float64 `json:"creditos_satca"`

	Antecedentes *string `json:"antecedentes"`
	Laterales    *string `json:"laterales"`
	Subsecuentes *string `json:"subsecuentes"`

	EjesCompromiso           *string `json:"ejes_compromiso_social_sustentabilidad"`
	EjesPerspectivaGenero    *string `json:"ejes_perspectiva_genero"`
	EjesInternacionalizacion *string `json:"ejes_internacionalizacion"`

	OrgProposito  *string `json:"org_proposito"`
	OrgEstrategia *string `json:"org_estrategia"`
	OrgMetodos    *string `json:"org_metodos"`

	PlagioIthenticate *bool   `json:"plagio_ithenticate"`
	PlagioTurnitin    *bool   `json:"plagio_turnitin"`
	PlagioOtro        *string `json:"plagio_otro"`

	Referencias       *[]ReferenciaPayload     `json:"referencias"`
	UnidadesTematicas *[]UnidadTematicaPayload `json:"unidades_tematicas"`
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

	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar transacción: " + err.Error()})
		return
	}
	defer tx.Rollback(c)

	// ✅ existencia + status actual (para bloquear edición si está finalizada)
	var currentStatus string
	err = tx.QueryRow(
		c,
		`SELECT status FROM planeaciones WHERE id = $1 AND docente_id = $2`,
		id,
		claims.UserID,
	).Scan(&currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada o no pertenece al usuario"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando planeación: " + err.Error()})
		return
	}

	cur := strings.TrimSpace(strings.ToLower(currentStatus))
	if cur == "finalizada" {
		// Si está finalizada, NO se permite editar vía PUT
		// (reabrir primero con POST /:id/reabrir)
		// Permitimos explícitamente que el cliente intente cambiar status a borrador,
		// pero lo dejamos “limpio” forzando a usar /reabrir.
		c.JSON(http.StatusConflict, gin.H{
			"error": "Planeación finalizada. Para editar debes reabrirla primero.",
			"hint":  "POST /api/planeaciones/:id/reabrir",
		})
		return
	}

	_, err = tx.Exec(
		c,
		`
UPDATE planeaciones
SET
  nombre_planeacion = COALESCE($1, nombre_planeacion),
  status            = COALESCE($2, status),
  asignatura        = COALESCE($3, asignatura),
  periodo           = COALESCE($4, periodo),
  grupo             = COALESCE($5, grupo),
  updated_at        = now()
WHERE id = $6 AND docente_id = $7
		`,
		strOrNil(body.NombrePlaneacion),
		strOrNil(body.Status),
		strOrNil(body.UnidadAprendizajeNombre),
		strOrNil(body.PeriodoEscolar),
		strOrNil(body.Grupos),
		id,
		claims.UserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar planeación: " + err.Error()})
		return
	}

	// ==========================================================
	// ✅ SLUG + finalizada_at (NUEVO, no rompe lo existente)
	// - Solo si el cliente manda status="finalizada"
	// - Genera slug solo si está vacío/NULL
	// - finalizada_at solo si estaba NULL
	// ==========================================================
	if body.Status != nil && strings.TrimSpace(*body.Status) == "finalizada" {
		var (
			existingSlug *string
			nombre       string
			asignatura   *string
			finalizadaAt *time.Time
		)

		err := tx.QueryRow(
			c,
			`
			SELECT slug, nombre_planeacion, asignatura, finalizada_at
			FROM planeaciones
			WHERE id = $1 AND docente_id = $2
			`,
			id,
			claims.UserID,
		).Scan(&existingSlug, &nombre, &asignatura, &finalizadaAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer slug: " + err.Error()})
			return
		}

		needsSlug := existingSlug == nil || strings.TrimSpace(*existingSlug) == ""
		if needsSlug {
			asig := ""
			if asignatura != nil {
				asig = strings.TrimSpace(*asignatura)
			}
			base := strings.TrimSpace(nombre)
			newSlug := slugify(base + "-" + asig + "-" + strconv.Itoa(id))

			_, err = tx.Exec(
				c,
				`
				UPDATE planeaciones
				SET
				  slug = $1,
				  finalizada_at = COALESCE(finalizada_at, now()),
				  updated_at = now()
				WHERE id = $2 AND docente_id = $3
				`,
				newSlug,
				id,
				claims.UserID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar slug: " + err.Error()})
				return
			}
		} else {
			_, err = tx.Exec(
				c,
				`
				UPDATE planeaciones
				SET
				  finalizada_at = COALESCE(finalizada_at, now()),
				  updated_at = now()
				WHERE id = $1 AND docente_id = $2
				`,
				id,
				claims.UserID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo fijar finalizada_at: " + err.Error()})
				return
			}
		}
	}

	cmd, err := tx.Exec(
		c,
		`
UPDATE planeacion_datos_generales
SET
  periodo               = $2,
  plan_estudios_anio    = $3,
  semestre_nivel        = $4,
  grupos                = $5,
  programa_academico    = $6,
  academia              = $7,
  area_formacion        = $8,
  modalidad             = $9,
  sesiones_por_semestre = $10,
  sesiones_aula         = $11,
  sesiones_laboratorio  = $12,
  sesiones_clinica      = $13,
  sesiones_otro         = $14,
  horas_teoria          = $15,
  horas_practica        = $16,
  horas_aula            = $17,
  horas_laboratorio     = $18,
  horas_clinica         = $19,
  horas_otro            = $20,
  horas_total           = $21,
  creditos_tepic        = $22,
  creditos_satca        = $23,
  updated_at            = now()
WHERE planeacion_id = $1
		`,
		id,
		strOrNil(body.PeriodoEscolar),
		intOrNil(body.PlanEstudiosAnio),
		strOrNil(body.SemestreNivel),
		strOrNil(body.Grupos),
		strOrNil(body.ProgramaAcademico),
		strOrNil(body.Academia),
		strOrNil(body.AreaFormacion),
		strOrNil(body.Modalidad),
		intOrNil(body.SesionesPorSemestre),
		intOrNil(body.SesionesAula),
		intOrNil(body.SesionesLaboratorio),
		intOrNil(body.SesionesClinica),
		intOrNil(body.SesionesOtro),
		floatOrNil(body.HorasTeoria),
		floatOrNil(body.HorasPractica),
		floatOrNil(body.HorasAula),
		floatOrNil(body.HorasLaboratorio),
		floatOrNil(body.HorasClinica),
		floatOrNil(body.HorasOtro),
		floatOrNil(body.HorasTotal),
		floatOrNil(body.CreditosTepic),
		floatOrNil(body.CreditosSatca),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar datos generales: " + err.Error()})
		return
	}
	if cmd.RowsAffected() == 0 {
		_, err = tx.Exec(
			c,
			`
INSERT INTO planeacion_datos_generales (
  planeacion_id,
  periodo,
  plan_estudios_anio,
  semestre_nivel,
  grupos,
  programa_academico,
  academia,
  area_formacion,
  modalidad,
  sesiones_por_semestre,
  sesiones_aula,
  sesiones_laboratorio,
  sesiones_clinica,
  sesiones_otro,
  horas_teoria,
  horas_practica,
  horas_aula,
  horas_laboratorio,
  horas_clinica,
  horas_otro,
  horas_total,
  creditos_tepic,
  creditos_satca
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
)
			`,
			id,
			strOrNil(body.PeriodoEscolar),
			intOrNil(body.PlanEstudiosAnio),
			strOrNil(body.SemestreNivel),
			strOrNil(body.Grupos),
			strOrNil(body.ProgramaAcademico),
			strOrNil(body.Academia),
			strOrNil(body.AreaFormacion),
			strOrNil(body.Modalidad),
			intOrNil(body.SesionesPorSemestre),
			intOrNil(body.SesionesAula),
			intOrNil(body.SesionesLaboratorio),
			intOrNil(body.SesionesClinica),
			intOrNil(body.SesionesOtro),
			floatOrNil(body.HorasTeoria),
			floatOrNil(body.HorasPractica),
			floatOrNil(body.HorasAula),
			floatOrNil(body.HorasLaboratorio),
			floatOrNil(body.HorasClinica),
			floatOrNil(body.HorasOtro),
			floatOrNil(body.HorasTotal),
			floatOrNil(body.CreditosTepic),
			floatOrNil(body.CreditosSatca),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo insertar datos generales: " + err.Error()})
			return
		}
	}

	cmd, err = tx.Exec(
		c,
		`
UPDATE planeacion_relaciones_ejes
SET
  antecedentes                           = $2,
  laterales                              = $3,
  subsecuentes                           = $4,
  ejes_compromiso_social_sustentabilidad = $5,
  ejes_perspectiva_genero                = $6,
  ejes_internacionalizacion              = $7,
  updated_at                             = now()
WHERE planeacion_id = $1
		`,
		id,
		strOrNil(body.Antecedentes),
		strOrNil(body.Laterales),
		strOrNil(body.Subsecuentes),
		strOrNil(body.EjesCompromiso),
		strOrNil(body.EjesPerspectivaGenero),
		strOrNil(body.EjesInternacionalizacion),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar relaciones/ejes: " + err.Error()})
		return
	}
	if cmd.RowsAffected() == 0 {
		_, err = tx.Exec(
			c,
			`
INSERT INTO planeacion_relaciones_ejes (
  planeacion_id,
  antecedentes,
  laterales,
  subsecuentes,
  ejes_compromiso_social_sustentabilidad,
  ejes_perspectiva_genero,
  ejes_internacionalizacion
) VALUES (
  $1,$2,$3,$4,$5,$6,$7
)
			`,
			id,
			strOrNil(body.Antecedentes),
			strOrNil(body.Laterales),
			strOrNil(body.Subsecuentes),
			strOrNil(body.EjesCompromiso),
			strOrNil(body.EjesPerspectivaGenero),
			strOrNil(body.EjesInternacionalizacion),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo insertar relaciones/ejes: " + err.Error()})
			return
		}
	}

	cmd, err = tx.Exec(
		c,
		`
UPDATE planeacion_organizacion
SET
  proposito = $2,
  estrategia = $3,
  metodos = $4,
  updated_at = now()
WHERE planeacion_id = $1
		`,
		id,
		strOrNil(body.OrgProposito),
		strOrNil(body.OrgEstrategia),
		strOrNil(body.OrgMetodos),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar organización: " + err.Error()})
		return
	}
	if cmd.RowsAffected() == 0 {
		_, err = tx.Exec(
			c,
			`
INSERT INTO planeacion_organizacion (
  planeacion_id,
  proposito,
  estrategia,
  metodos
) VALUES (
  $1,$2,$3,$4
)
			`,
			id,
			strOrNil(body.OrgProposito),
			strOrNil(body.OrgEstrategia),
			strOrNil(body.OrgMetodos),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo insertar organización: " + err.Error()})
			return
		}
	}

	cmd, err = tx.Exec(
		c,
		`
UPDATE planeacion_plagio
SET
  ithenticate = COALESCE($2, ithenticate),
  turnitin    = COALESCE($3, turnitin),
  otro        = $4,
  updated_at  = now()
WHERE planeacion_id = $1
		`,
		id,
		boolOrNil(body.PlagioIthenticate),
		boolOrNil(body.PlagioTurnitin),
		strOrNil(body.PlagioOtro),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar plagio: " + err.Error()})
		return
	}
	if cmd.RowsAffected() == 0 {
		_, err = tx.Exec(
			c,
			`
INSERT INTO planeacion_plagio (
  planeacion_id,
  ithenticate,
  turnitin,
  otro
) VALUES (
  $1, COALESCE($2,false), COALESCE($3,false), $4
)
			`,
			id,
			boolOrNil(body.PlagioIthenticate),
			boolOrNil(body.PlagioTurnitin),
			strOrNil(body.PlagioOtro),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo insertar plagio: " + err.Error()})
			return
		}
	}

	// ─────────────────────────────
	// Referencias (reemplazar todas)
	// ─────────────────────────────
	if body.Referencias != nil {
		_, err = tx.Exec(
			c,
			`DELETE FROM planeacion_referencias WHERE planeacion_id = $1`,
			id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "No se pudieron limpiar referencias: " + err.Error(),
			})
			return
		}

		for _, ref := range *body.Referencias {
			cita := strings.TrimSpace(ref.CitaAPA)
			if cita == "" {
				continue
			}

			tipo := strings.TrimSpace(ref.Tipo)
			if tipo == "" {
				tipo = "Básica"
			}

			_, err = tx.Exec(
				c,
				`
INSERT INTO planeacion_referencias (
  planeacion_id,
  cita_apa,
  unidades_aplica,
  tipo
) VALUES ($1, $2, $3, $4)
				`,
				id,
				cita,
				ref.UnidadesAplica,
				tipo,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "No se pudo insertar referencia: " + err.Error(),
				})
				return
			}
		}
	}

	// ─────────────────────────────
	// >>> Unidades temáticas + sesiones didácticas
	// ─────────────────────────────
	if body.UnidadesTematicas != nil {
		uts := *body.UnidadesTematicas

		if len(uts) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Debes registrar al menos una unidad temática.",
			})
			return
		}

		for _, ut := range uts {
			sumPct := 0
			for _, b := range ut.Bloques {
				if b.ValorPorcentual < 0 {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "El valor porcentual de una sesión no puede ser negativo.",
					})
					return
				}
				sumPct += b.ValorPorcentual
			}
			if sumPct > 100 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "La suma de valores porcentuales de las sesiones de una unidad no debe exceder 100.",
				})
				return
			}
		}

		_, err = tx.Exec(
			c,
			`DELETE FROM unidades_tematicas WHERE planeacion_id = $1`,
			id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "No se pudieron limpiar unidades temáticas: " + err.Error(),
			})
			return
		}

		for _, ut := range uts {
			var perDel, perAl *string
			if ut.PeriodoDesarrollo.Del != nil {
				s := strings.TrimSpace(*ut.PeriodoDesarrollo.Del)
				if s != "" {
					perDel = &s
				}
			}
			if ut.PeriodoDesarrollo.Al != nil {
				s := strings.TrimSpace(*ut.PeriodoDesarrollo.Al)
				if s != "" {
					perAl = &s
				}
			}

			sumPct := 0
			for _, b := range ut.Bloques {
				sumPct += b.ValorPorcentual
			}
			var porc *int
			if ut.Porcentaje != nil {
				porc = ut.Porcentaje
			} else {
				porc = &sumPct
			}

			var unidadID int64
			err = tx.QueryRow(
				c,
				`
INSERT INTO unidades_tematicas (
  planeacion_id,
  numero,
  nombre_unidad_tematica,
  unidad_competencia,
  periodo_del,
  periodo_al,
  horas_aula,
  horas_laboratorio,
  horas_taller,
  horas_clinica,
  horas_otro,
  sesiones_aula,
  sesiones_laboratorio,
  sesiones_taller,
  sesiones_clinica,
  sesiones_otro,
  sesiones_totales,
  porcentaje,
  periodo_registro_eval,
  aprendizajes_esperados,
  precisiones
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,$8,$9,$10,$11,
  $12,$13,$14,$15,$16,
  $17,
  $18,
  $19,
  $20,
  $21
)
RETURNING id
				`,
				id,
				ut.Numero,
				strings.TrimSpace(ut.NombreUnidadTematica),
				strings.TrimSpace(ut.UnidadCompetencia),
				perDel,
				perAl,
				floatOrNil(ut.Horas.Aula),
				floatOrNil(ut.Horas.Laboratorio),
				floatOrNil(ut.Horas.Taller),
				floatOrNil(ut.Horas.Clinica),
				floatOrNil(ut.Horas.Otro),
				intOrNil(ut.SesionesPorEspacio.Aula),
				intOrNil(ut.SesionesPorEspacio.Laboratorio),
				intOrNil(ut.SesionesPorEspacio.Taller),
				intOrNil(ut.SesionesPorEspacio.Clinica),
				intOrNil(ut.SesionesPorEspacio.Otro),
				intOrNil(ut.SesionesTotales),
				intOrNil(porc),
				strOrNil(ut.PeriodoRegistroEval),
				ut.AprendizajesEsperados,
				strOrNil(ut.Precisiones),
			).Scan(&unidadID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "No se pudo insertar unidad temática: " + err.Error(),
				})
				return
			}

			for _, b := range ut.Bloques {
				_, err = tx.Exec(
					c,
					`
INSERT INTO sesiones_didacticas (
  unidad_tematica_id,
  numero_sesion,
  temas_subtemas,
  actividades_inicio,
  actividades_desarrollo,
  actividades_cierre,
  recursos,
  evidencias,
  instrumentos,
  valor_porcentual
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
)
					`,
					unidadID,
					b.NumeroSesion,
					strings.TrimSpace(b.TemasSubtemas),
					strings.TrimSpace(b.Actividades.Inicio),
					strings.TrimSpace(b.Actividades.Desarrollo),
					strings.TrimSpace(b.Actividades.Cierre),
					b.Recursos,
					b.Evidencias,
					b.Instrumentos,
					b.ValorPorcentual,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "No se pudo insertar sesión didáctica: " + err.Error(),
					})
					return
				}
			}
		}
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo confirmar transacción: " + err.Error()})
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
