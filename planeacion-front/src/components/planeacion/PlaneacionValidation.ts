// src/components/planeacion/PlaneacionValidation.ts
import { PlaneacionType } from "./schema";

export const TABS = [
  "datos",
  "relaciones",
  "organizacion",
  "referencias",
  "plagio",
] as const;

export type TabKey = (typeof TABS)[number];
export type SectionKey = TabKey;

export type SectionProgress = {
  missing: string[];
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  datos: "1. Datos generales",
  relaciones: "2. Relaciones y ejes",
  organizacion: "3. Organización didáctica",
  referencias: "4. Referencias",
  plagio: "5. Plagio",
};

export function computeSectionProgress(
  values: PlaneacionType
): Record<SectionKey, SectionProgress> {
  const prog: Record<SectionKey, SectionProgress> = {
    datos: { missing: [] },
    relaciones: { missing: [] },
    organizacion: { missing: [] },
    referencias: { missing: [] },
    plagio: { missing: [] },
  };

  const isEmptyLocal = (v: unknown) =>
    v === undefined ||
    v === null ||
    (typeof v === "string" && v.trim() === "");

  // ───────────── 1. DATOS GENERALES ─────────────
  if (isEmptyLocal(values.periodo_escolar))
    prog.datos.missing.push("Periodo escolar (1.1)");
  if (isEmptyLocal(values.plan_estudios_anio))
    prog.datos.missing.push("Año del plan de estudios (1.2)");
  if (isEmptyLocal(values.semestre_nivel))
    prog.datos.missing.push("Semestre / nivel (1.3)");
  if (isEmptyLocal(values.programa_academico))
    prog.datos.missing.push("Programa académico (1.4)");

  if (isEmptyLocal(values.academia))
    prog.datos.missing.push("Academia (1.5)");

  if (isEmptyLocal(values.unidad_aprendizaje_nombre))
    prog.datos.missing.push("Unidad de aprendizaje (1.6)");
  if (isEmptyLocal(values.area_formacion))
    prog.datos.missing.push("Área de formación (1.7)");
  if (isEmptyLocal(values.modalidad))
    prog.datos.missing.push("Modalidad (1.8)");
  if (isEmptyLocal(values.grupos))
    prog.datos.missing.push("Grupo(s) (1.10)");

  const creditos: any = (values as any).creditos || {};
  const credTepic = Number(creditos.tepic ?? 0);
  const credSatca = Number(creditos.satca ?? 0);
  const totalCreditos = credTepic + credSatca;

  if (!Number.isFinite(totalCreditos) || totalCreditos <= 0) {
    prog.datos.missing.push(
      "Créditos TEPIC / SATCA (1.9–1.10): captura al menos un crédito"
    );
  }

  const sesionesPorSem = Number(values.sesiones_por_semestre ?? 0);
  if (!Number.isFinite(sesionesPorSem) || sesionesPorSem <= 0) {
    prog.datos.missing.push("No. de sesiones por semestre (1.11)");
  }

  const detSes: any = (values as any).sesiones_por_semestre_det || {};
  const sesionesAula = Number(detSes.aula ?? 0);
  const sesionesLab = Number(detSes.laboratorio ?? 0);
  const sesionesClinica = Number(detSes.clinica ?? 0);
  const sesionesOtro = Number(detSes.otro ?? 0);
  const totalSesionesEspacio =
    sesionesAula + sesionesLab + sesionesClinica + sesionesOtro;

  if (totalSesionesEspacio <= 0) {
    prog.datos.missing.push(
      "Distribuir No. de sesiones por semestre en aula / laboratorio / clínica / otro (1.11)"
    );
  } else if (sesionesPorSem > 0 && totalSesionesEspacio !== sesionesPorSem) {
    prog.datos.missing.push(
      "La suma de aula/laboratorio/clínica/otro debe coincidir con el total de sesiones por semestre (1.11)"
    );
  }

  const horasSem = values.horas_por_semestre || {};
  const hTeoria = Number(horasSem.teoria ?? 0);
  const hPractica = Number(horasSem.practica ?? 0);
  const hAula = Number(horasSem.aula ?? 0);
  const hLab = Number(horasSem.laboratorio ?? 0);
  const hClinica = Number(horasSem.clinica ?? 0);
  const hOtro = Number(horasSem.otro ?? 0);
  const hTotal = Number(horasSem.total ?? 0);

  if (!Number.isFinite(hTotal) || hTotal <= 0) {
    prog.datos.missing.push("Total de horas por semestre (1.12)");
  }

  if (hTeoria + hPractica <= 0) {
    prog.datos.missing.push(
      "Horas por semestre — por tipo (teoría / práctica) (1.12)"
    );
  }

  if (hAula + hLab + hClinica + hOtro <= 0) {
    prog.datos.missing.push(
      "Horas por semestre — por espacio (aula / laboratorio / clínica / otro) (1.12)"
    );
  }

  // ───────────── 2. RELACIONES / EJES ─────────────
  if (isEmptyLocal(values.antecedentes))
    prog.relaciones.missing.push("Antecedentes (2.1)");
  if (isEmptyLocal(values.laterales))
    prog.relaciones.missing.push("Laterales (2.2)");
  if (isEmptyLocal(values.subsecuentes))
    prog.relaciones.missing.push("Subsecuentes (2.3)");
  if (isEmptyLocal(values.ejes?.compromiso_social_sustentabilidad))
    prog.relaciones.missing.push(
      "Compromiso social y sustentabilidad (2.4)"
    );
  if (isEmptyLocal(values.ejes?.perspectiva_genero))
    prog.relaciones.missing.push("Perspectiva de género (2.5)");
  if (isEmptyLocal(values.ejes?.internacionalizacion))
    prog.relaciones.missing.push("Internacionalización (2.6)");

  // ───────────── 3. ORGANIZACIÓN ─────────────
  (values.unidades_tematicas || []).forEach((u, idx) => {
    const n = idx + 1;

    if (isEmptyLocal(u.nombre_unidad_tematica))
      prog.organizacion.missing.push(`Unidad temática ${n}: nombre`);
    if (isEmptyLocal(u.unidad_competencia))
      prog.organizacion.missing.push(
        `Unidad temática ${n}: unidad de competencia`
      );

    if (
      isEmptyLocal(u.periodo_desarrollo?.del) ||
      isEmptyLocal(u.periodo_desarrollo?.al)
    ) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: periodo de desarrollo`
      );
    }

    const hUT = u.horas || {};
    const hUTTotal =
      Number(hUT.aula ?? 0) +
      Number(hUT.laboratorio ?? 0) +
      Number(hUT.taller ?? 0) +
      Number(hUT.clinica ?? 0) +
      Number(hUT.otro ?? 0);
    if (hUTTotal <= 0) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: horas por espacio (aula / laboratorio / taller / clínica / otro)`
      );
    }

    const sUT = u.sesiones_por_espacio || {};
    const sUTTotal =
      Number(sUT.aula ?? 0) +
      Number(sUT.laboratorio ?? 0) +
      Number(sUT.taller ?? 0) +
      Number(sUT.clinica ?? 0) +
      Number(sUT.otro ?? 0);
    if (sUTTotal <= 0) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: sesiones por espacio (aula / laboratorio / taller / clínica / otro)`
      );
    }

    if ((u.aprendizajes_esperados || []).every((a) => isEmptyLocal(a))) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: aprendizajes esperados`
      );
    }

    if ((u.bloques || []).length === 0) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: bloques de sesiones`
      );
    }

    if (isEmptyLocal(u.precisiones)) {
      prog.organizacion.missing.push(
        `Unidad temática ${n}: precisiones de la unidad`
      );
    }

    (u.bloques || []).forEach((b, j) => {
      const s = j + 1;
      const prefix = `Unidad temática ${n}, sesión ${s}:`;

      if (isEmptyLocal(b.temas_subtemas)) {
        prog.organizacion.missing.push(`${prefix} temas y subtemas`);
      }

      if (isEmptyLocal(b.actividades?.inicio)) {
        prog.organizacion.missing.push(
          `${prefix} actividades de inicio`
        );
      }
      if (isEmptyLocal(b.actividades?.desarrollo)) {
        prog.organizacion.missing.push(
          `${prefix} actividades de desarrollo`
        );
      }
      if (isEmptyLocal(b.actividades?.cierre)) {
        prog.organizacion.missing.push(
          `${prefix} actividades de cierre`
        );
      }

      const recursos = Array.isArray(b.recursos) ? b.recursos : [];
      const anyRecurso = recursos.some((r) => !isEmptyLocal(r));
      if (!anyRecurso) {
        prog.organizacion.missing.push(`${prefix} recursos didácticos`);
      }

      const evidencias = Array.isArray(b.evidencias) ? b.evidencias : [];
      const anyEvidencia = evidencias.some((e) => !isEmptyLocal(e));
      if (!anyEvidencia) {
        prog.organizacion.missing.push(
          `${prefix} evidencias de aprendizaje`
        );
      }

      const instrumentos = Array.isArray(b.instrumentos)
        ? b.instrumentos
        : [];
      const anyInstr = instrumentos.some((i) => !isEmptyLocal(i));
      if (!anyInstr) {
        prog.organizacion.missing.push(
          `${prefix} instrumentos de evaluación`
        );
      }

      const v = Number(b.valor_porcentual ?? 0);
      if (!Number.isFinite(v) || v <= 0) {
        prog.organizacion.missing.push(
          `${prefix} valor porcentual (> 0%)`
        );
      }
    });
  });

  // ───────────── 4. REFERENCIAS ─────────────
  const refs: any[] = ((values as any).referencias || []) as any[];
  if (!refs.length) {
    prog.referencias.missing.push("Agregar al menos una referencia (4.1)");
  }

  // ───────────── 5. PLAGIO ─────────────
  const plagio: any = (values as any).plagio || {};
  const anyPlagio =
    !!plagio.ithenticate ||
    !!plagio.turnitin ||
    !isEmptyLocal(plagio.otro);
  if (!anyPlagio) {
    prog.plagio.missing.push(
      "Seleccionar al menos una herramienta o describir otra (5.1)"
    );
  }

  return prog;
}
