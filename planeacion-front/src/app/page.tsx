"use client";

import React, { useEffect, useMemo, useState } from "react";

import AuthPanel from "@/components/auth/AuthPanel";
import PublicoInline from "@/components/publico/PublicoInline";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";

import {
  FileText,
  CheckCircle2,
  CalendarDays,
  Users,
  Clock,
} from "lucide-react";

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

// “Hace 2 días”, “Hace 3 horas”, etc.
function fmtRelative(esDate: Date) {
  const now = new Date();
  const diffMs = now.getTime() - esDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Hace unos segundos";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr} h`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `Hace ${diffDay} día${diffDay === 1 ? "" : "s"}`;

  const diffMon = Math.floor(diffDay / 30);
  if (diffMon < 12) return `Hace ${diffMon} mes${diffMon === 1 ? "" : "es"}`;

  const diffYr = Math.floor(diffMon / 12);
  return `Hace ${diffYr} año${diffYr === 1 ? "" : "s"}`;
}

function fmtDateTimeMX(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

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

        const res = await fetch(`${API_BASE}/public/stats`, {
          cache: "no-store",
        });

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

  const metrics = useMemo(() => {
    const safe = (n?: number | null) => (typeof n === "number" ? n : 0);

    return [
      {
        label: "Planeaciones registradas",
        value: loading ? "—" : String(safe(data?.planeaciones_total)),
        icon: FileText,
        hint: "Totales en el sistema",
      },
      {
        label: "Planeaciones finalizadas",
        value: loading ? "—" : String(safe(data?.planeaciones_finalizadas)),
        icon: CheckCircle2,
        hint: "Visibles públicamente",
      },
      {
        label: "Docentes participantes",
        value: loading ? "—" : String(safe(data?.docentes_participantes)),
        icon: Users,
        hint: "Con planeaciones",
      },
      {
        label: "Unidades temáticas",
        value: loading ? "—" : String(safe(data?.unidades_tematicas_total)),
        icon: CalendarDays,
        hint: "Total registradas",
      },
      {
        label: "Última actualización",
        value: loading
          ? "Cargando…"
          : lastUpdate
          ? fmtRelative(lastUpdate)
          : "Sin datos",
        icon: Clock,
        hint: lastUpdate ? fmtDateTimeMX(lastUpdate) : "—",
      },
      {
        label: "Última publicación",
        value: loading
          ? "Cargando…"
          : lastPublish
          ? fmtRelative(lastPublish)
          : "Sin publicaciones",
        icon: CheckCircle2,
        hint: lastPublish ? fmtDateTimeMX(lastPublish) : "—",
      },
    ];
  }, [data, loading, lastUpdate, lastPublish]);

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
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="rounded-xl border p-3 bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(122,0,60,0.08)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: IPN_GUINDA }} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-bold leading-none">
                      {m.value}
                    </div>
                    <div className="text-xs font-medium leading-snug">
                      {m.label}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {m.hint}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

       
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Branding IPN */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Instituto Politécnico Nacional"
              className="h-14 w-auto"
            />
            <div className="leading-tight">
              <div
                className="font-semibold text-sm sm:text-base"
                style={{ color: IPN_GUINDA }}
              >
                Instituto Politécnico Nacional
              </div>
              <div className="text-xs text-muted-foreground">
                Dirección de Educación Superior
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#que-es" className="hover:text-foreground">
              ¿Qué es?
            </a>
            <a href="#beneficios" className="hover:text-foreground">
              Beneficios
            </a>
            <a href="#caracteristicas" className="hover:text-foreground">
              Características
            </a>
            <a href="#faqs" className="hover:text-foreground">
              FAQ
            </a>
            <a href="#contacto" className="hover:text-foreground">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          {/* Texto principal */}
          <div>
           <p className="mb-3 inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
              <BadgeCheck className="h-4 w-4" style={{ color: IPN_GUINDA }} />
              v1.0.0
            </p>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Planeación didáctica
            </h1>

            <p className="mt-4 text-muted-foreground max-w-prose">
              La planeación didáctica en el IPN a nivel superior es una
              herramienta crucial para alinear la práctica docente con el Modelo
              Educativo Institucional, enfocada en el desarrollo de competencias.
              
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <AuthPanel
                buttonLabel="Iniciar sesión"
                buttonSize="lg"
                buttonClassName="px-6"
              />

              <Button
                variant="outline"
                size="lg"
                className="px-6"
                onClick={() =>
                  document
                    .getElementById("busqueda-publica")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Buscar planeaciones
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Búsqueda pública: solo planeaciones finalizadas.
            </p>
          </div>

          {/* MÉTRICAS REALES */}
          <div className="hidden md:flex justify-center">
            <MetricsReal />
          </div>
        </div>
      </section>

      {/* ================= BÚSQUEDA PÚBLICA ================= */}
      <section id="busqueda-publica" className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <PublicoInline />
        </div>
      </section>

      {/* (Si quieres, aquí reinsertas tus secciones informativas) */}
    </main>
  );
}
