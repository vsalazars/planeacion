"use client";

import React, { useEffect, useMemo, useState } from "react";

import AuthPanel from "@/components/auth/AuthPanel";
import PublicoInline from "@/components/publico/PublicoInline";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  BadgeCheck,
  FileText,
  CheckCircle2,
  CalendarDays,
  Users,
  Clock,
  BookOpen,
  Layers,
  GraduationCap,
  ClipboardList,
  Route,
  Wrench,
  ShieldCheck,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

import { motion, useInView } from "framer-motion";

const IPN_GUINDA = "#7A003C";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

type PublicStats = {
  planeaciones_total: number;
  planeaciones_finalizadas: number;
  docentes_participantes: number;
  unidades_tematicas_total: number;
  sesiones_didacticas_total: number;
  ultima_actualizacion?: string | null;
  ultima_publicacion?: string | null;
};

function parseDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function fmtRelative(d: Date) {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Hace unos segundos";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const day = Math.floor(h / 24);
  if (day < 30) return `Hace ${day} día${day === 1 ? "" : "s"}`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `Hace ${mon} mes${mon === 1 ? "" : "es"}`;
  const yr = Math.floor(mon / 12);
  return `Hace ${yr} año${yr === 1 ? "" : "s"}`;
}

function fmtDateTimeMX(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/* ===================== UI helpers ===================== */

function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="my-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(122,0,60,0.35))",
            }}
          />

          <div className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: IPN_GUINDA,
                boxShadow: "0 0 0 6px rgba(122,0,60,0.10)",
              }}
            />
            {label ? (
              <Badge
                className="rounded-full"
                style={{
                  backgroundColor: "hsl(var(--background))",
                  color: IPN_GUINDA,
                  border: "1px solid rgba(122,0,60,0.18)",
                }}
              >
                {label}
              </Badge>
            ) : null}
          </div>

          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, rgba(122,0,60,0.35), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-10% 0px -10% 0px", once: true });

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 14, filter: "blur(6px)" }
      }
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-3 bg-background hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
        >
          <Icon className="h-4 w-4" style={{ color: IPN_GUINDA }} />
        </div>

        <div className="min-w-0">
          <div className="text-lg font-bold leading-none">{value}</div>
          <div className="text-xs font-medium leading-snug">{label}</div>
          {hint ? (
            <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ===================== Metrics ===================== */

function MetricsReal() {
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErrMsg(null);

        const res = await fetch(`${API_BASE}/public/stats`, { cache: "no-store" });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status} al cargar stats${t ? `: ${t}` : ""}`
          );
        }

        const json = (await res.json()) as PublicStats;

        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(e?.message || "Error al cargar métricas");
        setData(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const lastUpdate = useMemo(() => parseDate(data?.ultima_actualizacion), [data]);
  const lastPublish = useMemo(() => parseDate(data?.ultima_publicacion), [data]);

  const safe = (n?: number | null) => (typeof n === "number" ? n : 0);

  const badgeText = loading ? "Cargando" : errMsg ? "Sin conexión" : "Activo";
  const badgeStyles = loading
    ? {
        backgroundColor: "rgba(122,0,60,0.08)",
        color: IPN_GUINDA,
        border: "1px solid rgba(122,0,60,0.14)",
      }
    : errMsg
    ? {
        backgroundColor: "rgba(239,68,68,0.10)",
        color: "#991B1B",
        border: "1px solid rgba(239,68,68,0.20)",
      }
    : {
        backgroundColor: "rgba(34,197,94,0.12)",
        color: "#166534",
        border: "1px solid rgba(34,197,94,0.20)",
      };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold" style={{ color: IPN_GUINDA }}>
            Estado del sistema
          </h3>
          <p className="text-sm text-muted-foreground">Métricas generales</p>
        </div>

        <Badge className="rounded-full" style={badgeStyles}>
          {badgeText}
        </Badge>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Planeaciones registradas"
            value={loading ? "—" : String(safe(data?.planeaciones_total))}
            icon={FileText}
            hint="Totales en el sistema"
          />
          <MetricCard
            label="Planeaciones finalizadas"
            value={loading ? "—" : String(safe(data?.planeaciones_finalizadas))}
            icon={CheckCircle2}
            hint="Visibles públicamente"
          />
          <MetricCard
            label="Docentes participantes"
            value={loading ? "—" : String(safe(data?.docentes_participantes))}
            icon={Users}
            hint="Con planeaciones"
          />
          <MetricCard
            label="Unidades temáticas"
            value={loading ? "—" : String(safe(data?.unidades_tematicas_total))}
            icon={CalendarDays}
            hint="Total registradas"
          />
          <MetricCard
            label="Última actualización"
            value={
              loading ? "Cargando…" : lastUpdate ? fmtRelative(lastUpdate) : "Sin datos"
            }
            icon={Clock}
            hint={lastUpdate ? fmtDateTimeMX(lastUpdate) : "—"}
          />
          <MetricCard
            label="Última publicación"
            value={
              loading ? "Cargando…" : lastPublish ? fmtRelative(lastPublish) : "Sin publicaciones"
            }
            icon={CheckCircle2}
            hint={lastPublish ? fmtDateTimeMX(lastPublish) : "—"}
          />
        </div>
      </Card>
    </div>
  );
}

/* ===================== HOME ===================== */

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Instituto Politécnico Nacional" className="h-14 w-auto" />
            <div className="leading-tight">
              <div className="font-semibold text-sm sm:text-base" style={{ color: IPN_GUINDA }}>
                Instituto Politécnico Nacional
              </div>
              <div className="text-xs text-muted-foreground">
                Nivel Superior · Planeación Didáctica
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#fundamento" className="hover:text-foreground">Fundamento</a>
            <a href="#estructura" className="hover:text-foreground">Estructura</a>
            <a href="#como-se-concreta" className="hover:text-foreground">Cómo se concreta</a>
            <a href="#busqueda-publica" className="hover:text-foreground">Ver planeaciones</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
        </div>
      </header>

      {/* ================= HERO (se queda con border-b) ================= */}
      <section className="relative overflow-hidden">

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 10% 10%, rgba(122,0,60,0.10), transparent 60%), radial-gradient(700px 450px at 90% 20%, rgba(122,0,60,0.08), transparent 55%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                <BadgeCheck className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                Plataforma académica para consulta y seguimiento
              </p>

              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Planeación didáctica
              </h1>

              <p className="mt-4 text-muted-foreground max-w-prose">
                En el nivel superior, la planeación didáctica organiza el trabajo
                docente a partir del Modelo Educativo y Académico del IPN y se
                articula con los planes y programas de estudio. Incluye la
                definición de experiencias de aprendizaje, la secuencia temporal,
                criterios de evaluación y condiciones para su operación.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <AuthPanel buttonLabel="Iniciar sesión" buttonSize="lg" buttonClassName="px-6" />
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6"
                  onClick={() =>
                    document.getElementById("busqueda-publica")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Buscar planeaciones
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: IPN_GUINDA }} />
                  Búsqueda pública: solo planeaciones finalizadas
                </span>
                <span className="hidden sm:inline">•</span>
                <a
                  className="underline underline-offset-4 hover:text-foreground"
                  href="https://www.ipn.mx/seacademica/publicaciones.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Fundamento normativo de la Secretaría Académica
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex justify-center md:justify-end">
              <MetricsReal />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ✨ Divisor (sin borde extra arriba/abajo) */}
      <SectionDivider label="Marco institucional" />

      {/* ================= FUNDAMENTO (SIN border-b) ================= */}
      <section id="fundamento">
        <div className="mx-auto max-w-7xl px-4 py-14 space-y-8">
          <Reveal>
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
              >
                <ShieldCheck className="h-5 w-5" style={{ color: IPN_GUINDA }} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  Fundamento institucional y académico
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  La plataforma se alinea a los documentos institucionales que
                  orientan el quehacer académico: el Modelo Educativo Institucional
                  y el Manual XII para el rediseño de planes y programas en el
                  marco del Modelo Educativo y Académico.
                </p>
              </div>
            </div>
          </Reveal>

          {/* ✅ Tarjetas mismo alto */}
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            <Reveal delay={0.02}>
              <Card className="p-6 h-full">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                  <div className="font-semibold">Marco rector</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Define directrices generales del proceso de enseñanza–aprendizaje
                  y orienta la organización de planes y programas de estudio.
                </p>
              </Card>
            </Reveal>

            <Reveal delay={0.06}>
              <Card className="p-6 h-full">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                  <div className="font-semibold">Metodología</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Propone una metodología para el diseño curricular y considera
                  aspectos indispensables para la puesta en marcha: diseño de
                  cursos/experiencias, formación del personal académico y
                  condiciones de operación.
                </p>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <Card className="p-6 h-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                  <div className="font-semibold">Evaluación</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Incluye lineamientos generales para evaluación curricular y
                  requerimientos para la evaluación de estudiantes y profesores.
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider label="Estructura" />

      {/* ================= ESTRUCTURA (SIN border-b) ================= */}
      <section id="estructura" className="bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14 space-y-10">
          <Reveal>
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
              >
                <Layers className="h-5 w-5" style={{ color: IPN_GUINDA }} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  ¿Qué respalda una planeación didáctica?
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Componentes que el marco institucional y el Manual XII consideran
                  al organizar el aprendizaje, su secuencia temporal, su operación
                  y su evaluación.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Secuencia temporal",
                desc: "Determina qué se aprende y cuándo se aprende: orden y progresión del aprendizaje a lo largo del periodo.",
                icon: Route,
              },
              {
                title: "Experiencias de aprendizaje",
                desc: "Concreta cursos o experiencias de aprendizaje asociadas a la unidad de aprendizaje del nivel superior.",
                icon: GraduationCap,
              },
              {
                title: "Condiciones de operación",
                desc: "Integra lo necesario para operar y desarrollar la propuesta: organización, recursos y condiciones para su implementación.",
                icon: Wrench,
              },
              {
                title: "Evaluación del aprendizaje",
                desc: "Define criterios e instrumentos para valorar los aprendizajes y atender requerimientos de evaluación de estudiantes y profesores.",
                icon: CheckCircle2,
              },
              {
                title: "Calendarización",
                desc: "Considera la elaboración de un calendario de actividades para la puesta en marcha y seguimiento.",
                icon: CalendarClock,
              },
              {
                title: "Formación del personal",
                desc: "Contempla la formación del personal académico como parte de los elementos indispensables para implementar una propuesta.",
                icon: Users,
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <Reveal key={idx} delay={0.02 * idx}>
                  <Card className="p-6">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                      <div className="font-semibold">{s.title}</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider label="Concreción" />

      {/* ================= CÓMO SE CONCRETA (SIN border-b) ================= */}
      <section id="como-se-concreta">
        <div className="mx-auto max-w-7xl px-4 py-14 space-y-8">
          <Reveal>
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
              >
                <ClipboardList className="h-5 w-5" style={{ color: IPN_GUINDA }} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">
                  Cómo se concreta en práctica docente
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Síntesis operativa coherente con el Manual XII: del diseño al
                  seguimiento, con foco en el aprendizaje, la operación y la
                  evaluación.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  {
                    title: "1) Diseñar experiencias",
                    desc: "Definir cursos o experiencias de aprendizaje alineadas a la unidad de aprendizaje.",
                    icon: GraduationCap,
                  },
                  {
                    title: "2) Secuenciar y calendarizar",
                    desc: "Establecer la secuencia temporal del aprendizaje y un calendario de actividades.",
                    icon: CalendarClock,
                  },
                  {
                    title: "3) Asegurar operación",
                    desc: "Considerar condiciones de operación y formación del personal académico.",
                    icon: Wrench,
                  },
                  {
                    title: "4) Evaluar y actualizar",
                    desc: "Aplicar lineamientos para evaluación curricular y requerimientos de evaluación.",
                    icon: CheckCircle2,
                  },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="rounded-xl border p-4 bg-background">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
                        >
                          <Icon className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                        </div>
                        <div className="font-semibold">{s.title}</div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Esta plataforma te ayuda a organizar planeaciones y a consultar
                  públicamente las finalizadas.
                </div>

                <Button
                  variant="secondary"
                  className="w-full md:w-auto"
                  onClick={() =>
                    document.getElementById("busqueda-publica")?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
                    backgroundColor: "rgba(122,0,60,0.10)",
                    color: IPN_GUINDA,
                    border: "1px solid rgba(122,0,60,0.20)",
                  }}
                >
                  Ir a búsqueda pública <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <SectionDivider label="Consulta" />

      {/* ================= BÚSQUEDA PÚBLICA (SIN border-b) ================= */}
      <section id="busqueda-publica" className="bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <Reveal>
            <PublicoInline />
          </Reveal>
        </div>
      </section>

      <SectionDivider label="FAQ" />

      {/* ================= FAQ (SIN border-b) ================= */}
      <section id="faq">
        <div className="mx-auto max-w-7xl px-4 py-14 space-y-8">
          <Reveal>
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
              >
                <FileText className="h-5 w-5" style={{ color: IPN_GUINDA }} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Respuestas breves alineadas a los documentos institucionales.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    ¿En qué se fundamenta esta plataforma?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    En las publicaciones oficiales de la Secretaría Académica: el
                    Modelo Educativo Institucional y el Manual XII para el
                    rediseño de planes y programas en el marco del Modelo Educativo
                    y Académico.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    ¿Qué cubre una planeación didáctica a nivel superior?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Organización de experiencias de aprendizaje, secuencia temporal,
                    condiciones de operación, y criterios e instrumentos de
                    evaluación del aprendizaje y requerimientos de evaluación.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    ¿Qué se publica en la búsqueda pública?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Únicamente planeaciones didácticas finalizadas por los profesores
                    que participan en la plataforma, disponibles para consulta
                    pública dentro del sistema.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    ¿Esto sustituye los planes y programas de estudio?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    No. La planeación didáctica se articula con los planes y
                    programas de estudio; no los reemplaza.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="text-xs text-muted-foreground">
              Referencia institucional: Publicaciones de la Secretaría Académica (IPN).
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
