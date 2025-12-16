"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Loader2,
  Search,
  UserRound,
  BookOpen,
  XCircle,
  Building2,
  GraduationCap,
  Layers,
  Users,
  Clock3,
  BookMarked,
  FileText,
  } from "lucide-react";
import { toast } from "sonner";

import PublicoCronograma from "./PublicoCronograma";
import PublicoTimeline from "./PublicoTimeline";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/** ===== Tipos (mínimos) ===== */
type PublicItem = {
  id: number;
  slug: string;
  nombre_planeacion: string;
  unidad_aprendizaje: string;
  profesor: string;
  unidad_academica: string;
  unidad_academica_abreviatura: string;
  updated_at: string;
};

type Bloque = {
  id: number;
  numero_sesion: number;
  temas_subtemas: string;
  valor_porcentual: number;
  actividades?: {
    inicio?: string;
    desarrollo?: string;
    cierre?: string;
    [k: string]: any;
  };
  evidencias?: string[];
  instrumentos?: string[];
  recursos?: string[];
  [k: string]: any;
};

type UnidadTematica = {
  id: number;
  numero: number;
  nombre_unidad_tematica: string;
  unidad_competencia?: string;
  precisiones?: string;
  porcentaje?: number;
  periodo_desarrollo?: { del?: string; al?: string } | null;
  horas?: {
    aula?: number;
    clinica?: number;
    laboratorio?: number;
    otro?: number;
    taller?: number;
  };
  sesiones_totales?: number;
  aprendizajes_esperados?: string[];
  bloques?: Bloque[];
  [k: string]: any;
};

export type PublicPlaneacionDetalle = {
  id: number;
  slug: string;
  status?: string;

  nombre_planeacion: string;
  profesor: string;

  unidad_aprendizaje?: string;
  unidad_aprendizaje_nombre?: string;

  unidad_academica: string;
  unidad_academica_abreviatura: string;

  created_at?: string;
  updated_at?: string;

  academia?: string;
  programa_academico?: string;
  plan_estudios_anio?: number;
  semestre_nivel?: string;
  periodo_escolar?: string;
  modalidad?: string;
  grupos?: string;

  creditos_satca?: number;
  creditos_tepic?: number;

  horas_total?: number;
  horas_aula?: number;
  horas_teoria?: number;
  horas_practica?: number;
  horas_laboratorio?: number;
  horas_clinica?: number;
  horas_otro?: number;

  sesiones_por_semestre?: number;

  antecedentes?: string;
  laterales?: string;
  subsecuentes?: string;

  plagio_turnitin?: boolean;
  plagio_ithenticate?: boolean;
  plagio_otro?: string;

  referencias?: Array<{ id: number; tipo: string; cita_apa: string }>;

  unidades_tematicas?: UnidadTematica[];

  [k: string]: any;
};

/** ===== Helpers ===== */
function fmtDateTime(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtBool(v?: boolean) {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return "—";
}

function DenseKV({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium break-words leading-snug">
        {value}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

/** ===== Componente ===== */
export default function PublicoInline() {
  // filtros
  const [profesor, setProfesor] = useState("");
  const [unidad, setUnidad] = useState("");

  // resultados
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PublicItem[]>([]);

  // selección y detalle (abajo)
  const [selected, setSelected] = useState<PublicItem | null>(null);
  const [detail, setDetail] = useState<PublicPlaneacionDetalle | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const detailAnchorRef = useRef<HTMLDivElement | null>(null);

  // aborts
  const abortSearchRef = useRef<AbortController | null>(null);
  const abortDetailRef = useRef<AbortController | null>(null);

  const p = profesor.trim();
  const u = unidad.trim();

  const canSearch = useMemo(
    () => p.length >= MIN_CHARS || u.length >= MIN_CHARS,
    [p, u]
  );

  const queryKey = useMemo(
    () => `p=${p.toLowerCase()}&u=${u.toLowerCase()}`,
    [p, u]
  );

  async function runSearch() {
    if (!p && !u) {
      abortSearchRef.current?.abort();
      setItems([]);
      setLoading(false);
      setSelected(null);
      setDetail(null);
      return;
    }

    if (!canSearch) {
      setItems([]);
      setSelected(null);
      setDetail(null);
      return;
    }

    abortSearchRef.current?.abort();
    const controller = new AbortController();
    abortSearchRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (p.length >= MIN_CHARS) params.set("profesor", p);
      if (u.length >= MIN_CHARS) params.set("unidad", u);

      const res = await fetch(`${API_BASE}/public/planeaciones?${params}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Error ${res.status}`);
      }

      const data = await res.json();
      const arr = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);

      if (selected && !arr.some((x: PublicItem) => x.slug === selected.slug)) {
        setSelected(null);
        setDetail(null);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError")
        toast.error(e?.message || "No se pudo buscar.");
    } finally {
      if (abortSearchRef.current === controller) setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(runSearch, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, canSearch]);

  async function loadDetailBySlug(slug: string) {
    abortDetailRef.current?.abort();
    const controller = new AbortController();
    abortDetailRef.current = controller;

    setLoadingDetail(true);
    setDetail(null);

    try {
      const res = await fetch(
        `${API_BASE}/public/planeaciones/slug/${encodeURIComponent(slug)}`,
        {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Error ${res.status} al cargar detalle. ${txt}`);
      }

      const data = (await res.json()) as PublicPlaneacionDetalle;
      setDetail(data ?? null);

      requestAnimationFrame(() => {
        detailAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (e: any) {
      if (e?.name !== "AbortError")
        toast.error(e?.message || "No se pudo cargar el detalle.");
    } finally {
      if (abortDetailRef.current === controller) setLoadingDetail(false);
    }
  }

  function clearAll() {
    abortSearchRef.current?.abort();
    abortDetailRef.current?.abort();
    setProfesor("");
    setUnidad("");
    setItems([]);
    setSelected(null);
    setDetail(null);
    setLoading(false);
    setLoadingDetail(false);
  }

  const uaSel =
    detail?.unidad_academica_abreviatura ||
    selected?.unidad_academica_abreviatura ||
    detail?.unidad_academica ||
    selected?.unidad_academica ||
    "—";

  const unidadNombre =
    detail?.unidad_aprendizaje_nombre ||
    detail?.unidad_aprendizaje ||
    selected?.unidad_aprendizaje ||
    "—";

  return (
    <div className="space-y-6">
      {/* ====== BLOQUE SUPERIOR: filtros + lista ====== */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold truncate">
              Búsqueda de planeación didáctica{" "}
            </h2>
          </div>

          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2">
            <XCircle className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        <Separator className="my-2" />

        {/* ✅ AJUSTE: 1/3 filtros, 2/3 resultados (desde lg) */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* IZQUIERDA: filtros (1/3) */}
          <div className="rounded-md border p-4 space-y-3 lg:col-span-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Docente
              </div>
              <Input
                placeholder="Ej. Romina Salazar Gómez"
                value={profesor}
                onChange={(e) => setProfesor(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Unidad de aprendizaje
              </div>
              <Input
                placeholder="Ej. Administración de Sistemas Operativos"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
              />
            </div>

            <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between gap-3">
              <span>
                {!p && !u
                  ? "Empieza a escribir…"
                  : !canSearch
                  ? `Escribe al menos ${MIN_CHARS} letras.`
                  : loading
                  ? "Buscando…"
                  : `${items.length} resultado(s).`}
              </span>

              {loading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : null}
            </div>
          </div>

          {/* DERECHA: listado con scroll (2/3) */}
          <div className="rounded-md border p-4 lg:col-span-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Planeaciones{" "}
                <span className="text-foreground font-medium">
                  {items.length}
                </span>
              </div>

              {selected ? (
                <Badge variant="outline" className="text-xs">
                  Seleccionada
                </Badge>
              ) : !loading && items.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: "rgba(122,0,60,0.10)",
                    color: "#7A003C",
                    border: "1px solid rgba(122,0,60,0.25)",
                  }}
                >
                  Selecciona una planeación didáctica
                </Badge>
              ) : null}

            </div>

            <Separator className="my-3" />

            <div className="max-h-[420px] overflow-auto pr-1 space-y-2">
              {!p && !u ? (
                <div className="text-sm text-muted-foreground">
                  Escribe un docente o una unidad de aprendizaje para ver
                  resultados.
                </div>
              ) : !canSearch ? (
                <div className="text-sm text-muted-foreground">
                  Escribe al menos {MIN_CHARS} letras.
                </div>
              ) : items.length === 0 && !loading ? (
                <div className="text-sm text-muted-foreground">Sin resultados.</div>
              ) : (
                items.map((it) => {
                  const ua =
                    it.unidad_academica_abreviatura || it.unidad_academica;
                  const active = selected?.slug === it.slug;

                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setSelected(it);
                        loadDetailBySlug(it.slug);
                      }}
                      className={[
                        "w-full text-left rounded-md border p-3 transition",
                        "hover:bg-muted/50",
                        active ? "ring-1" : "",
                      ].join(" ")}
                      style={
                        active
                          ? {
                              borderColor: "rgba(122,0,60,0.35)",
                              backgroundColor: "rgba(122,0,60,0.08)",
                              boxShadow:
                                "0 0 0 1px rgba(122,0,60,0.18) inset",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className="font-semibold truncate"
                            style={active ? { color: "#7A003C" } : undefined}
                          >
                            {it.nombre_planeacion}
                          </div>

                          <div className="text-sm text-muted-foreground truncate">
                            {it.profesor} · {ua}
                          </div>
                          <div className="mt-1 text-sm truncate">
                            <span className="text-muted-foreground">
                              Unidad de aprendizaje:{" "}
                            </span>
                            <span className="font-medium">
                              {it.unidad_aprendizaje}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDateTime(it.updated_at)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ====== DETALLE ABAJO (solo Datos generales + Plagio + Referencias) ====== */}
      <div ref={detailAnchorRef} />

      {selected ? (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold leading-tight">
                  {selected.nombre_planeacion}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {safeStr(detail?.status)}
                </Badge>
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">
                  {selected.profesor}
                </span>
                <span className="mx-2">·</span>
                <span>{uaSel}</span>
              </div>

              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">
                  Unidad de aprendizaje:{" "}
                </span>
                <span className="font-medium">{unidadNombre}</span>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Actualizada: {fmtDateTime(detail?.updated_at || selected.updated_at)}
              </div>
            </div>

            <Badge variant="secondary" className="shrink-0">
              id: {selected.id}
            </Badge>
          </div>

          <Separator className="my-5" />

          {loadingDetail ? (
            <div className="text-sm text-muted-foreground inline-flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cargando detalle…
            </div>
          ) : !detail ? (
            <div className="text-sm text-muted-foreground">Sin detalle.</div>
          ) : (
            <div className="space-y-6">
              {/* ========= DATOS GENERALES ========= */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-xl border p-2"
                        style={{
                          borderColor: "rgba(122,0,60,0.20)",
                          background: "rgba(122,0,60,0.08)",
                        }}
                      >
                        <FileText className="h-4 w-4" style={{ color: "#7A003C" }} />
                      </div>

                      <div>
                        <div className="font-semibold leading-none">Datos generales</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Identificación académica, créditos, horas y sesiones
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Chip>
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        {safeStr(detail.academia)}
                      </Chip>
                      <Chip>
                        <GraduationCap className="h-3.5 w-3.5 mr-1" />
                        {safeStr(detail.programa_academico)}
                      </Chip>
                      <Chip>
                        <Layers className="h-3.5 w-3.5 mr-1" />
                        {safeStr(detail.modalidad)}
                      </Chip>
                      <Chip>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {safeStr(detail.grupos)}
                      </Chip>
                    </div>
                </div>


                <div className="mt-3 grid md:grid-cols-3 gap-2">
                  <DenseKV
                    label="Periodo escolar"
                    value={safeStr(detail.periodo_escolar)}
                    icon={<BookMarked className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Semestre/Nivel"
                    value={safeStr(detail.semestre_nivel)}
                    icon={<Layers className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Plan (año)"
                    value={safeStr(detail.plan_estudios_anio)}
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                  />

                  <DenseKV
                    label="Créditos SATCA"
                    value={safeStr(detail.creditos_satca)}
                    icon={<GraduationCap className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Créditos TEPIC"
                    value={safeStr(detail.creditos_tepic)}
                    icon={<GraduationCap className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Sesiones por semestre"
                    value={safeStr(detail.sesiones_por_semestre)}
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                  />

                  <DenseKV
                    label="Horas total"
                    value={safeStr(detail.horas_total)}
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Horas aula / lab"
                    value={`${safeStr(detail.horas_aula)} / ${safeStr(
                      detail.horas_laboratorio
                    )}`}
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                  />
                  <DenseKV
                    label="Horas teoría / práctica"
                    value={`${safeStr(detail.horas_teoria)} / ${safeStr(
                      detail.horas_practica
                    )}`}
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>

              {/* ========= PLAGIO + REFERENCIAS (como lo pediste) ========= */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-md border p-4">
                  <div className="font-semibold">Plagio</div>
                  <Separator className="my-3" />
                  <div className="grid sm:grid-cols-3 gap-2">
                    <DenseKV
                      label="Turnitin"
                      value={fmtBool(detail.plagio_turnitin)}
                    />
                    <DenseKV
                      label="iThenticate"
                      value={fmtBool(detail.plagio_ithenticate)}
                    />
                    <DenseKV
                      label="Otro"
                      value={
                        <span className="whitespace-pre-wrap">
                          {safeStr(detail.plagio_otro)}
                        </span>
                      }
                    />
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="font-semibold">Referencias</div>
                  <Separator className="my-3" />
                  {detail.referencias?.length ? (
                      <div className="max-h-[320px] overflow-auto pr-1 space-y-3">
                        {detail.referencias.map((r) => (
                          <div key={r.id} className="rounded-md border p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{r.tipo}</Badge>
                            </div>
                            <div className="mt-2 text-xs whitespace-pre-wrap">{r.cita_apa}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}

                </div>
              </div>

              {/* ========= SEMBRADO: cronograma y timeline (aún sin implementar) ========= */}
              <PublicoCronograma detail={detail} />
              <PublicoTimeline detail={detail} />
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
