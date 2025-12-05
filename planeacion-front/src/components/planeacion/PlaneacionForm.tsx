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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Unidad = { id: number; nombre: string; abreviatura?: string | null };

// 👇 default apuntando al back de Go en 8080 + /api
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const TABS = ["datos", "relaciones", "organizacion", "referencias", "plagio"] as const;
type TabKey = (typeof TABS)[number];

export default function PlaneacionForm({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("datos");

  // id de la planeación actual (para POST/PUT y rescate)
  const [planeacionId, setPlaneacionId] = useState<number | null>(null);

  // ---------------- Catalog: Unidades Académicas ----------------
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setULoading(true);
        setUError(null);
        const res = await fetch(`${API_BASE}/unidades`, { cache: "no-store" });
        if (!res.ok) throw new Error(`No se pudo cargar (${res.status})`);
        const data = await res.json();
        // backend regresa { items, total } o arreglo plano
        const items: Unidad[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
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

  // ---------------- Recuperar id (si ya existe) ----------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("planeacion_actual_id");
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPlaneacionId(parsed);
    }
  }, []);

  // ---------------- Form ----------------
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
      sesiones_por_semestre: 32,
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
      // organización didáctica (header)
      // @ts-expect-error: puede no estar aún en el schema
      organizacion: {
        proposito: "",
        estrategia: "",
        metodos: "",
      },
      unidades_tematicas: [
        {
          numero: 1,
          nombre_unidad_tematica: "",
          unidad_competencia: "",
          periodo_desarrollo: { del: "", al: "" },
          horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
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
      // @ts-expect-error: puede no estar aún en el schema
      plagio: {
        ithenticate: false,
        turnitin: false,
        otro: "",
      },
    },
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isSubmitting },
    trigger,
  } = form;

  const ut = useFieldArray<PlaneacionType>({ control, name: "unidades_tematicas" });

  // ---------------- Congruencias (sumatorias) ----------------
  const uts = useWatch({ control, name: "unidades_tematicas" });
  const sesionesPorSemestre = useWatch({ control, name: "sesiones_por_semestre" });
  const totalHorasDeclarado = useWatch({ control, name: "horas_por_semestre.total" });

  const unidadesCount = uts?.length ?? 0;
  const sumSesiones = (uts || []).reduce((acc, u) => acc + (u?.sesiones_totales || 0), 0);
  const sumHoras = (uts || []).reduce(
    (acc, u) =>
      acc +
      (u?.horas?.aula || 0) +
      (u?.horas?.laboratorio || 0) +
      (u?.horas?.taller || 0) +
      (u?.horas?.clinica || 0) +
      (u?.horas?.otro || 0),
    0
  );

  // ---------------- Recuperar datos del backend (GET) ----------------
  useEffect(() => {
    if (!planeacionId) return;
    let cancel = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/planeaciones/${planeacionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`No se pudo cargar la planeación (${res.status})`);
        }
        const data: any = await res.json();

        if (cancel) return;

        const current = form.getValues();

        reset({
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
          sesiones_por_semestre: data.sesiones_por_semestre ?? current.sesiones_por_semestre,
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
          antecedentes: data.antecedentes ?? "",
          laterales: data.laterales ?? "",
          subsecuentes: data.subsecuentes ?? "",
          ejes: {
            compromiso_social_sustentabilidad:
              data.ejes_compromiso_social_sustentabilidad ?? "",
            perspectiva_genero: data.ejes_perspectiva_genero ?? "",
            internacionalizacion: data.ejes_internacionalizacion ?? "",
          },
          // organización didáctica
          // @ts-expect-error: campo anidado no estricto
          organizacion: {
            proposito: data.org_proposito ?? "",
            estrategia: data.org_estrategia ?? "",
            metodos: data.org_metodos ?? "",
          },
          // plagio
          // @ts-expect-error: campo anidado no estricto
          plagio: {
            ithenticate: !!data.plagio_ithenticate,
            turnitin: !!data.plagio_turnitin,
            otro: data.plagio_otro ?? "",
          },
        });

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

  // ---------------- Submit → POST / PUT /api/planeaciones ----------------
  async function onSubmit(values: PlaneacionType) {
    // Reglas de congruencia antes de mandar al backend
    if (values.sesiones_por_semestre !== sumSesiones) {
      toast.error("El total de sesiones (1.11) debe empatar con la suma de 3.9.");
      setActiveTab("organizacion");
      return;
    }
    if (values.horas_por_semestre.total !== sumHoras) {
      toast.error("El total de horas (1.12) debe empatar con la suma de 3.8.");
      setActiveTab("organizacion");
      return;
    }

    try {
      const payload = {
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
        // estas de sesiones_* por ahora las mandamos nulas/0; luego si quieres las derivamos fino
        sesiones_aula: null,
        sesiones_laboratorio: null,
        sesiones_clinica: null,
        sesiones_otro: null,

        horas_teoria: values.horas_por_semestre?.teoria ?? null,
        horas_practica: values.horas_por_semestre?.practica ?? null,
        horas_aula: values.horas_por_semestre?.aula ?? null,
        horas_laboratorio: values.horas_por_semestre?.laboratorio ?? null,
        horas_clinica: values.horas_por_semestre?.clinica ?? null,
        horas_otro: values.horas_por_semestre?.otro ?? null,
        horas_total: values.horas_por_semestre?.total ?? null,

        antecedentes: values.antecedentes ?? "",
        laterales: values.laterales ?? "",
        subsecuentes: values.subsecuentes ?? "",

        ejes_compromiso_social_sustentabilidad:
          values.ejes?.compromiso_social_sustentabilidad ?? "",
        ejes_perspectiva_genero: values.ejes?.perspectiva_genero ?? "",
        ejes_internacionalizacion: values.ejes?.internacionalizacion ?? "",

        // Organización didáctica (header)
        // @ts-expect-error: organizacion puede no estar en el tipo
        org_proposito: values.organizacion?.proposito ?? "",
        // @ts-expect-error
        org_estrategia: values.organizacion?.estrategia ?? "",
        // @ts-expect-error
        org_metodos: values.organizacion?.metodos ?? "",

        // Plagio
        // @ts-expect-error
        plagio_ithenticate: !!values.plagio?.ithenticate,
        // @ts-expect-error
        plagio_turnitin: !!values.plagio?.turnitin,
        // @ts-expect-error
        plagio_otro: values.plagio?.otro ?? "",
      };

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
        } catch {
          // ignore JSON parse error
        }
        toast.error(msg);
        return;
      }

      const data = await res.json();
      console.log("Planeación guardada", data);

      // Si es la primera vez, guardamos el id
      if (!planeacionId && data?.id) {
        const newId = Number(data.id);
        if (!Number.isNaN(newId) && newId > 0) {
          setPlaneacionId(newId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("planeacion_actual_id", String(newId));
          }
        }
      }

      toast.success(isUpdate ? "Planeación actualizada correctamente." : "Planeación guardada correctamente.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Error al guardar la planeación");
    }
  }

  // ---------------- Navegación entre tabs ----------------
  const goNext = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
  };
  const goPrev = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1]);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Columna principal */}
        <div className="space-y-4">
          {/* Header de acciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Planeación didáctica</h1>
              <Badge variant="secondary">
                {planeacionId ? `id #${planeacionId}` : "borrador"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goPrev} disabled={activeTab === "datos"}>
                Anterior
              </Button>
              <Button type="button" variant="outline" onClick={goNext} disabled={activeTab === "plagio"}>
                Siguiente
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="datos">1. Datos generales</TabsTrigger>
              <TabsTrigger value="relaciones">2. Relaciones y ejes</TabsTrigger>
              <TabsTrigger value="organizacion">3. Organización</TabsTrigger>
              <TabsTrigger value="referencias">4. Referencias</TabsTrigger>
              <TabsTrigger value="plagio">5. Plagio</TabsTrigger>
            </TabsList>

            {/* 1. Datos */}
            <TabsContent value="datos" forceMount className="mt-4">
              <ScrollArea className="h-[calc(100vh-270px)] pr-2">
                <DatosGenerales unidades={unidades} loading={uLoading} error={uError} />
              </ScrollArea>
            </TabsContent>

            {/* 2. Relaciones */}
            <TabsContent value="relaciones" forceMount className="mt-4">
              <ScrollArea className="h-[calc(100vh-270px)] pr-2">
                <RelacionesEjes />
              </ScrollArea>
            </TabsContent>

            {/* 3. Organización */}
            <TabsContent value="organizacion" forceMount className="mt-4 space-y-4">
              <div className="flex items-center justify_between">
                <h2 className="text-lg font-semibold">3. Organización didáctica</h2>
                <div className="text-sm text-muted-foreground">
                  Total sesiones: <b>{sumSesiones}</b> &nbsp;|&nbsp; Total horas: <b>{sumHoras}</b>
                </div>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {ut.fields.map((f, idx) => (
                  <AccordionItem key={f.id} value={`ut-${idx}`} className="border rounded-lg px-3">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Unidad temática {idx + 1}</span>
                        <span className="text-xs text-muted-foreground">
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
                          onRemove={ut.fields.length > 1 ? () => ut.remove(idx) : undefined}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const lastIdx = ut.fields.length - 1;
                    if (lastIdx >= 0) {
                      const ok = await trigger(`unidades_tematicas.${lastIdx}` as any, {
                        shouldFocus: true,
                      });
                      if (!ok) {
                        toast.error(`Completa la Unidad Temática ${lastIdx + 1} antes de crear otra.`);
                        return;
                      }
                    }

                    ut.append({
                      numero: ut.fields.length + 1,
                      nombre_unidad_tematica: "",
                      unidad_competencia: "",
                      periodo_desarrollo: { del: "", al: "" },
                      horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
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
                >
                  Agregar Unidad Temática
                </Button>

                {/* Totales 1.11 / 1.12 solo lectura aquí (derivados en otros apartados) */}
                <div className="ml-auto flex items-center gap-2 text-sm">
                  <span>sesiones por semestre:</span>
                  <Input
                    className="w-24 h-9"
                    type="number"
                    value={sesionesPorSemestre ?? 0}
                    readOnly
                  />
                  <span>total horas:</span>
                  <Input
                    className="w-24 h-9"
                    type="number"
                    step="0.1"
                    value={totalHorasDeclarado ?? 0}
                    readOnly
                  />
                </div>
              </div>
            </TabsContent>

            {/* 4. Referencias */}
            <TabsContent value="referencias" forceMount className="mt-4">
              <ScrollArea className="h-[calc(100vh-270px)] pr-2">
                <Referencias unidadesCount={unidadesCount} />
              </ScrollArea>
            </TabsContent>

            {/* 5. Plagio */}
            <TabsContent value="plagio" forceMount className="mt-4">
              <ScrollArea className="h-[calc(100vh-270px)] pr-2">
                <Plagio />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Columna lateral (sticky) */}
        <aside className="hidden md:block">
          <div className="sticky top-16 space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Resumen sticky</h3>
              <Separator className="my-2" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sesiones</span>
                  <b>{sumSesiones}</b>
                </div>
                <div className="flex justify-between">
                  <span>Total horas</span>
                  <b>{sumHoras}</b>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  1.11 declarado: <b>{sesionesPorSemestre ?? 0}</b>{" "}
                  {sesionesPorSemestre !== sumSesiones && (
                    <span className="text-red-500">✱ no cuadra</span>
                  )}
                </p>
                <p>
                  1.12 declarado: <b>{totalHorasDeclarado ?? 0}</b>{" "}
                  {totalHorasDeclarado !== sumHoras && (
                    <span className="text-red-500">✱ no cuadra</span>
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Acciones</h3>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando…" : "Guardar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("organizacion")}
                >
                  Ir a Organización
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </FormProvider>
  );
}
