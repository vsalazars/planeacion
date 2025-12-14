package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// GET /api/public/planeaciones/slug/:slug
// Detalle público completo por slug (igual que GetOne, pero usando slug)
func (h *PublicPlaneacionesHandler) GetBySlug(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug requerido"})
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
  'slug', p.slug,
  'status', p.status,
  'created_at', p.created_at,
  'updated_at', p.updated_at,
  'secciones_completas', p.secciones_completas,

  -- Extras públicos
  'profesor', u.nombre_completo,
  'unidad_academica', ua.nombre,
  'unidad_academica_abreviatura', ua.abreviatura,

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

  -- Organización didáctica
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

  -- Unidades temáticas + sesiones
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
JOIN usuarios u ON u.id = p.docente_id
JOIN unidades_academicas ua ON ua.id = p.unidad_academica_id
LEFT JOIN planeacion_datos_generales dg ON dg.planeacion_id = p.id
LEFT JOIN planeacion_relaciones_ejes re ON re.planeacion_id = p.id
LEFT JOIN planeacion_organizacion org ON org.planeacion_id = p.id
LEFT JOIN planeacion_plagio pl ON pl.planeacion_id = p.id
WHERE p.slug = $1
  AND p.status = 'finalizada'
LIMIT 1
		`,
		slug,
	)

	var rawJSON []byte
	if err := row.Scan(&rawJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Planeación no encontrada (o no publicada)"})
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
