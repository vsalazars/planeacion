"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarRange } from "lucide-react";
import type { PublicPlaneacionDetalle } from "./PublicoInline";

type UT = NonNullable<PublicPlaneacionDetalle["unidades_tematicas"]>[number];

const IPN_GUINDA = "#7A003C";
const IPN_GUINDA_BG = "rgba(122, 0, 60, 0.18)";

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtShort(d: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "short" }).format(d);
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isWeekend(d: Date) {
  const wd = d.getDay();
  return wd === 0 || wd === 6;
}

function daysDiff(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getRange(ut: UT) {
  const del = parseDate(ut.periodo_desarrollo?.del);
  const al = parseDate(ut.periodo_desarrollo?.al);
  if (!del || !al) return null;
  const start = del.getTime() <= al.getTime() ? del : al;
  const end = del.getTime() <= al.getTime() ? al : del;
  return { start, end };
}

/**
 * Construye un arreglo de días hábiles (L–V) dentro de un rango inclusivo.
 */
function buildBusinessDays(minStart: Date, maxEnd: Date) {
  const totalCalendarDays = clamp(daysDiff(minStart, maxEnd) + 1, 1, 5000);
  const out: Date[] = [];
  for (let i = 0; i < totalCalendarDays; i++) {
    const d = addDays(minStart, i);
    if (!isWeekend(d)) out.push(d);
  }
  return out;
}

/**
 * Mapea YYYY-MM-DD -> índice de columna (0..n-1) sobre días hábiles.
 * Si la fecha cae en fin de semana o fuera del rango, se ajusta al día hábil más cercano dentro del rango.
 */
function buildBusinessIndex(days: Date[]) {
  const map = new Map<string, number>();
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const key = d.toISOString().slice(0, 10);
    map.set(key, i);
  }

  function keyOf(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  function nearestIndex(d: Date): number {
    if (days.length === 0) return 0;

    if (d <= days[0]) return 0;
    if (d >= days[days.length - 1]) return days.length - 1;

    const k = keyOf(d);
    const exact = map.get(k);
    if (exact !== undefined) return exact;

    // fin de semana: busca más cercano (adelante primero)
    for (let step = 1; step <= 3; step++) {
      const fwd = addDays(d, step);
      const bwd = addDays(d, -step);
      const f = map.get(keyOf(fwd));
      if (f !== undefined) return f;
      const b = map.get(keyOf(bwd));
      if (b !== undefined) return b;
    }

    // fallback
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < days.length; i++) {
      const dist = Math.abs(days[i].getTime() - d.getTime());
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  return { map, nearestIndex };
}

// Agrupa días consecutivos por mes para header “MES”
function buildMonthSegments(days: Date[]) {
  const segs: Array<{ key: string; label: string; fromIdx: number; toIdx: number }> = [];
  if (days.length === 0) return segs;

  let fromIdx = 0;
  let curM = days[0].getMonth();
  let curY = days[0].getFullYear();

  for (let i = 1; i < days.length; i++) {
    const m = days[i].getMonth();
    const y = days[i].getFullYear();
    if (m !== curM || y !== curY) {
      segs.push({
        key: `${curY}-${curM}-${fromIdx}`,
        label: `${fmtShort(days[fromIdx])} ${curY}`,
        fromIdx,
        toIdx: i - 1,
      });
      fromIdx = i;
      curM = m;
      curY = y;
    }
  }

  segs.push({
    key: `${curY}-${curM}-${fromIdx}`,
    label: `${fmtShort(days[fromIdx])} ${curY}`,
    fromIdx,
    toIdx: days.length - 1,
  });

  return segs;
}

export default function PublicoCronograma({
  detail,
}: {
  detail: PublicPlaneacionDetalle;
}) {
  const unidades = useMemo(() => {
    const uts = Array.isArray(detail.unidades_tematicas)
      ? detail.unidades_tematicas
      : [];
    return [...uts].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  }, [detail.unidades_tematicas]);

  const global = useMemo(() => {
    const ranges = unidades
      .map(getRange)
      .filter(Boolean) as Array<{ start: Date; end: Date }>;
    if (ranges.length === 0) return null;

    const minStart = ranges.reduce(
      (m, r) => (r.start < m ? r.start : m),
      ranges[0].start
    );
    const maxEnd = ranges.reduce(
      (m, r) => (r.end > m ? r.end : m),
      ranges[0].end
    );

    return { minStart, maxEnd };
  }, [unidades]);

  // días hábiles (L-V)
  const days = useMemo(() => {
    if (!global) return [];
    return buildBusinessDays(global.minStart, global.maxEnd);
  }, [global]);

  const { nearestIndex } = useMemo(() => buildBusinessIndex(days), [days]);
  const monthSegs = useMemo(() => buildMonthSegments(days), [days]);

  // HOY -> índice en días hábiles (si cae fin, se ajusta al hábil más cercano)
  const todayIdx = useMemo(() => {
    if (!days.length) return null;
    const today = parseDate(new Date().toISOString());
    if (!today) return null;
    return nearestIndex(today);
  }, [days, nearestIndex]);

  // ajustes visuales
  const leftColsW = 360;
  const dayW = 24;
  const rowH = 44;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
       <div className="flex items-center gap-3">
          <div
            className="rounded-xl border p-2"
            style={{
              borderColor: "rgba(122,0,60,0.20)",
              background: "rgba(122,0,60,0.08)",
            }}
          >
            <CalendarRange className="h-4 w-4" style={{ color: IPN_GUINDA }} />
          </div>

          <div>
            <div className="font-semibold leading-none">
              Cronograma
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Gantt · días hábiles
            </div>
          </div>
        </div>



        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {unidades.length} unidades temáticas
          </Badge>

          {global ? (
            <Badge variant="secondary" className="text-xs">
              {fmtDate(global.minStart)} → {fmtDate(global.maxEnd)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              sin fechas
            </Badge>
          )}

     

          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: IPN_GUINDA, color: IPN_GUINDA }}
          >
            Hoy: {fmtDate(new Date())}
          </Badge>
        </div>
      </div>

      <Separator className="my-3" />

      {!global ? (
        <div className="text-sm text-muted-foreground">
          No hay fechas “del/al” suficientes para construir el Gantt.
        </div>
      ) : days.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          El rango de fechas cae solo en fines de semana (o no hay días hábiles).
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-auto">
            <div
              className="relative"
              style={{ minWidth: leftColsW + days.length * dayW }}
            >
              {/* HEADER sticky */}
              <div
                className="sticky top-0 z-20 bg-background"
                style={{ minWidth: leftColsW + days.length * dayW }}
              >
                {/* fila 1: Meses */}
                <div className="flex border-b">
                  <div
                    className="sticky left-0 z-30 bg-background border-r"
                    style={{ width: leftColsW }}
                  >
                    <div className="h-9 px-3 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Unidad temática</div>
                      <div className="text-xs text-muted-foreground">Periodo</div>
                    </div>
                  </div>

                  <div className="relative" style={{ width: days.length * dayW }}>
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${days.length}, ${dayW}px)`,
                      }}
                    >
                      {monthSegs.map((seg) => {
                        const span = seg.toIdx - seg.fromIdx + 1;
                        return (
                          <div
                            key={seg.key}
                            className="h-9 border-r last:border-r-0 flex items-center"
                            style={{
                              gridColumn: `${seg.fromIdx + 1} / span ${span}`,
                            }}
                          >
                            <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                              {seg.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* fila 2: Días (solo L–V) */}
                <div className="flex border-b">
                  <div
                    className="sticky left-0 z-30 bg-background border-r"
                    style={{ width: leftColsW }}
                  >
                    <div className="h-9 px-3 flex items-center">
                      <div className="text-xs text-muted-foreground">Detalle</div>
                    </div>
                  </div>

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${days.length}, ${dayW}px)`,
                      width: days.length * dayW,
                    }}
                  >
                    {days.map((d, idx) => {
                      const isMon = d.getDay() === 1;
                      const isTodayCol = todayIdx !== null && idx === todayIdx;

                      return (
                        <div
                          key={idx}
                          className="h-9 border-r last:border-r-0 flex items-center justify-center"
                          style={{
                            background: isTodayCol ? IPN_GUINDA_BG : undefined,
                          }}
                          title={fmtDate(d)}
                        >
                          <div
                            className="text-[11px]"
                            style={{
                              color: isTodayCol ? IPN_GUINDA : undefined,
                              fontWeight: isMon || isTodayCol ? 600 : 400,
                            }}
                          >
                            {d.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div style={{ minWidth: leftColsW + days.length * dayW }}>
                {unidades.map((ut, rowIdx) => {
                  const r = getRange(ut);

                  let colStart = 1;
                  let colEnd = 2;
                  let label = "—";

                  if (r) {
                    const sIdx = nearestIndex(r.start);
                    const eIdx = nearestIndex(r.end);

                    const a = Math.min(sIdx, eIdx);
                    const b = Math.max(sIdx, eIdx);

                    colStart = a + 1;
                    colEnd = b + 2; // end exclusivo
                    label = `${fmtDate(r.start)} → ${fmtDate(r.end)}`;
                  }

                  const isAlt = rowIdx % 2 === 1;

                  return (
                    <div key={ut.id} className="flex border-b last:border-b-0">
                      {/* izquierda sticky */}
                      <div
                        className={[
                          "sticky left-0 z-10 border-r px-3 flex items-center",
                          isAlt ? "bg-muted/10" : "bg-background",
                        ].join(" ")}
                        style={{ width: leftColsW, height: rowH }}
                      >
                        <div className="min-w-0 w-full">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {ut.numero}
                            </Badge>
                            <div className="font-medium truncate">
                              {ut.nombre_unidad_tematica || "—"}
                            </div>
                            {typeof ut.porcentaje === "number" ? (
                              <Badge
                                variant="secondary"
                                className="text-[11px] shrink-0"
                              >
                                {ut.porcentaje}%
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground truncate">
                            {label}
                          </div>
                        </div>
                      </div>

                      {/* grid hábil */}
                      <div
                        className="relative"
                        style={{ width: days.length * dayW, height: rowH }}
                      >
                        {/* fondo columnas + sombreado HOY */}
                        <div
                          className="absolute inset-0 grid"
                          style={{
                            gridTemplateColumns: `repeat(${days.length}, ${dayW}px)`,
                          }}
                        >
                          {days.map((_, i) => {
                            const isTodayCol = todayIdx !== null && i === todayIdx;

                            return (
                              <div
                                key={i}
                                className={[
                                  "h-full border-r last:border-r-0",
                                  isAlt ? "bg-muted/5" : "",
                                ].join(" ")}
                                style={{
                                  background: isTodayCol
                                    ? IPN_GUINDA_BG
                                    : undefined,
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* barra */}
                        {r ? (
                          <div
                            className="absolute top-2 bottom-2 grid items-center"
                            style={{ left: 0, right: 0 }}
                          >
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${days.length}, ${dayW}px)`,
                              }}
                            >
                              <div
                                className="h-7 rounded-sm bg-foreground/70 relative"
                                style={{ gridColumn: `${colStart} / ${colEnd}` }}
                                title={`${ut.nombre_unidad_tematica} — ${label}`}
                              >
                                <div className="absolute inset-0 px-2 flex items-center">
                                  <div className="text-[11px] text-background/95 truncate">
                                    Unidad {ut.numero} · Sesiones{" "}
                                    {ut.sesiones_totales ?? "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                            Sin fechas
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 text-xs text-muted-foreground">
                * Se excluyen sábados y domingos.
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
