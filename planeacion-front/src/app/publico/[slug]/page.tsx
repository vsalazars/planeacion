import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import PrintButton from "./PrintButton";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

/** ===== Tipos (según tu JSON) ===== */
type RefItem = {
  id: number;
  tipo: string;
  cita_apa: string;
  unidades_aplica?: any[];
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
  periodo_registro_eval?: any;

  horas?: {
    aula?: number;
    clinica?: number;
    laboratorio?: number;
    otro?: number;
    taller?: number;
  };

  sesiones_por_espacio?: {
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

type SeccionesCompletas = {
  datos?: boolean;
  relaciones?: boolean;
  organizacion?: boolean;
  referencias?: boolean;
  plagio?: boolean;
  [k: string]: any;
};

type PublicPlaneacionDetalle = {
  id: number;
  slug: string;
  status: string;

  // Encabezado
  nombre_planeacion: string;
  profesor: string;

  unidad_aprendizaje?: string;
  unidad_aprendizaje_nombre?: string;

  unidad_academica: string;
  unidad_academica_abreviatura: string;

  updated_at: string;
  created_at?: string;

  // Datos generales
  academia?: string;
  programa_academico?: string;
  plan_estudios_anio?: number;
  semestre_nivel?: string;
  periodo_escolar?: string;
  modalidad?: string;
  grupos?: string;

  // Créditos / horas
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
  sesiones_aula?: number;
  sesiones_laboratorio?: number;
  sesiones_clinica?: number;
  sesiones_otro?: number;

  // Trayectoria
  antecedentes?: string;
  laterales?: string;
  subsecuentes?: string;

  // Ejes
  ejes_perspectiva_genero?: string;
  ejes_internacionalizacion?: string;
  ejes_compromiso_social_sustentabilidad?: string;

  // Organización
  org_proposito?: string;
  org_metodos?: string;
  org_estrategia?: string;

  // Plagio
  plagio_turnitin?: boolean;
  plagio_ithenticate?: boolean;
  plagio_otro?: string;

  // Referencias / secciones
  referencias?: RefItem[];
  secciones_completas?: SeccionesCompletas;

  // Unidades temáticas
  unidades_tematicas?: UnidadTematica[];

  // Otros
  [k: string]: any;
};

async function getBySlug(slug: string): Promise<PublicPlaneacionDetalle | null> {
  const res = await fetch(
    `${API_BASE}/public/planeaciones/slug/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Error ${res.status} al cargar planeación pública. ${txt}`);
  }

  const data = await res.json();
  return data ?? null;
}

/** ===== Helpers UI ===== */
function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

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

function fmtBool(v?: boolean) {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return "—";
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function pickAdditionalFields(item: Record<string, any>, knownKeys: string[]) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    if (!knownKeys.includes(k)) out[k] = v;
  }
  return out;
}

function KeyValueGrid({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">{r.label}</div>
          <div className="mt-1 text-sm font-medium break-words">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function ArrayList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {items.map((x, i) => (
        <li key={`${x}-${i}`}>{x}</li>
      ))}
    </ul>
  );
}

export default async function PublicoDetallePage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getBySlug(params.slug);
  if (!item) notFound();

  const ua = item.unidad_academica_abreviatura || item.unidad_academica;

  const unidadApr = item.unidad_aprendizaje_nombre || item.unidad_aprendizaje || "—";
  const updated = fmtDateTime(item.updated_at);
  const created = fmtDateTime(item.created_at);

  const unidades = Array.isArray(item.unidades_tematicas) ? item.unidades_tematicas : [];
  const unidadesSorted = [...unidades].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

  // Para “Campos adicionales”
  const knownKeys = [
    "id",
    "slug",
    "status",
    "nombre_planeacion",
    "profesor",
    "unidad_aprendizaje",
    "unidad_aprendizaje_nombre",
    "unidad_academica",
    "unidad_academica_abreviatura",
    "updated_at",
    "created_at",
    "academia",
    "antecedentes",
    "area_formacion",
    "creditos_satca",
    "creditos_tepic",
    "docente_id",
    "ejes_compromiso_social_sustentabilidad",
    "ejes_internacionalizacion",
    "ejes_perspectiva_genero",
    "grupos",
    "horas_aula",
    "horas_clinica",
    "horas_laboratorio",
    "horas_otro",
    "horas_practica",
    "horas_teoria",
    "horas_total",
    "laterales",
    "modalidad",
    "org_estrategia",
    "org_metodos",
    "org_proposito",
    "periodo_escolar",
    "plagio_ithenticate",
    "plagio_otro",
    "plagio_turnitin",
    "plan_estudios_anio",
    "programa_academico",
    "referencias",
    "secciones_completas",
    "semestre_nivel",
    "sesiones_aula",
    "sesiones_clinica",
    "sesiones_laboratorio",
    "sesiones_otro",
    "sesiones_por_semestre",
    "subsecuentes",
    "unidad_academica_id",
    "unidades_tematicas",
    "created_at",
    "updated_at",
  ];
  const extra = pickAdditionalFields(item, knownKeys);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 grid place-items-center rounded-md border shrink-0">
              <span aria-hidden>📄</span>
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-semibold">Planeación pública</div>
              <div className="text-xs text-muted-foreground break-all">{item.slug}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {ua}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/publico">Volver</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Encabezado */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                  {item.nombre_planeacion}
                </h1>
                <Badge variant="outline">{safeStr(item.status)}</Badge>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{item.profesor}</span>
                <span className="mx-2">·</span>
                <span>{ua}</span>
              </div>

              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Unidad de aprendizaje: </span>
                <span className="font-medium">{unidadApr}</span>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Creada: {created} · Actualizada: {updated}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:pt-1">
              <PrintButton className="hidden sm:inline-flex" />
              <Badge variant="outline" className="shrink-0">
                id: {item.id}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Datos generales */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Datos generales</h2>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {safeStr(item.area_formacion)}
            </Badge>
          </div>
          <Separator className="my-4" />

          <KeyValueGrid
            rows={[
              { label: "Academia", value: safeStr(item.academia) },
              { label: "Programa académico", value: safeStr(item.programa_academico) },
              { label: "Plan de estudios (año)", value: safeStr(item.plan_estudios_anio) },
              { label: "Semestre/Nivel", value: safeStr(item.semestre_nivel) },
              { label: "Periodo escolar", value: safeStr(item.periodo_escolar) },
              { label: "Modalidad", value: safeStr(item.modalidad) },
              { label: "Grupos", value: safeStr(item.grupos) },
              { label: "Créditos (SATCA)", value: safeStr(item.creditos_satca) },
              { label: "Créditos (TEPIC)", value: safeStr(item.creditos_tepic) },
            ]}
          />
        </Card>

        {/* Carga horaria */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Carga horaria y sesiones</h2>
          <Separator className="my-4" />

          <KeyValueGrid
            rows={[
              { label: "Horas totales", value: safeStr(item.horas_total) },
              { label: "Horas teoría", value: safeStr(item.horas_teoria) },
              { label: "Horas práctica", value: safeStr(item.horas_practica) },
              { label: "Horas aula", value: safeStr(item.horas_aula) },
              { label: "Horas laboratorio", value: safeStr(item.horas_laboratorio) },
              { label: "Horas clínica", value: safeStr(item.horas_clinica) },
              { label: "Horas otro", value: safeStr(item.horas_otro) },
              { label: "Sesiones por semestre", value: safeStr(item.sesiones_por_semestre) },
              { label: "Sesiones aula", value: safeStr(item.sesiones_aula) },
              { label: "Sesiones laboratorio", value: safeStr(item.sesiones_laboratorio) },
              { label: "Sesiones clínica", value: safeStr(item.sesiones_clinica) },
              { label: "Sesiones otro", value: safeStr(item.sesiones_otro) },
            ]}
          />
        </Card>

        {/* Trayectoria */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Trayectoria académica</h2>
          <Separator className="my-4" />

          <div className="grid gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Antecedentes</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(item.antecedentes)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Laterales</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(item.laterales)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Subsecuentes</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(item.subsecuentes)}</div>
            </div>
          </div>
        </Card>

        {/* Ejes */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Ejes transversales</h2>
          <Separator className="my-4" />

          <div className="grid gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Perspectiva de género</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(item.ejes_perspectiva_genero)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Internacionalización</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(item.ejes_internacionalizacion)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Compromiso social y sustentabilidad</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">
                {safeStr(item.ejes_compromiso_social_sustentabilidad)}
              </div>
            </div>
          </div>
        </Card>

        {/* Organización */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Organización didáctica</h2>
          <Separator className="my-4" />

          <KeyValueGrid
            rows={[
              { label: "Propósito", value: <span className="whitespace-pre-wrap">{safeStr(item.org_proposito)}</span> },
              { label: "Métodos", value: <span className="whitespace-pre-wrap">{safeStr(item.org_metodos)}</span> },
              { label: "Estrategia", value: <span className="whitespace-pre-wrap">{safeStr(item.org_estrategia)}</span> },
            ]}
          />
        </Card>

        {/* Plagio */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Plagio</h2>
          <Separator className="my-4" />

          <KeyValueGrid
            rows={[
              { label: "Turnitin", value: fmtBool(item.plagio_turnitin) },
              { label: "iThenticate", value: fmtBool(item.plagio_ithenticate) },
              { label: "Otro", value: <span className="whitespace-pre-wrap">{safeStr(item.plagio_otro)}</span> },
            ]}
          />
        </Card>

        {/* Referencias */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Referencias</h2>
          <Separator className="my-4" />

          {item.referencias?.length ? (
            <div className="space-y-3">
              {item.referencias.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{r.tipo}</Badge>
                    <span className="text-xs text-muted-foreground">id: {r.id}</span>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">{r.cita_apa}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </Card>

        {/* ====================== CRONOGRAMA ====================== */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Cronograma de unidades temáticas</h2>
            <Badge variant="outline">{unidadesSorted.length} unidades</Badge>
          </div>
          <Separator className="my-4" />

          {/* Tabla cronograma */}
          <div className="rounded-md border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 whitespace-nowrap">Unidad</th>
                  <th className="px-3 py-2 whitespace-nowrap">Periodo</th>
                  <th className="px-3 py-2 whitespace-nowrap">Sesiones</th>
                  <th className="px-3 py-2 whitespace-nowrap">Horas</th>
                  <th className="px-3 py-2 whitespace-nowrap">% </th>
                </tr>
              </thead>
              <tbody>
                {unidadesSorted.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                      Sin unidades temáticas.
                    </td>
                  </tr>
                ) : (
                  unidadesSorted.map((u) => {
                    const del = fmtDate(u.periodo_desarrollo?.del ?? undefined);
                    const al = fmtDate(u.periodo_desarrollo?.al ?? undefined);
                    const horas = u.horas || {};
                    const horasTxt = [
                      horas.aula ? `Aula ${horas.aula}` : null,
                      horas.laboratorio ? `Lab ${horas.laboratorio}` : null,
                      horas.clinica ? `Clín ${horas.clinica}` : null,
                      horas.taller ? `Tall ${horas.taller}` : null,
                      horas.otro ? `Otro ${horas.otro}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—";

                    return (
                      <tr key={u.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">
                            {u.numero}. {u.nombre_unidad_tematica}
                          </div>
                          <div className="text-xs text-muted-foreground">id: {u.id}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {del} → {al}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {safeStr(u.sesiones_totales)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{horasTxt}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{safeStr(u.porcentaje)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Timeline cronograma (visual) */}
          {unidadesSorted.length > 0 ? (
            <div className="mt-6">
              <div className="text-sm font-medium mb-3">Timeline</div>
              <div className="space-y-3">
                {unidadesSorted.map((u) => (
                  <div key={`tl-${u.id}`} className="flex gap-3">
                    <div className="pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground/70" />
                    </div>
                    <div className="flex-1 rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Unidad {u.numero}</Badge>
                        <span className="font-medium">{u.nombre_unidad_tematica}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmtDate(u.periodo_desarrollo?.del ?? undefined)} →{" "}
                          {fmtDate(u.periodo_desarrollo?.al ?? undefined)}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">Competencia:</span>{" "}
                        <span className="whitespace-pre-wrap">{safeStr(u.unidad_competencia)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        {/* ====================== DETALLE UNIDADES ====================== */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Detalle de unidades temáticas</h2>
          <Separator className="my-4" />

          {unidadesSorted.length === 0 ? (
            <div className="text-sm text-muted-foreground">—</div>
          ) : (
            <div className="space-y-4">
              {unidadesSorted.map((u) => (
                <div key={`ud-${u.id}`} className="rounded-md border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Unidad {u.numero}</Badge>
                        <div className="text-base font-semibold">{u.nombre_unidad_tematica}</div>
                        <Badge variant="outline">{safeStr(u.porcentaje)}%</Badge>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Periodo:{" "}
                        <span className="text-foreground">
                          {fmtDate(u.periodo_desarrollo?.del ?? undefined)} →{" "}
                          {fmtDate(u.periodo_desarrollo?.al ?? undefined)}
                        </span>{" "}
                        · Sesiones totales:{" "}
                        <span className="text-foreground">{safeStr(u.sesiones_totales)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">id: {u.id}</div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Unidad de competencia</div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(u.unidad_competencia)}</div>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Precisiones</div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{safeStr(u.precisiones)}</div>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Aprendizajes esperados</div>
                      <div className="mt-2">
                        <ArrayList items={u.aprendizajes_esperados} />
                      </div>
                    </div>
                  </div>

                  {/* Bloques/Sesiones */}
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Bloques / sesiones</div>

                    {Array.isArray(u.bloques) && u.bloques.length > 0 ? (
                      <div className="space-y-3">
                        {u.bloques
                          .slice()
                          .sort((a, b) => (a.numero_sesion ?? 0) - (b.numero_sesion ?? 0))
                          .map((b) => (
                            <div key={`b-${b.id}`} className="rounded-md border p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">Sesión {b.numero_sesion}</Badge>
                                <div className="text-sm font-medium">{safeStr(b.temas_subtemas)}</div>
                                <span className="text-xs text-muted-foreground">
                                  Valor: {safeStr(b.valor_porcentual)}%
                                </span>
                              </div>

                              <div className="mt-3 grid sm:grid-cols-3 gap-3">
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Inicio</div>
                                  <div className="mt-1 text-sm whitespace-pre-wrap">
                                    {safeStr(b.actividades?.inicio)}
                                  </div>
                                </div>
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Desarrollo</div>
                                  <div className="mt-1 text-sm whitespace-pre-wrap">
                                    {safeStr(b.actividades?.desarrollo)}
                                  </div>
                                </div>
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Cierre</div>
                                  <div className="mt-1 text-sm whitespace-pre-wrap">
                                    {safeStr(b.actividades?.cierre)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 grid sm:grid-cols-3 gap-3">
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Evidencias</div>
                                  <div className="mt-2">
                                    <ArrayList items={b.evidencias} />
                                  </div>
                                </div>
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Instrumentos</div>
                                  <div className="mt-2">
                                    <ArrayList items={b.instrumentos} />
                                  </div>
                                </div>
                                <div className="rounded-md border p-3">
                                  <div className="text-xs text-muted-foreground">Recursos</div>
                                  <div className="mt-2">
                                    <ArrayList items={b.recursos} />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-muted-foreground">
                                bloque id: {b.id}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Secciones completas */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Estado de secciones</h2>
          <Separator className="my-4" />

          {item.secciones_completas ? (
            <KeyValueGrid
              rows={Object.entries(item.secciones_completas).map(([k, v]) => ({
                label: k,
                value: fmtBool(Boolean(v)),
              }))}
            />
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </Card>

        {/* Campos adicionales (por si el backend agrega más) */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Campos adicionales</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Se muestran automáticamente los campos que no están en las secciones anteriores.
          </div>
          <Separator className="my-4" />

          {Object.keys(extra).length === 0 ? (
            <div className="text-sm text-muted-foreground">—</div>
          ) : (
            <details className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Ver campos adicionales
              </summary>
              <pre className="mt-3 text-xs overflow-auto">
                {JSON.stringify(extra, null, 2)}
              </pre>
            </details>
          )}
        </Card>

        {/* Debug completo opcional */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold">JSON completo (debug)</h2>
          <Separator className="my-4" />
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">Ver JSON completo</summary>
            <pre className="mt-3 text-xs overflow-auto">{JSON.stringify(item, null, 2)}</pre>
          </details>
        </Card>
      </section>
    </main>
  );
}
