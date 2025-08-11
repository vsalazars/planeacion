"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = { index: number; onRemove?: () => void };

// Helper seguro para leer errores anidados
const getErrMsg = (obj: any, path: string[]): string | undefined => {
  try {
    return path.reduce((acc, k) => (acc ? (acc as any)[k] : undefined), obj)?.message as
      | string
      | undefined;
  } catch {
    return undefined;
  }
};

// ---------- Item de bloque (sesión) ----------
function BloqueItem({
  path,
  idx,
  restante,
  onRemove,
  renumerarDespues,
}: {
  path: string;
  idx: number;
  restante: number;
  onRemove: () => void;
  renumerarDespues: () => void;
}) {
  const { register, setValue } = useFormContext<PlaneacionType>();

  // Guarda el número de sesión consecutivo
  useEffect(() => {
    setValue(`${path}.numero_sesion` as const, idx + 1, { shouldValidate: false, shouldDirty: true });
  }, [idx, path, setValue]);

  return (
    <div className="border rounded-xl p-3 space-y-3">
      <div className="grid sm:grid-cols-3 gap-2 items-start">
        <div className="flex flex-col">
          <Label>No. de sesión</Label>
          <Input
            type="number"
            value={idx + 1}
            readOnly
            tabIndex={-1}
            className="bg-muted"
          />
          <input
            type="hidden"
            {...register(`${path}.numero_sesion` as const, { valueAsNumber: true })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Temas y subtemas</Label>
          <Textarea
            rows={2}
            placeholder="Tema — Subtema…"
            {...register(`${path}.temas_subtemas` as const)}
          />
        </div>
      </div>
      
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <Label>Inicio</Label>
          <Textarea rows={3} {...register(`${path}.actividades.inicio` as const)} />
        </div>
        <div>
          <Label>Desarrollo</Label>
          <Textarea rows={3} {...register(`${path}.actividades.desarrollo` as const)} />
        </div>
        <div>
          <Label>Cierre</Label>
          <Textarea rows={3} {...register(`${path}.actividades.cierre` as const)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <Label>Recursos didácticos</Label>
          <Textarea
            rows={2}
            placeholder="Libro X; Video Y; Software Z"
            {...register(`${path}.recursos` as const, {
              setValueAs: (v: string) => {
                if (typeof v !== "string") return v;
                const t = v.trim();
                return t ? t.split(";").map((s) => s.trim()).filter(Boolean) : [];
              },
            })}
          />
        </div>
        <div>
          <Label>Evidencias de aprendizaje</Label>
          <Textarea
            rows={2}
            placeholder="Reporte; Exposición"
            {...register(`${path}.evidencias` as const, {
              setValueAs: (v: string) => {
                if (typeof v !== "string") return v;
                const t = v.trim();
                return t ? t.split(";").map((s) => s.trim()).filter(Boolean) : [];
              },
            })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <Label>Instrumentos de evaluación</Label>
          <Textarea
            rows={2}
            placeholder="Rúbrica; Lista de cotejo"
            {...register(`${path}.instrumentos` as const, {
              setValueAs: (v: string) => {
                if (typeof v !== "string") return v;
                const t = v.trim();
                return t ? t.split(";").map((s) => s.trim()).filter(Boolean) : [];
              },
            })}
          />
        </div>
        <div>
          <Label>Porcentaje Valor (%) {restante === 0 ? "(sin restante)" : `(restante: ${restante}%)`}</Label>
          <Input
            type="number"
            min={0}
            step="1"
            {...register(`${path}.valor_porcentual` as const, { valueAsNumber: true })}
            onBlur={(e) => {
              const v = Math.max(0, Math.min(100, Number(e.currentTarget.value || 0)));
              setValue(`${path}.valor_porcentual` as const, v, { shouldValidate: true });
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline">Eliminar sesión</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar sesión {idx + 1}</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará la sesión y se renumerarán las restantes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onRemove();
                  setTimeout(renumerarDespues, 0);
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ---------- Componente principal (Unidad Temática) ----------
export default function UnidadTematica({ index, onRemove }: Props) {
  const name = `unidades_tematicas.${index}` as const;

  const {
    register,
    control,
    setValue,
    setError,
    clearErrors,
    formState,
    trigger,
    getValues,
  } = useFormContext<PlaneacionType>();

  // Arrays dinámicos
  const aprendizajes = useFieldArray({ control, name: `${name}.aprendizajes_esperados` as any });
  const bloques = useFieldArray({ control, name: `${name}.bloques` as any });

  // Observa bloques
  const watchedBloques = (useWatch({ control, name: `${name}.bloques` as any }) as any[]) || [];

  // Setea número de UT al montar / cambiar índice
  useEffect(() => {
    setValue(`${name}.numero` as any, index + 1, { shouldDirty: false, shouldValidate: false });
  }, [index, name, setValue]);

  // Watches útiles
  const nombreUT = useWatch({ control, name: `${name}.nombre_unidad_tematica` as any }) as string | undefined;
  const horas = useWatch({ control, name: `${name}.horas` as any }) as any;

  // Sesiones por espacio (metadata UI para calcular total)
  const sAula = useWatch({ control, name: `${name}.sesiones_por_espacio.aula` as any }) as number | undefined;
  const sLab  = useWatch({ control, name: `${name}.sesiones_por_espacio.laboratorio` as any }) as number | undefined;
  const sTal  = useWatch({ control, name: `${name}.sesiones_por_espacio.taller` as any }) as number | undefined;
  const sCli  = useWatch({ control, name: `${name}.sesiones_por_espacio.clinica` as any }) as number | undefined;
  const sOtr  = useWatch({ control, name: `${name}.sesiones_por_espacio.otro` as any }) as number | undefined;

  // Totales
  const totalHoras = useMemo(() => {
    const h = horas || {};
    return Number(h.aula || 0) + Number(h.laboratorio || 0) + Number(h.taller || 0) + Number(h.clinica || 0) + Number(h.otro || 0);
  }, [horas?.aula, horas?.laboratorio, horas?.taller, horas?.clinica, horas?.otro]);

  const totalValor = useMemo(
    () => (watchedBloques || []).reduce((acc, b) => acc + Number(b?.valor_porcentual || 0), 0),
    [watchedBloques]
  );
  const restante = Math.max(0, 100 - (Number.isFinite(totalValor) ? totalValor : 0));

  const totalSesiones = useMemo(() => {
    return Number(sAula || 0) + Number(sLab || 0) + Number(sTal || 0) + Number(sCli || 0) + Number(sOtr || 0);
  }, [sAula, sLab, sTal, sCli, sOtr]);

  // Sincroniza sesiones_totales (requerido por schema)
  useEffect(() => {
    setValue(`${name}.sesiones_totales` as any, totalSesiones, { shouldValidate: true, shouldDirty: true });
  }, [totalSesiones, name, setValue]);

  // Validaciones de unidad
  const devDel = useWatch({ control, name: `${name}.periodo_desarrollo.del` as any }) as string | undefined;
  const devAl  = useWatch({ control, name: `${name}.periodo_desarrollo.al` as any }) as string | undefined;

  useEffect(() => {
    const a = devDel ? new Date(devDel) : null;
    const b = devAl ? new Date(devAl) : null;
    if (a && b && a > b) {
      setError(`${name}.periodo_desarrollo.del` as any, { type: "manual", message: "La fecha inicial no puede ser posterior a la final." });
    } else {
      clearErrors(`${name}.periodo_desarrollo.del` as any);
    }
  }, [devDel, devAl, name, setError, clearErrors]);

  useEffect(() => {
    if (totalValor > 100) {
      setError(`${name}.bloques` as any, {
        type: "manual",
        message: `La suma de “Valor (%)” en las sesiones no debe exceder 100 (actual: ${totalValor}).`,
      });
    } else {
      clearErrors(`${name}.bloques` as any);
    }
  }, [totalValor, name, setError, clearErrors]);

  // Errores
  const errPeriodoDev = getErrMsg(formState.errors, ["unidades_tematicas", String(index), "periodo_desarrollo", "del"]);
  const errPct = getErrMsg(formState.errors, ["unidades_tematicas", String(index), "bloques"]);

  // ---- Utils: validar mínimos de bloque actual/último ----
  const minBlockPaths = (i: number) => ([
    `${name}.bloques.${i}.temas_subtemas`,
    `${name}.bloques.${i}.actividades.inicio`,
    `${name}.bloques.${i}.actividades.desarrollo`,
    `${name}.bloques.${i}.actividades.cierre`,
    `${name}.bloques.${i}.valor_porcentual`,
    `${name}.bloques.${i}.recursos`,
    `${name}.bloques.${i}.evidencias`,
    `${name}.bloques.${i}.instrumentos`,
  ]);

  // ---- Renumerar tras eliminar (1..n) ----
  const renumerar = () => {
    const values = getValues(`${name}.bloques` as any) as any[] || [];
    values.forEach((_, i) => {
      setValue(`${name}.bloques.${i}.numero_sesion` as const, i + 1, { shouldDirty: true });
    });
  };

  return (
    <div className="rounded-2xl border p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col">
          <h3 className="font-semibold">
            Unidad temática {index + 1}
            {nombreUT ? <span className="font-normal text-muted-foreground"> — {nombreUT}</span> : null}
          </h3>
          <p className="text-xs text-muted-foreground">
            ({totalSesiones} {totalSesiones === 1 ? "sesión" : "sesiones"}, {totalHoras} h)
          </p>
        </div>

        {onRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">Eliminar unidad</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar unidad temática {index + 1}</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la unidad y todas sus sesiones. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove?.()}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Nombre, objetivo y periodo */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Nombre de la unidad temática</Label>
          <Input
            placeholder="Ej. Fundamentos de programación"
            {...register(`${name}.nombre_unidad_tematica` as const)}
          />
        </div>

        <div>
          <Label>Unidad de competencia u objetivo</Label>
          <Textarea
            rows={2}
            placeholder="Redacción clara (verbo–objeto–condición de calidad)…"
            {...register(`${name}.unidad_competencia`)}
          />
        </div>

        <div>
          <Label>Periodo de desarrollo</Label>
          <div className="flex gap-2">
            <Input type="date" {...register(`${name}.periodo_desarrollo.del`)} />
            <Input type="date" {...register(`${name}.periodo_desarrollo.al`)} />
          </div>
          {errPeriodoDev && <p className="text-xs text-destructive mt-1">{errPeriodoDev}</p>}
        </div>
      </div>

      {/* Horas */}
      <div>
        <Label>No. de horas totales de la unidad temática por espacio de mediación docente</Label>
        <div className="mt-2 overflow-x-auto">
          <div className="min-w-[880px] grid grid-cols-7 gap-2 items-end">
            <div />
            <div className="text-xs text-muted-foreground">Aula</div>
            <div className="text-xs text-muted-foreground">Laboratorio</div>
            <div className="text-xs text-muted-foreground">Taller</div>
            <div className="text-xs text-muted-foreground">Clínica</div>
            <div className="text-xs text-muted-foreground">Otro</div>
            <div className="text-xs text-muted-foreground">Total (auto)</div>

            <div className="font-medium text-sm">Horas</div>
            <Input type="number" min={0} step="0.1" {...register(`${name}.horas.aula`, { valueAsNumber: true })} />
            <Input type="number" min={0} step="0.1" {...register(`${name}.horas.laboratorio`, { valueAsNumber: true })} />
            <Input type="number" min={0} step="0.1" {...register(`${name}.horas.taller`, { valueAsNumber: true })} />
            <Input type="number" min={0} step="0.1" {...register(`${name}.horas.clinica`, { valueAsNumber: true })} />
            <Input type="number" min={0} step="0.1" {...register(`${name}.horas.otro`, { valueAsNumber: true })} />
            <Input type="number" value={totalHoras} readOnly tabIndex={-1} />
          </div>
        </div>
      </div>

      {/* Sesiones por espacio */}
      <div>
        <Label>No. de sesiones totales de la unidad temática por espacio de mediación docente</Label>
        <div className="mt-2 overflow-x-auto">
          <div className="min-w-[880px] grid grid-cols-7 gap-2 items-end">
            <div />
            <div className="text-xs text-muted-foreground">Aula</div>
            <div className="text-xs text-muted-foreground">Laboratorio</div>
            <div className="text-xs text-muted-foreground">Taller</div>
            <div className="text-xs text-muted-foreground">Clínica</div>
            <div className="text-xs text-muted-foreground">Otro</div>
            <div className="text-xs text-muted-foreground">Total (auto)</div>

            <div className="font-medium text-sm">Sesiones</div>
            <Input type="number" min={0} {...register(`${name}.sesiones_por_espacio.aula` as any, { valueAsNumber: true })} />
            <Input type="number" min={0} {...register(`${name}.sesiones_por_espacio.laboratorio` as any, { valueAsNumber: true })} />
            <Input type="number" min={0} {...register(`${name}.sesiones_por_espacio.taller` as any, { valueAsNumber: true })} />
            <Input type="number" min={0} {...register(`${name}.sesiones_por_espacio.clinica` as any, { valueAsNumber: true })} />
            <Input type="number" min={0} {...register(`${name}.sesiones_por_espacio.otro` as any, { valueAsNumber: true })} />
            <Input type="number" value={totalSesiones} readOnly tabIndex={-1} />
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Total horas:</span>
              <strong>{totalHoras}</strong>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sesiones totales:</span>
              <strong>{totalSesiones}</strong>
            </div>
          </div>
          <input type="hidden" {...register(`${name}.sesiones_totales`, { valueAsNumber: true })} />
        </div>
      </div>

      {/* Aprendizajes esperados */}
      <div>
        <Label>Aprendizajes esperados</Label>
        <div className="space-y-2 mt-2">
          {aprendizajes.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2">
              <Input
                className="flex-1"
                placeholder={`Aprendizaje ${i + 1}`}
                {...register(`${name}.aprendizajes_esperados.${i}` as const)}
              />
              <Button type="button" variant="outline" onClick={() => aprendizajes.remove(i)}>
                Quitar
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => aprendizajes.append("")}>
            Agregar aprendizaje
          </Button>
        </div>
      </div>

      {/* Sesiones (bloques) */}
      <div>
        <div className="flex items-end justify-between">
          <Label>Sesiones (bloques)</Label>
          {errPct && <p className="text-xs text-destructive">{errPct}</p>}
        </div>

        <div className="space-y-4 mt-2">
          {bloques.fields.map((f, i) => (
            <BloqueItem
              key={f.id}
              path={`${name}.bloques.${i}`}
              idx={i}
              restante={restante}
              onRemove={() => {
                bloques.remove(i);
              }}
              renumerarDespues={() => {
                const values = getValues(`${name}.bloques` as any) as any[] || [];
                values.forEach((_, k) => {
                  setValue(`${name}.bloques.${k}.numero_sesion` as const, k + 1, { shouldDirty: true });
                });
              }}
            />
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                // Valida mínimos de la UT + cada bloque existente
                const baseFields = [
                  `${name}.numero`,
                  `${name}.nombre_unidad_tematica`,
                  `${name}.unidad_competencia`,
                  `${name}.periodo_desarrollo.del`,
                  `${name}.periodo_desarrollo.al`,
                  `${name}.horas.aula`,
                  `${name}.horas.laboratorio`,
                  `${name}.horas.taller`,
                  `${name}.horas.clinica`,
                  `${name}.horas.otro`,
                  `${name}.sesiones_totales`,
                  `${name}.aprendizajes_esperados`,
                ] as const;

                const currentValues = getValues();
                const count = (currentValues?.unidades_tematicas?.[index]?.bloques || []).length as number;
                const allPaths = [...baseFields];
                for (let j = 0; j < count; j++) {
                  allPaths.push(
                    `${name}.bloques.${j}.temas_subtemas`,
                    `${name}.bloques.${j}.actividades.inicio`,
                    `${name}.bloques.${j}.actividades.desarrollo`,
                    `${name}.bloques.${j}.actividades.cierre`,
                    `${name}.bloques.${j}.valor_porcentual`,
                    `${name}.bloques.${j}.recursos`,
                    `${name}.bloques.${j}.evidencias`,
                    `${name}.bloques.${j}.instrumentos`,
                  );
                }

                const ok = await trigger(allPaths as any, { shouldFocus: true });
                if (!ok) {
                  toast.error("Completa la unidad temática antes de agregar otra sesión.");
                  return;
                }
                if (restante <= 0) {
                  toast.error("Ya no hay porcentaje restante. Ajusta 'Valor (%)' antes de agregar otra sesión.");
                  return;
                }

                const nextIndex = bloques.fields.length;
                bloques.append(
                  {
                    numero_sesion: nextIndex + 1,
                    temas_subtemas: "",
                    actividades: { inicio: "", desarrollo: "", cierre: "" },
                    recursos: [],
                    evidencias: [],
                    instrumentos: [],
                    valor_porcentual: Math.min(100, restante),
                  } as any,
                  { shouldFocus: true }
                );
              }}
            >
              Agregar sesión en blanco
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const values = getValues();
                const list = (values?.unidades_tematicas?.[index]?.bloques || []) as any[];
                const lastIdx = list.length - 1;

                if (lastIdx < 0) {
                  toast.info("No hay sesión anterior para duplicar. Se creará una en blanco.");
                  const nextIndex = bloques.fields.length;
                  bloques.append(
                    {
                      numero_sesion: nextIndex + 1,
                      temas_subtemas: "",
                      actividades: { inicio: "", desarrollo: "", cierre: "" },
                      recursos: [],
                      evidencias: [],
                      instrumentos: [],
                      valor_porcentual: Math.min(100, restante),
                    } as any,
                    { shouldFocus: true }
                  );
                  return;
                }

                // Valida mínimos de la última sesión antes de duplicar
                const ok = await trigger([
                  `${name}.bloques.${lastIdx}.temas_subtemas`,
                  `${name}.bloques.${lastIdx}.actividades.inicio`,
                  `${name}.bloques.${lastIdx}.actividades.desarrollo`,
                  `${name}.bloques.${lastIdx}.actividades.cierre`,
                  `${name}.bloques.${lastIdx}.valor_porcentual`,
                  `${name}.bloques.${lastIdx}.recursos`,
                  `${name}.bloques.${lastIdx}.evidencias`,
                  `${name}.bloques.${lastIdx}.instrumentos`,
                ] as any, { shouldFocus: true });

                if (!ok) {
                  toast.error("Completa la sesión anterior antes de duplicarla.");
                  return;
                }

                if (restante <= 0) {
                  toast.error("Ya no hay porcentaje restante para duplicar.");
                  return;
                }

                const last = list[lastIdx];
                const nextIndex = bloques.fields.length;

                bloques.append(
                  {
                    numero_sesion: nextIndex + 1,
                    temas_subtemas: last?.temas_subtemas ?? "",
                    actividades: {
                      inicio: last?.actividades?.inicio ?? "",
                      desarrollo: last?.actividades?.desarrollo ?? "",
                      cierre: last?.actividades?.cierre ?? "",
                    },
                    recursos: Array.isArray(last?.recursos) ? [...last.recursos] : [],
                    evidencias: Array.isArray(last?.evidencias) ? [...last.evidencias] : [],
                    instrumentos: Array.isArray(last?.instrumentos) ? [...last.instrumentos] : [],
                    valor_porcentual: Math.min(Number(last?.valor_porcentual || 0), Math.max(0, restante)),
                  } as any,
                  { shouldFocus: true }
                );
              }}
            >
              Duplicar sesión anterior
            </Button>
          </div>
        </div>
      </div>

      {/* Precisiones */}
      <div>
        <Label>Precisiones de la unidad temática</Label>
        <Textarea
          rows={3}
          placeholder="Adecuaciones avaladas por academia, justificación, etc."
          {...register(`${name}.precisiones`)}
        />
      </div>
    </div>
  );
}
