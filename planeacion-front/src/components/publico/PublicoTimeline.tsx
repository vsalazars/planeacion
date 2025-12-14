"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  Clock,
  Layers,
  Sparkles,
  CalendarDays,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Dot,
} from "lucide-react";
import type { PublicPlaneacionDetalle } from "./PublicoInline";

const IPN_GUINDA = "#7A003C";
const IPN_GUINDA_SOFT = "rgba(122,0,60,0.08)";
const IPN_GUINDA_BORDER = "rgba(122,0,60,0.20)";
const SOFT_BORDER = "rgba(0,0,0,0.08)";

type UT = NonNullable<PublicPlaneacionDetalle["unidades_tematicas"]>[number];
type Bloque = NonNullable<UT["bloques"]>[number];

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function txt(v: any): string {
  const s = (v ?? "").toString().trim();
  return s;
}

function sumHoras(ut: UT) {
  const h = (ut as any)?.horas ?? {};
  return n(h.aula) + n(h.laboratorio) + n(h.taller) + n(h.clinica) + n(h.otro);
}

function sumSesionesPorEspacio(ut: UT) {
  const s = (ut as any)?.sesiones_por_espacio ?? {};
  return (
    n(s.aula) + n(s.laboratorio) + n(s.taller) + n(s.clinica) + n(s.otro)
  );
}

function countSesiones(ut: UT): number {
  const raw = n((ut as any)?.sesiones_totales);
  if (raw > 0) return raw;

  const bloques = ((ut as any)?.bloques ?? []) as any[];
  if (bloques.length > 0) return bloques.length;

  const bySpace = sumSesionesPorEspacio(ut);
  return bySpace;
}

function isActiveByDates(del?: string | null, al?: string | null) {
  const d1 = parseDate(del);
  const d2 = parseDate(al);
  if (!d1 || !d2) return false;
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return t.getTime() >= d1.getTime() && t.getTime() <= d2.getTime();
}

function MetricPill({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "accent";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border backdrop-blur";
  const style =
    tone === "accent"
      ? {
          background: IPN_GUINDA_SOFT,
          borderColor: IPN_GUINDA_BORDER,
          color: IPN_GUINDA,
        }
      : {
          background: "rgba(255,255,255,0.65)",
          borderColor: SOFT_BORDER,
        };

  return (
    <div className={base} style={style}>
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MiniChipsRow({
  title,
  icon,
  items,
}: {
  title: string;
  icon?: React.ReactNode;
  items: { k: string; v: number }[];
}) {
  const hasAny = items.some((x) => x.v > 0);
  const show = hasAny ? items.filter((x) => x.v > 0) : items;

  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 shrink-0 rounded-lg border p-1.5 text-muted-foreground"
        style={{ borderColor: SOFT_BORDER, background: "rgba(0,0,0,0.02)" }}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-muted-foreground">
          {title}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {show.map((x) => (
            <Badge
              key={x.k}
              variant="secondary"
              className="text-[11px] font-medium"
              style={{
                background: "rgba(0,0,0,0.04)",
                border: `1px solid ${SOFT_BORDER}`,
              }}
            >
              {x.k}: {x.v}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const v = txt(value);
  if (!v) return null;
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{v}</div>
    </div>
  );
}

function BloqueCompact({ b }: { b: Bloque }) {
  const num = (b as any)?.numero_sesion ?? "";
  const temas = txt((b as any)?.temas_subtemas) || "Tema — Subtema…";

  const act = (b as any)?.actividades ?? {};
  const inicio = txt(act?.inicio);
  const desarrollo = txt(act?.desarrollo);
  const cierre = txt(act?.cierre);

  const recursos = txt((b as any)?.recursos);
  const evidencias = txt((b as any)?.evidencias);
  const instrumentos = txt((b as any)?.instrumentos);
  const valor = (b as any)?.valor_porcentual;

  return (
    <div
      className="rounded-2xl border p-3 sm:p-4"
      style={{
        borderColor: SOFT_BORDER,
        background: "rgba(255,255,255,0.75)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[11px]">
              Sesión {num || "—"}
            </Badge>

            {valor != null && `${valor}`.trim() !== "" ? (
              <Badge
                variant="outline"
                className="text-[11px]"
                style={{ borderColor: IPN_GUINDA_BORDER, color: IPN_GUINDA }}
              >
                {valor}%
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 text-sm font-medium whitespace-pre-wrap">
            {temas}
          </div>
        </div>
      </div>

      {(inicio || desarrollo || cierre) && (
        <div className="mt-3 space-y-2">
          <DetailBlock label="Inicio" value={inicio} />
          <DetailBlock label="Desarrollo" value={desarrollo} />
          <DetailBlock label="Cierre" value={cierre} />
        </div>
      )}

      {(recursos || evidencias || instrumentos) && (
        <>
          <Separator className="my-3" />
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailBlock label="Recursos" value={recursos} />
            <DetailBlock label="Evidencias" value={evidencias} />
            <DetailBlock label="Instrumentos" value={instrumentos} />
          </div>
        </>
      )}
    </div>
  );
}

export default function PublicoTimeline({
  detail,
}: {
  detail: PublicPlaneacionDetalle;
}) {
  const unidades = useMemo(() => {
    const uts = (detail.unidades_tematicas ?? []) as UT[];
    return [...uts].sort(
      (a, b) => n((a as any)?.numero) - n((a as any)?.numero) + n((b as any)?.numero) - n((b as any)?.numero)
    );
  }, [detail.unidades_tematicas]);

  // ⚠️ el sort anterior quedó feo por copy; lo corregimos sin cambiar nada más:
  const unidadesSorted = useMemo(() => {
    const uts = (detail.unidades_tematicas ?? []) as UT[];
    return [...uts].sort(
      (a, b) => n((a as any)?.numero) - n((b as any)?.numero)
    );
  }, [detail.unidades_tematicas]);

  const activeIndex = useMemo(() => {
    const i = unidadesSorted.findIndex((ut) => {
      const pd = (ut as any)?.periodo_desarrollo ?? {};
      return isActiveByDates(pd?.del, pd?.al);
    });
    return i >= 0 ? i : null;
  }, [unidadesSorted]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number>(activeIndex ?? 0);

  const canPrev = selected > 0;
  const canNext = selected < unidadesSorted.length - 1;
  const current = unidadesSorted[selected] as UT | undefined;

  function openAt(index: number) {
    const safe = Math.max(0, Math.min(unidadesSorted.length - 1, index));
    setSelected(safe);
    setOpen(true);
  }

  return (
    <Card className="p-4 sm:p-6">
      {/* Header pro */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="rounded-xl border p-2"
            style={{
              borderColor: IPN_GUINDA_BORDER,
              background: IPN_GUINDA_SOFT,
            }}
          >
            <CalendarRange className="h-4 w-4" style={{ color: IPN_GUINDA }} />
          </div>
          <div>
            <div className="font-semibold leading-none">Timeline</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Unidades temáticas y sesiones didácticas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MetricPill
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Unidades"
            value={unidadesSorted.length}
            tone="accent"
          />
          {activeIndex != null ? (
            <MetricPill
              icon={<Dot className="h-4 w-4" />}
              label="Vigente"
              value={`Unidad ${(unidadesSorted[activeIndex] as any)?.numero ?? activeIndex + 1}`}
              tone="accent"
            />
          ) : null}
        </div>
      </div>

      <Separator className="my-4" />

      {unidadesSorted.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No hay unidades temáticas publicadas.
        </div>
      ) : (
        <div className="space-y-3">
          {unidadesSorted.map((ut, idx) => {
            const id = (ut as any)?.id ?? `ut-${idx}`;
            const numero = (ut as any)?.numero ?? idx + 1;
            const nombre =
              txt((ut as any)?.nombre_unidad_tematica) || "Unidad temática";

            const pd = (ut as any)?.periodo_desarrollo ?? {};
            const del = parseDate(pd?.del);
            const al = parseDate(pd?.al);

            const isActive = activeIndex === idx;

            const horasObj = (ut as any)?.horas ?? {};
            const sesionesObj = (ut as any)?.sesiones_por_espacio ?? {};

            const totalHoras = sumHoras(ut);
            const sesionesTotales = countSesiones(ut);

            // ✅ la “selección” ahora manda el glow
            const isSelected = open && selected === idx;
            const highlight = isSelected || isActive;

            return (
              <div key={id} className="relative group">
                {/* Rail premium */}
                <div
                  className="absolute left-2 top-0 bottom-0 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.03))",
                  }}
                  aria-hidden="true"
                />

                {/* Dot */}
                <div
                  className="absolute left-[2px] top-6 h-4 w-4 rounded-full border"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    borderColor: highlight ? IPN_GUINDA : IPN_GUINDA_BORDER,
                    boxShadow: highlight ? `0 0 0 6px ${IPN_GUINDA_SOFT}` : "none",
                  }}
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-[3px] rounded-full"
                    style={{ background: IPN_GUINDA }}
                  />
                </div>

                <div className="pl-10">
                  <div
                    className="rounded-2xl border p-4 sm:p-5 transition-all"
                    style={{
                      borderColor: highlight ? IPN_GUINDA_BORDER : SOFT_BORDER,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.70))",
                      boxShadow: highlight
                        ? `0 16px 40px rgba(0,0,0,0.05), 0 0 0 6px ${IPN_GUINDA_SOFT}`
                        : "0 10px 30px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[11px]"
                            style={{
                              background: IPN_GUINDA_SOFT,
                              color: IPN_GUINDA,
                              border: `1px solid ${IPN_GUINDA_BORDER}`,
                            }}
                          >
                            Unidad {numero}
                          </Badge>

                          {isActive ? (
                            <Badge
                              variant="outline"
                              className="text-[11px]"
                              style={{
                                borderColor: IPN_GUINDA,
                                color: IPN_GUINDA,
                                background: "rgba(122,0,60,0.04)",
                              }}
                            >
                              Vigente
                            </Badge>
                          ) : null}

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{del ? fmtDate(del) : "—"}</span>
                            <span className="opacity-60">→</span>
                            <span>{al ? fmtDate(al) : "—"}</span>
                          </div>
                        </div>

                        <div className="mt-1 text-sm sm:text-base font-semibold leading-snug">
                          {nombre}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <MetricPill
                          icon={<Layers className="h-3.5 w-3.5" />}
                          label="Sesiones"
                          value={sesionesTotales}
                        />
                        <MetricPill
                          icon={<Clock className="h-3.5 w-3.5" />}
                          label="Horas"
                          value={totalHoras}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <MiniChipsRow
                        title="Horas por espacio"
                        icon={<Clock className="h-4 w-4" />}
                        items={[
                          { k: "Aula", v: n(horasObj.aula) },
                          { k: "Lab", v: n(horasObj.laboratorio) },
                          { k: "Taller", v: n(horasObj.taller) },
                          { k: "Clínica", v: n(horasObj.clinica) },
                          { k: "Otro", v: n(horasObj.otro) },
                          { k: "Total", v: totalHoras },
                        ]}
                      />

                      <MiniChipsRow
                        title="Sesiones por espacio"
                        icon={<Layers className="h-4 w-4" />}
                        items={[
                          { k: "Aula", v: n(sesionesObj.aula) },
                          { k: "Lab", v: n(sesionesObj.laboratorio) },
                          { k: "Taller", v: n(sesionesObj.taller) },
                          { k: "Clínica", v: n(sesionesObj.clinica) },
                          { k: "Otro", v: n(sesionesObj.otro) },
                          { k: "Total", v: sesionesTotales },
                        ]}
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        {(((ut as any)?.bloques ?? []) as any[]).length} sesión(es)
                      </div>

                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => openAt(idx)}
                      >
                        Ver detalle <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog global con navegación (DialogDescription solo texto) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          {current ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[11px]"
                    style={{
                      background: IPN_GUINDA_SOFT,
                      color: IPN_GUINDA,
                      border: `1px solid ${IPN_GUINDA_BORDER}`,
                    }}
                  >
                    Unidad {(current as any)?.numero ?? selected + 1}
                  </Badge>

                  <span className="truncate">
                    {txt((current as any)?.nombre_unidad_tematica) ||
                      "Unidad temática"}
                  </span>
                </DialogTitle>

                <DialogDescription>
                  Competencia, aprendizajes, precisiones y sesiones didácticas.
                </DialogDescription>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => setSelected((s) => Math.max(0, s - 1))}
                    disabled={!canPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() =>
                      setSelected((s) => Math.min(unidadesSorted.length - 1, s + 1))
                    }
                    disabled={!canNext}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-3">
                <div className="space-y-3">
                  <div
                    className="rounded-2xl border p-4 space-y-3"
                    style={{
                      borderColor: SOFT_BORDER,
                      background: "rgba(0,0,0,0.02)",
                    }}
                  >
                    <DetailBlock
                      label="Unidad de competencia"
                      value={txt((current as any)?.unidad_competencia)}
                    />
                    <DetailBlock
                      label="Aprendizajes esperados"
                      value={txt((current as any)?.aprendizajes_esperados)}
                    />
                    <DetailBlock
                      label="Precisiones"
                      value={txt((current as any)?.precisiones)}
                    />
                  </div>

                  {(((current as any)?.bloques ?? []) as Bloque[]).length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      (Esta unidad no tiene sesiones registradas.)
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(((current as any)?.bloques ?? []) as Bloque[])
                        .slice()
                        .sort(
                          (a, b) =>
                            n((a as any)?.numero_sesion) -
                            n((b as any)?.numero_sesion)
                        )
                        .map((b, j) => (
                          <BloqueCompact
                            key={(b as any)?.id ?? `dlg-b-${selected}-${j}`}
                            b={b}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
