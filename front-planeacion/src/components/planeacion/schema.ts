"use client";
import { z } from "zod";

// Helpers
const positiveInt = z.number().int().nonnegative();
const optStr = z.string().trim().optional().or(z.literal(""));

export const UnidadTematicaSchema = z.object({
  numero: positiveInt,
  // 🔁 nueva clave (ANTES: unidad_aprendizaje)
  nombre_unidad_tematica: z.string().trim().min(1, "Requerido"),
  unidad_competencia: z.string().trim().min(1, "Requerido"),
  periodo_desarrollo: z.object({
    del: z.string().trim().min(1, "Requerido"),
    al: z.string().trim().min(1, "Requerido"),
  }),
  horas: z.object({
    aula: z.number().nonnegative(),
    laboratorio: z.number().nonnegative(),
    taller: z.number().nonnegative(),
    clinica: z.number().nonnegative(),
    otro: z.number().nonnegative(),
  }),
  sesiones_totales: positiveInt,
  aprendizajes_esperados: z.array(z.string().trim().min(1)).min(1, "Agrega al menos uno"),
  bloques: z.array(z.object({
    numero_sesion: positiveInt,
    temas_subtemas: z.string().trim().min(1),
    actividades: z.object({
      inicio: z.string().trim().min(1),
      desarrollo: z.string().trim().min(1),
      cierre: z.string().trim().min(1),
    }),
    recursos: z.array(z.string().trim().min(1)).min(1),
    evidencias: z.array(z.string().trim().min(1)).min(1),
    valor_porcentual: z.number().min(0).max(100),
    instrumentos: z.array(z.string().trim().min(1)).min(1),
  })).min(1, "Agrega al menos una sesión"),
  precisiones: optStr,
});

export const PlaneacionSchema = z.object({
  fecha_elaboracion: z.string().trim().min(1, "Requerido"),
  unidad_academica_id: z.string().trim().min(1, "Requerido"),
  programa_academico: z.string().trim().min(1, "Requerido"),
  plan_estudios_anio: z.number().int().positive(),
  unidad_aprendizaje_nombre: z.string().trim().min(1, "Requerido"), // ← SE MANTIENE AQUÍ
  semestre_nivel: z.string().trim().min(1, "Requerido"),
  area_formacion: z.enum(["Institucional", "Científica básica", "Profesional", "Terminal y de integración"]).optional(),
  modalidad: z.enum(["Escolarizada", "No escolarizada", "Mixta"]),
  tipo_unidad: z.object({
    teorica: z.boolean(),
    practica: z.boolean(),
    teorica_practica: z.boolean(),
    clinica: z.boolean(),
    otro: z.boolean(),
    obligatoria: z.boolean(),
    optativa: z.boolean(),
    topicos_selectos: z.boolean(),
  }),
  creditos: z.object({
    tepic: z.number().nonnegative(),
    satca: z.number().nonnegative().optional(),
  }),
  academia: z.string().trim().min(1, "Requerido"),
  semanas_por_semestre: positiveInt,
  sesiones_por_semestre: positiveInt,
  horas_por_semestre: z.object({
    aula: z.number().nonnegative(),
    teoria: z.number().nonnegative(),
    laboratorio: z.number().nonnegative(),
    practica: z.number().nonnegative(),
    clinica: z.number().nonnegative(),
    otro: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
  periodo_escolar: z.string().trim().min(1, "Requerido"),
  grupos: z.string().trim().min(1, "Requerido"),
  docente_autor: z.string().trim().min(1, "Requerido"),

  antecedentes: optStr,
  laterales: optStr,
  subsecuentes: optStr,
  ejes: z.object({
    compromiso_social_sustentabilidad: optStr,
    perspectiva_genero: optStr,
    internacionalizacion: optStr,
  }),

  unidades_tematicas: z.array(UnidadTematicaSchema).min(1, "Agrega al menos una unidad temática"),

  referencias: z.array(z.object({
    cita_apa: z.string().trim().min(1, "Requerido"),
    unidades_aplica: z.array(z.number().int().positive()).min(1, "Indica al menos una unidad"),
    tipo: z.enum(["Básica", "Complementaria"]),
  })),

  plagio: z.object({
    ithenticate: z.boolean().optional(),
    turnitin: z.boolean().optional(),
    otro: z.string().trim().optional(),
  }),
});

export type PlaneacionType = z.infer<typeof PlaneacionSchema>;
export type UnidadTematicaType = z.infer<typeof UnidadTematicaSchema>;
