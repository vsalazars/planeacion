"use client";

import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PlaneacionSchema, PlaneacionType } from "./schema";

import DatosGenerales from "../sections/DatosGenerales";
import RelacionesEjes from "../sections/RelacionesEjes";
import UnidadTematica from "../sections/UnidadTematica";
import Referencias from "../sections/Referencias";
import Plagio from "../sections/Plagio";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import PlaneacionAside from "./PlaneacionAside";
import {
  TABS,
  TabKey,
  SectionKey,
  SectionProgress,
  computeSectionProgress,
} from "./PlaneacionValidation";

type Unidad = { id: number; nombre: string; abreviatura?: string | null };

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

export default function PlaneacionForm({
  token,
  planeacionId: planeacionIdProp,
  initialNombrePlaneacion,
  onFinalizar,
  onSaved,
  onCreated,
  readOnly = false,
}: {
  token: string;
  planeacionId?: number | null;
  initialNombrePlaneacion?: string;
  onFinalizar?: () => void;
  onSaved?: () => void;
  onCreated?: (newId: number) => void;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("datos");
  const [planeacionId, setPlaneacionId] = useState<number | null>(
    planeacionIdProp ?? null
  );

  const [planeacionNombre, setPlaneacionNombre] = useState<string>(
    initialNombrePlaneacion || "Borrador"
  );

  const [sectionProgress, setSectionProgress] = useState<
    Record<SectionKey, SectionProgress>
  >({
    datos: { missing: [] },
    relaciones: { missing: [] },
    organizacion: { missing: [] },
    referencias: { missing: [] },
    plagio: { missing: [] },
  });

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState<string | null>(null);

  const hasPlaneacionContext = !!planeacionId || !!initialNombrePlaneacion;

  useEffect(() => {
    if (!planeacionId) {
      setPlaneacionNombre(initialNombrePlaneacion || "Borrador");
    }
  }, [initialNombrePlaneacion, planeacionId]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setULoading(true);
        setUError(null);
        const res = await fetch(`${API_BASE}/unidades`, { cache: "no-store" });
        if (!res.ok) throw new Error(`No se pudo cargar (${res.status})`);
        const data = await res.json();
        const items: Unidad[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        if (!cancel) setUnidades(items);
      } catch (e: any) {
        if (!cancel) setUError(e?.message || "Error cargando unidades");
      } finally {
        if (!cancel) setULoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (planeacionIdProp != null) {
      setPlaneacionId(planeacionIdProp);
      return;
    }
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("planeacion_actual_id");
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) setPlaneacionId(parsed);
  }, [planeacionIdProp]);

  const form = useForm<PlaneacionType>({
    resolver: zodResolver(PlaneacionSchema),
    defaultValues: {
      fecha_elaboracion: "",
      unidad_academica_id: "",
      programa_academico: "",
      plan_estudios_anio: new Date().getFullYear(),
      unidad_aprendizaje_nombre: "",
      semestre_nivel: "",
      area_formacion: undefined,
      modalidad: "Escolarizada",
      tipo_unidad: {
        teorica: false,
        practica: false,
        teorica_practica: false,
        clinica: false,
        otro: false,
        obligatoria: false,
        optativa: false,
        topicos_selectos: false,
      },
      creditos: { tepic: 0, satca: 0 },
      academia: "",
      semanas_por_semestre: 16,
      sesiones_por_semestre: 0,
      sesiones_por_semestre_det: { aula: 0, laboratorio: 0, clinica: 0, otro: 0 },
      horas_por_semestre: {
        aula: 0,
        teoria: 0,
        laboratorio: 0,
        practica: 0,
        clinica: 0,
        otro: 0,
        total: 0,
      },
      periodo_escolar: "",
      grupos: "",
      docente_autor: "",
      antecedentes: "",
      laterales: "",
      subsecuentes: "",
      ejes: {
        compromiso_social_sustentabilidad: "",
        perspectiva_genero: "",
        internacionalizacion: "",
      },
      // @ts-expect-error
      organizacion: { proposito: "", estrategia: "", metodos: "" },
      unidades_tematicas: [
        {
          numero: 1,
          nombre_unidad_tematica: "",
          unidad_competencia: "",
          periodo_desarrollo: { del: "", al: "" },
          horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
          sesiones_por_espacio: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
          sesiones_totales: 0,
          periodo_registro_eval: "",
          aprendizajes_esperados: [""],
          bloques: [
            {
              numero_sesion: 1,
              temas_subtemas: "",
              actividades: { inicio: "", desarrollo: "", cierre: "" },
              recursos: [""],
              evidencias: [""],
              valor_porcentual: 0,
              instrumentos: [""],
            },
          ],
          precisiones: "",
        },
      ],
      referencias: [],
      // @ts-expect-error
      plagio: { ithenticate: false, turnitin: false, otro: "" },
    },
    mode: "onSubmit",
  });

  const {
    control,
    reset,
    formState: { isSubmitting },
    trigger,
    setValue,
  } = form;

  const ut = useFieldArray<PlaneacionType>({
    control,
    name: "unidades_tematicas",
  });

  const uts = useWatch({ control, name: "unidades_tematicas" });
  const sesionesPorSemestre = useWatch({ control, name: "sesiones_por_semestre" });
  const totalHorasDeclarado = useWatch({ control, name: "horas_por_semestre.total" });

  const unidadesCount = uts?.length ?? 0;

  const sumSesiones =
    (uts || []).reduce((acc, u) => acc + (u?.sesiones_totales || 0), 0) || 0;

  const sumHoras =
    (uts || []).reduce(
      (acc, u) =>
        acc +
        (u?.horas?.aula || 0) +
        (u?.horas?.laboratorio || 0) +
        (u?.horas?.taller || 0) +
        (u?.horas?.clinica || 0) +
        (u?.horas?.otro || 0),
      0
    ) || 0;

  useEffect(() => {
    const initialValues = form.getValues();
    setSectionProgress(computeSectionProgress(initialValues as PlaneacionType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!planeacionId) return;
    let cancel = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/planeaciones/${planeacionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
          throw new Error(`No se pudo cargar la planeación (${res.status})`);
        const data: any = await res.json();
        if (cancel) return;

        const current = form.getValues();

        const newValues: PlaneacionType = {
          ...current,
          periodo_escolar: data.periodo_escolar ?? "",
          plan_estudios_anio: data.plan_estudios_anio ?? current.plan_estudios_anio,
          semestre_nivel: data.semestre_nivel ?? "",
          grupos: data.grupos ?? "",
          programa_academico: data.programa_academico ?? "",
          academia: data.academia ?? "",
          unidad_aprendizaje_nombre: data.unidad_aprendizaje_nombre ?? "",
          area_formacion: data.area_formacion ?? undefined,
          modalidad: data.modalidad ?? "Escolarizada",
          sesiones_por_semestre:
            data.sesiones_por_semestre ?? current.sesiones_por_semestre,
          sesiones_por_semestre_det: {
            aula: data.sesiones_aula ?? 0,
            laboratorio: data.sesiones_laboratorio ?? 0,
            clinica: data.sesiones_clinica ?? 0,
            otro: data.sesiones_otro ?? 0,
          },
          horas_por_semestre: {
            ...current.horas_por_semestre,
            teoria: data.horas_teoria ?? 0,
            practica: data.horas_practica ?? 0,
            aula: data.horas_aula ?? 0,
            laboratorio: data.horas_laboratorio ?? 0,
            clinica: data.horas_clinica ?? 0,
            otro: data.horas_otro ?? 0,
            total: data.horas_total ?? 0,
          },
          creditos: {
            tepic: data.creditos_tepic ?? current.creditos?.tepic ?? 0,
            satca: data.creditos_satca ?? current.creditos?.satca ?? 0,
          },
          antecedentes: data.antecedentes ?? "",
          laterales: data.laterales ?? "",
          subsecuentes: data.subsecuentes ?? "",
          ejes: {
            compromiso_social_sustentabilidad:
              data.ejes_compromiso_social_sustentabilidad ?? "",
            perspectiva_genero: data.ejes_perspectiva_genero ?? "",
            internacionalizacion: data.ejes_internacionalizacion ?? "",
          },
          // @ts-expect-error
          organizacion: {
            proposito: data.org_proposito ?? "",
            estrategia: data.org_estrategia ?? "",
            metodos: data.org_metodos ?? "",
          },
          referencias: Array.isArray(data.referencias)
            ? data.referencias.map((r: any) => ({
                cita_apa: r.cita_apa ?? "",
                unidades_aplica: Array.isArray(r.unidades_aplica)
                  ? r.unidades_aplica
                  : [],
                tipo: r.tipo ?? "Básica",
              }))
            : [],
          // @ts-expect-error
          plagio: {
            ithenticate: !!data.plagio_ithenticate,
            turnitin: !!data.plagio_turnitin,
            otro: data.plagio_otro ?? "",
          },
        };

        const rawUts: any[] = Array.isArray(data.unidades_tematicas)
          ? data.unidades_tematicas
          : [];
        if (rawUts.length > 0) {
          newValues.unidades_tematicas = rawUts.map((u: any, idx: number) => {
            const horas = u.horas || {};
            const sesionesEsp = u.sesiones_por_espacio || {};
            const bloques = Array.isArray(u.bloques) ? u.bloques : [];
            return {
              numero: u.numero ?? idx + 1,
              nombre_unidad_tematica: u.nombre_unidad_tematica ?? "",
              unidad_competencia: u.unidad_competencia ?? "",
              periodo_desarrollo: {
                del: u.periodo_desarrollo?.del ?? "",
                al: u.periodo_desarrollo?.al ?? "",
              },
              horas: {
                aula: Number(horas.aula ?? 0),
                laboratorio: Number(horas.laboratorio ?? 0),
                taller: Number(horas.taller ?? 0),
                clinica: Number(horas.clinica ?? 0),
                otro: Number(horas.otro ?? 0),
              },
              sesiones_por_espacio: {
                aula: Number(sesionesEsp.aula ?? 0),
                laboratorio: Number(sesionesEsp.laboratorio ?? 0),
                taller: Number(sesionesEsp.taller ?? 0),
                clinica: Number(sesionesEsp.clinica ?? 0),
                otro: Number(sesionesEsp.otro ?? 0),
              },
              sesiones_totales: Number(u.sesiones_totales ?? 0),
              periodo_registro_eval: u.periodo_registro_eval ?? "",
              aprendizajes_esperados: Array.isArray(u.aprendizajes_esperados)
                ? u.aprendizajes_esperados
                : [""],
              bloques:
                bloques.length > 0
                  ? bloques.map((b: any, j: number) => ({
                      numero_sesion: b.numero_sesion ?? j + 1,
                      temas_subtemas: b.temas_subtemas ?? "",
                      actividades: {
                        inicio: b.actividades?.inicio ?? b.actividades_inicio ?? "",
                        desarrollo:
                          b.actividades?.desarrollo ?? b.actividades_desarrollo ?? "",
                        cierre: b.actividades?.cierre ?? b.actividades_cierre ?? "",
                      },
                      recursos: Array.isArray(b.recursos) ? b.recursos : [],
                      evidencias: Array.isArray(b.evidencias) ? b.evidencias : [],
                      instrumentos: Array.isArray(b.instrumentos)
                        ? b.instrumentos
                        : [],
                      valor_porcentual: Number(b.valor_porcentual ?? 0),
                    }))
                  : [
                      {
                        numero_sesion: 1,
                        temas_subtemas: "",
                        actividades: { inicio: "", desarrollo: "", cierre: "" },
                        recursos: [""],
                        evidencias: [""],
                        valor_porcentual: 0,
                        instrumentos: [""],
                      },
                    ],
              precisiones: u.precisiones ?? "",
            };
          });
        }

        reset(newValues);
        setSectionProgress(computeSectionProgress(newValues));
        setPlaneacionNombre(data?.nombre_planeacion ?? "Borrador");
        toast.success("Planeación recuperada.");
      } catch (err: any) {
        if (!cancel) {
          console.error(err);
          toast.error(err?.message ?? "No se pudo recuperar la planeación guardada.");
        }
      }
    })();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeacionId, token]);

  function buildPayload(values: PlaneacionType, opts?: { finalizar?: boolean }) {
    const payload: any = {
      nombre_planeacion: planeacionNombre || null,
      periodo_escolar: values.periodo_escolar || null,
      plan_estudios_anio: values.plan_estudios_anio || null,
      semestre_nivel: values.semestre_nivel || null,
      grupos: values.grupos || null,
      programa_academico: values.programa_academico || null,
      academia: values.academia || null,
      unidad_aprendizaje_nombre: values.unidad_aprendizaje_nombre || null,
      area_formacion: values.area_formacion || null,
      modalidad: values.modalidad || null,
      sesiones_por_semestre: values.sesiones_por_semestre ?? null,
      sesiones_aula: values.sesiones_por_semestre_det?.aula ?? null,
      sesiones_laboratorio: values.sesiones_por_semestre_det?.laboratorio ?? null,
      sesiones_clinica: values.sesiones_por_semestre_det?.clinica ?? null,
      sesiones_otro: values.sesiones_por_semestre_det?.otro ?? null,
      horas_teoria: values.horas_por_semestre?.teoria ?? null,
      horas_practica: values.horas_por_semestre?.practica ?? null,
      horas_aula: values.horas_por_semestre?.aula ?? null,
      horas_laboratorio: values.horas_por_semestre?.laboratorio ?? null,
      horas_clinica: values.horas_por_semestre?.clinica ?? null,
      horas_otro: values.horas_por_semestre?.otro ?? null,
      horas_total: values.horas_por_semestre?.total ?? null,
      creditos_tepic:
        values.creditos?.tepic != null ? Number(values.creditos.tepic) : null,
      creditos_satca:
        values.creditos?.satca != null ? Number(values.creditos.satca) : null,
      antecedentes: values.antecedentes ?? "",
      laterales: values.laterales ?? "",
      subsecuentes: values.subsecuentes ?? "",
      ejes_compromiso_social_sustentabilidad:
        values.ejes?.compromiso_social_sustentabilidad ?? "",
      ejes_perspectiva_genero: values.ejes?.perspectiva_genero ?? "",
      ejes_internacionalizacion: values.ejes?.internacionalizacion ?? "",
      // @ts-expect-error
      org_proposito: (values as any).organizacion?.proposito ?? "",
      // @ts-expect-error
      org_estrategia: (values as any).organizacion?.estrategia ?? "",
      // @ts-expect-error
      org_metodos: (values as any).organizacion?.metodos ?? "",
      // @ts-expect-error
      plagio_ithenticate: !!(values as any).plagio?.ithenticate,
      // @ts-expect-error
      plagio_turnitin: !!(values as any).plagio?.turnitin,
      // @ts-expect-error
      plagio_otro: (values as any).plagio?.otro ?? "",
    };

    payload.referencias = Array.isArray((values as any).referencias)
      ? (values as any).referencias
          .map((r: any) => {
            const cita = (r.cita_apa ?? "").trim();
            if (!cita) return null;
            return {
              cita_apa: cita,
              unidades_aplica: Array.isArray(r.unidades_aplica)
                ? r.unidades_aplica
                : [],
              tipo:
                r.tipo && String(r.tipo).trim()
                  ? String(r.tipo).trim()
                  : "Básica",
            };
          })
          .filter(Boolean)
      : [];

    payload.unidades_tematicas = Array.isArray(values.unidades_tematicas)
      ? values.unidades_tematicas.map((u, idx) => {
          const cleanAprendizajes = (u.aprendizajes_esperados || [])
            .map((a) => (a ?? "").trim())
            .filter((a) => a.length > 0);

          return {
            numero: u.numero ?? idx + 1,
            nombre_unidad_tematica: u.nombre_unidad_tematica ?? "",
            unidad_competencia: u.unidad_competencia ?? "",
            periodo_desarrollo: {
              del: u.periodo_desarrollo?.del?.trim()
                ? u.periodo_desarrollo.del
                : null,
              al: u.periodo_desarrollo?.al?.trim()
                ? u.periodo_desarrollo.al
                : null,
            },
            horas: {
              aula: u.horas?.aula ?? 0,
              laboratorio: u.horas?.laboratorio ?? 0,
              taller: u.horas?.taller ?? 0,
              clinica: u.horas?.clinica ?? 0,
              otro: u.horas?.otro ?? 0,
            },
            sesiones_por_espacio: {
              aula: u.sesiones_por_espacio?.aula ?? 0,
              laboratorio: u.sesiones_por_espacio?.laboratorio ?? 0,
              taller: u.sesiones_por_espacio?.taller ?? 0,
              clinica: u.sesiones_por_espacio?.clinica ?? 0,
              otro: u.sesiones_por_espacio?.otro ?? 0,
            },
            sesiones_totales: u.sesiones_totales ?? 0,
            periodo_registro_eval: u.periodo_registro_eval?.trim()
              ? u.periodo_registro_eval
              : null,
            aprendizajes_esperados: cleanAprendizajes,
            bloques: Array.isArray(u.bloques)
              ? u.bloques.map((b, j) => {
                  const cleanRecursos = (b.recursos || [])
                    .map((x) => String(x ?? "").trim())
                    .filter(Boolean);
                  const cleanEvidencias = (b.evidencias || [])
                    .map((x) => String(x ?? "").trim())
                    .filter(Boolean);
                  const cleanInstrumentos = (b.instrumentos || [])
                    .map((x) => String(x ?? "").trim())
                    .filter(Boolean);

                  return {
                    numero_sesion: b.numero_sesion ?? j + 1,
                    temas_subtemas: b.temas_subtemas ?? "",
                    actividades: {
                      inicio: b.actividades?.inicio ?? "",
                      desarrollo: b.actividades?.desarrollo ?? "",
                      cierre: b.actividades?.cierre ?? "",
                    },
                    recursos: cleanRecursos,
                    evidencias: cleanEvidencias,
                    instrumentos: cleanInstrumentos,
                    valor_porcentual: b.valor_porcentual ?? 0,
                  };
                })
              : [],
            precisiones: u.precisiones ?? "",
            porcentaje: null,
          };
        })
      : [];

    if (opts?.finalizar) payload.status = "finalizada";
    return payload;
  }

  async function persistirPlaneacion(
    values: PlaneacionType,
    opts?: { finalizar?: boolean }
  ) {
    if (readOnly) {
      toast.info("Planeación finalizada: solo lectura, no se puede guardar.");
      return false;
    }

    try {
      const payload = buildPayload(values, opts);
      const isUpdate = planeacionId != null;
      const url = isUpdate
        ? `${API_BASE}/planeaciones/${planeacionId}`
        : `${API_BASE}/planeaciones`;
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `No se pudo guardar la planeación (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.error || data?.msg || msg;
        } catch {}
        toast.error(msg);
        return false;
      }

      const data = await res.json();

      // ✅ Si fue creación, tu backend devuelve { id }
      if (!planeacionId && data?.id) {
        const newId = Number(data.id);
        if (!Number.isNaN(newId) && newId > 0) {
          setPlaneacionId(newId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("planeacion_actual_id", String(newId));
          }
          // ✅ avisa al dashboard para quitar “Sin guardar aún”
          onCreated?.(newId);
        }
      }

      if (data?.nombre_planeacion) setPlaneacionNombre(data.nombre_planeacion);

      toast.success(
        opts?.finalizar
          ? "Planeación finalizada correctamente."
          : planeacionId
          ? "Avance guardado correctamente."
          : "Planeación guardada correctamente."
      );

      // ✅ refresca lista SIEMPRE que guardas
      onSaved?.();

      return true;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Error al guardar la planeación");
      return false;
    }
  }

  async function guardarAvance() {
    if (!hasPlaneacionContext) {
      toast.info("Primero crea o selecciona una planeación para guardar.");
      return;
    }
    if (readOnly) {
      toast.info("Esta planeación está finalizada. Solo lectura.");
      return;
    }

    const values = form.getValues();
    const prog = computeSectionProgress(values);
    setSectionProgress(prog);

    await persistirPlaneacion(values, { finalizar: false });
  }

  async function finalizarPlaneacion() {
    if (!hasPlaneacionContext) {
      toast.info("Primero crea o selecciona una planeación para finalizar.");
      return;
    }
    if (readOnly) {
      toast.info("Esta planeación ya está finalizada (solo lectura).");
      return;
    }

    let values = form.getValues();
    const prog = computeSectionProgress(values);
    setSectionProgress(prog);

    const entries = Object.entries(prog) as [SectionKey, SectionProgress][];
    const firstIncomplete = entries.find(
      ([, sec]) => (sec.missing?.length ?? 0) > 0
    );

    if (firstIncomplete) {
      toast.error("Revisa los campos requeridos antes de finalizar.");
      setActiveTab(firstIncomplete[0]);
      return;
    }

    let changed = false;

    if (values.sesiones_por_semestre !== sumSesiones) {
      toast.warning(
        "Se ajustó el total de sesiones (1.11) para que coincida con la suma de las unidades (3.9)."
      );
      setValue("sesiones_por_semestre", sumSesiones, {
        shouldDirty: true,
        shouldValidate: false,
      });
      changed = true;
    }

    if ((values.horas_por_semestre?.total ?? 0) !== sumHoras) {
      toast.warning(
        "Se ajustó el total de horas (1.12) para que coincida con la suma de las unidades (3.8)."
      );
      setValue("horas_por_semestre.total", sumHoras, {
        shouldDirty: true,
        shouldValidate: false,
      });
      changed = true;
    }

    if (changed) values = form.getValues();

    const ok = await persistirPlaneacion(values, { finalizar: true });
    if (ok && onFinalizar) onFinalizar();
  }

  const goNext = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
  };
  const goPrev = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1]);
  };

  const tabBodyClass =
    "flex-1 min-h-0 overflow-x-hidden overflow-y-auto w-full max-w-full [scrollbar-gutter:stable_both-edges]";

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardarAvance();
        }}
        className="
          grid h-full flex-1 min-h-0 gap-6 min-w-0
          grid-cols-1
          md:grid-cols-[minmax(0,1fr)_320px]
        "
      >
        <div className="flex flex-col h-full min-h-0 w-full max-w-full min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
            className="w-full max-w-full flex-1 flex flex-col min-h-0 min-w-0"
          >
            <div className="sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-3 space-y-3 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between gap-2 w-full max-w-full min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
                  <h1 className="text-xl font-semibold truncate">
                    {planeacionNombre}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-0">
                    <Badge variant="secondary" className="w-fit">
                      {planeacionId ? "Guardado" : "Borrador"}
                    </Badge>
                    {readOnly && (
                      <Badge variant="outline" className="w-fit">
                        Finalizada · solo lectura
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goPrev}
                    disabled={activeTab === "datos"}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                  >
                    ← Anterior
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goNext}
                    disabled={activeTab === "plagio"}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                  >
                    Siguiente →
                  </Button>

                  <span className="mx-1 h-6 w-px bg-border" />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={guardarAvance}
                    disabled={isSubmitting || readOnly || !hasPlaneacionContext}
                    className="
                      border-primary/30
                      text-primary
                      hover:bg-primary/5
                      hover:border-primary/50
                      transition
                    "
                  >
                    {isSubmitting ? "Guardando…" : "Guardar avance"}
                  </Button>

                  <Button
                    type="button"
                    onClick={finalizarPlaneacion}
                    disabled={isSubmitting || readOnly || !hasPlaneacionContext}
                    className="
                      px-5
                      font-semibold
                      shadow-md
                      hover:shadow-lg
                      active:scale-[0.98]
                      transition-all
                    "
                  >
                    {isSubmitting ? "Guardando…" : "Finalizar"}
                  </Button>
                </div>
              </div>

              <TabsList
                className="
                  relative
                  w-full max-w-full min-w-0
                  flex flex-nowrap items-center gap-2
                  p-2
                  rounded-xl
                  bg-muted/40
                  backdrop-blur
                  border border-border/40

                  overflow-x-auto
                  overflow-y-hidden
                "
              >
                {[
                  { id: "datos", label: "Datos generales", num: 1 },
                  { id: "relaciones", label: "Relaciones y ejes", num: 2 },
                  { id: "organizacion", label: "Organización", num: 3 },
                  { id: "referencias", label: "Referencias", num: 4 },
                  { id: "plagio", label: "Plagio", num: 5 },
                ].map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="
                      group relative
                      flex items-center gap-3
                      px-4 py-2
                      rounded-xl
                      whitespace-nowrap
                      text-sm font-medium
                      transition-all duration-300 ease-out

                      text-muted-foreground
                      hover:text-foreground
                      hover:bg-background/70
                      hover:shadow-sm

                      data-[state=active]:bg-background
                      data-[state=active]:text-foreground
                      data-[state=active]:shadow-md
                      data-[state=active]:ring-1
                      data-[state=active]:ring-primary/30
                    "
                  >
                    <span
                      className="
                        flex items-center justify-center
                        w-7 h-7 rounded-full
                        text-xs font-semibold
                        border
                        border-border/60
                        bg-background
                        text-muted-foreground
                        transition-all duration-300

                        group-hover:bg-primary/10
                        group-hover:text-primary
                        group-hover:border-primary/30

                        group-data-[state=active]:bg-primary
                        group-data-[state=active]:text-primary-foreground
                        group-data-[state=active]:border-primary
                      "
                    >
                      {t.num}
                    </span>

                    <span className="relative">
                      {t.label}
                      <span
                        className="
                          pointer-events-none
                          absolute -bottom-1 left-0 h-[2px] w-full
                          origin-left scale-x-0
                          bg-primary
                          transition-transform duration-300
                          group-hover:scale-x-100
                          group-data-[state=active]:scale-x-100
                        "
                      />
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent
              value="datos"
              forceMount
              className="mt-4 flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col"
            >
              <div className={tabBodyClass}>
                <div className="pb-24 w-full max-w-full min-w-0">
                  <DatosGenerales
                    unidades={unidades}
                    loading={uLoading}
                    error={uError}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="relaciones"
              forceMount
              className="mt-4 flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col"
            >
              <div className={tabBodyClass}>
                <div className="pb-24 w-full max-w-full min-w-0">
                  <RelacionesEjes readOnly={readOnly} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="organizacion"
              forceMount
              className="mt-4 flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col"
            >
              <div className={tabBodyClass}>
                <div className="space-y-4 pb-24 w-full max-w-full min-w-0">
                  <div className="flex items-center justify-between min-w-0 gap-3">
                    <h2 className="text-lg font-semibold truncate">
                      3. Organización didáctica
                    </h2>
                    <div className="text-sm text-muted-foreground shrink-0">
                      Total sesiones: <b>{sumSesiones}</b> &nbsp;|&nbsp; Total horas:{" "}
                      <b>{sumHoras}</b>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {ut.fields.map((f, idx) => (
                      <AccordionItem
                        key={f.id}
                        value={`ut-${idx}`}
                        className="border rounded-lg px-3"
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">
                              Unidad temática {idx + 1}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({uts?.[idx]?.sesiones_totales ?? 0} sesiones,{" "}
                              {Object.values(uts?.[idx]?.horas ?? {}).reduce(
                                (a, b) => a + (b || 0),
                                0
                              )}{" "}
                              h)
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="py-3">
                            <UnidadTematica
                              index={idx}
                              readOnly={readOnly}
                              onRemove={
                                !readOnly && ut.fields.length > 1
                                  ? () => ut.remove(idx)
                                  : undefined
                              }
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="flex gap-2 min-w-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const lastIdx = ut.fields.length - 1;
                        if (lastIdx >= 0) {
                          const ok = await trigger(
                            `unidades_tematicas.${lastIdx}` as any,
                            { shouldFocus: true }
                          );
                          if (!ok) {
                            toast.error(
                              `Completa la Unidad Temática ${
                                lastIdx + 1
                              } antes de crear otra.`
                            );
                            return;
                          }
                        }

                        ut.append({
                          numero: ut.fields.length + 1,
                          nombre_unidad_tematica: "",
                          unidad_competencia: "",
                          periodo_desarrollo: { del: "", al: "" },
                          horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
                          sesiones_por_espacio: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
                          sesiones_totales: 0,
                          periodo_registro_eval: "",
                          aprendizajes_esperados: [""],
                          bloques: [
                            {
                              numero_sesion: 1,
                              temas_subtemas: "",
                              actividades: { inicio: "", desarrollo: "", cierre: "" },
                              recursos: [""],
                              evidencias: [""],
                              valor_porcentual: 0,
                              instrumentos: [""],
                            },
                          ],
                          precisiones: "",
                        } as any);
                      }}
                      disabled={readOnly}
                    >
                      Agregar Unidad Temática
                    </Button>

                    <div className="ml-auto flex items-center gap-2 text-sm min-w-0">
                      <span className="shrink-0">sesiones por semestre:</span>
                      <Input className="w-24 h-9" type="number" value={sesionesPorSemestre ?? 0} readOnly />
                      <span className="shrink-0">total horas:</span>
                      <Input className="w-24 h-9" type="number" step="0.1" value={totalHorasDeclarado ?? 0} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="referencias"
              forceMount
              className="mt-4 flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col"
            >
              <div className={tabBodyClass}>
                <div className="pb-24 w-full max-w-full min-w-0 overflow-x-hidden">
                  <Referencias unidadesCount={unidadesCount} readOnly={readOnly} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="plagio"
              forceMount
              className="mt-4 flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col"
            >
              <div className={tabBodyClass}>
                <div className="pb-24 w-full max-w-full min-w-0 overflow-x-hidden">
                  <Plagio readOnly={readOnly} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <PlaneacionAside sectionProgress={sectionProgress} />
      </form>
    </FormProvider>
  );
}
