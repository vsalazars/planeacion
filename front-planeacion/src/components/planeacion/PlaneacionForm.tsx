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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

const TABS = ["datos", "relaciones", "organizacion", "referencias", "plagio"] as const;
type TabKey = (typeof TABS)[number];

export default function PlaneacionForm({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("datos");

  // ---------------- Catalog: Unidades Académicas ----------------
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setULoading(true); setUError(null);
        const res = await fetch(`${API_BASE}/unidades`, { cache: "no-store" });
        if (!res.ok) throw new Error(`No se pudo cargar (${res.status})`);
        const data: Unidad[] = await res.json();
        if (!cancel) setUnidades(data);
      } catch (e: any) {
        if (!cancel) setUError(e?.message || "Error cargando unidades");
      } finally {
        if (!cancel) setULoading(false);
      }
    })();
    return () => { cancel = true; };
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
        teorica: false, practica: false, teorica_practica: false, clinica: false, otro: false,
        obligatoria: false, optativa: false, topicos_selectos: false,
      },
      creditos: { tepic: 0, satca: 0 },
      academia: "",
      semanas_por_semestre: 16,
      sesiones_por_semestre: 32,
      horas_por_semestre: { aula: 0, teoria: 0, laboratorio: 0, practica: 0, clinica: 0, otro: 0, total: 0 },
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
      unidades_tematicas: [
        {
          numero: 1,
          unidad_aprendizaje: "",
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
      plagio: {},
    },
    mode: "onSubmit", // evita ruido de validación en edición; validamos al guardar o al agregar
  });

  const { handleSubmit, control, setValue, formState: { isSubmitting, errors }, trigger } = form;
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

  // ---------------- Submit ----------------
  async function onSubmit(values: PlaneacionType) {
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

    console.log("Planeación lista para guardar", values);
    toast.success("Planeación validada. (Conecta el POST al backend para guardar)");
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
              <Badge variant="secondary">borrador</Badge>
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
              <div className="flex items-center justify-between">
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
                          ({uts?.[idx]?.sesiones_totales ?? 0} sesiones, {Object.values(uts?.[idx]?.horas ?? {}).reduce((a, b) => a + (b || 0), 0)} h)
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
                    // Validar la ÚLTIMA unidad antes de crear otra
                    const lastIdx = ut.fields.length - 1;
                    if (lastIdx >= 0) {
                      const ok = await trigger(`unidades_tematicas.${lastIdx}` as any, { shouldFocus: true });
                      if (!ok) {
                        toast.error(`Completa la Unidad Temática ${lastIdx + 1} antes de crear otra.`);
                        return;
                      }
                    }

                    ut.append({
                      numero: ut.fields.length + 1,
                      unidad_aprendizaje: "",
                      unidad_competencia: "",
                      periodo_desarrollo: { del: "", al: "" },
                      horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
                      sesiones_totales: 1,
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
                    });
                  }}
                >
                  Agregar Unidad Temática
                </Button>

                <div className="ml-auto flex items-center gap-2 text-sm">
                  <span>sesiones por semestre:</span>
                  <Input
                    className="w-24 h-9"
                    type="number"
                    value={sesionesPorSemestre ?? 0}
                    onChange={(e) => setValue("sesiones_por_semestre", parseInt(e.target.value || "0", 10))}
                  />
                  <span>total horas:</span>
                  <Input
                    className="w-24 h-9"
                    type="number"
                    step="0.1"
                    value={totalHorasDeclarado ?? 0}
                    onChange={(e) => setValue("horas_por_semestre.total", parseFloat(e.target.value || "0"))}
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
                <div className="flex justify-between"><span>Sesiones</span><b>{sumSesiones}</b></div>
                <div className="flex justify-between"><span>Total horas</span><b>{sumHoras}</b></div>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  1.11 declarado: <b>{sesionesPorSemestre ?? 0}</b> {sesionesPorSemestre !== sumSesiones && <span className="text-red-500">✱ no cuadra</span>}
                </p>
                <p>
                  1.12 declarado: <b>{totalHorasDeclarado ?? 0}</b> {totalHorasDeclarado !== sumHoras && <span className="text-red-500">✱ no cuadra</span>}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Acciones</h3>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando…" : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab("organizacion")}>
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
