"use client";

import { useEffect, useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { PlaneacionType } from "../planeacion/schema";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  unidades?: Array<{ id: number; nombre: string; abreviatura?: string | null }>;
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
};

// convierte a número >= 0 (si viene vacío, lo deja vacío para permitir borrar)
function clampNonNegativeInput(raw: string) {
  if (raw === "") return "";
  const n = Number(raw);
  if (Number.isNaN(n)) return "";
  return String(Math.max(0, n));
}

export default function DatosGenerales({
  unidades,
  loading,
  error,
  readOnly = false,
}: Props) {
  const { register, control, setValue } = useFormContext<PlaneacionType>();

  // ----- Cálculos horas -----
  const horas = useWatch({ control, name: "horas_por_semestre" });

  const totalTipo = useMemo(() => {
    const te = Number(horas?.teoria || 0);
    const pr = Number(horas?.practica || 0);
    return te + pr;
  }, [horas?.teoria, horas?.practica]);

  const totalEspacios = useMemo(() => {
    const a = Number(horas?.aula || 0);
    const l = Number(horas?.laboratorio || 0);
    const c = Number(horas?.clinica || 0);
    const o = Number(horas?.otro || 0);
    return a + l + c + o;
  }, [horas?.aula, horas?.laboratorio, horas?.clinica, horas?.otro]);

  useEffect(() => {
    // actualizar total sin validar
    setValue("horas_por_semestre.total", totalEspacios, {
      shouldValidate: false,
    });
  }, [totalEspacios, setValue]);

  // ----- Cálculos sesiones -----
  const sesAula = useWatch({ control, name: "sesiones_por_semestre_det.aula" });
  const sesLab = useWatch({
    control,
    name: "sesiones_por_semestre_det.laboratorio",
  });
  const sesCli = useWatch({
    control,
    name: "sesiones_por_semestre_det.clinica",
  });
  const sesOtro = useWatch({
    control,
    name: "sesiones_por_semestre_det.otro",
  });

  const totalSesiones = useMemo(() => {
    const a = Number(sesAula || 0);
    const l = Number(sesLab || 0);
    const c = Number(sesCli || 0);
    const o = Number(sesOtro || 0);
    return a + l + c + o;
  }, [sesAula, sesLab, sesCli, sesOtro]);

  useEffect(() => {
    setValue("sesiones_por_semestre", totalSesiones, {
      shouldValidate: false,
    });
  }, [totalSesiones, setValue]);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">
        1. Datos generales y de identificación
      </h2>

      {loading && (
        <p className="text-xs text-muted-foreground">
          Cargando unidades académicas…
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">
          Error al cargar unidades: {error}
        </p>
      )}

      {/* Fila 1 */}
      <div className="grid md:grid-cols-6 gap-4">
        <div>
          <Label>Periodo escolar</Label>
          <Input
            placeholder="24/1"
            {...register("periodo_escolar")}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Año plan estudios</Label>
          <Input
            type="number"
            placeholder="2024"
            min={0}
            {...register("plan_estudios_anio", {
              valueAsNumber: true,
              min: 0,
            })}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Semestre / Nivel</Label>
          <Input
            placeholder="III / 3"
            {...register("semestre_nivel")}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Créditos Tepic</Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            {...register("creditos.tepic", { valueAsNumber: true, min: 0 })}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Créditos SATCA</Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            {...register("creditos.satca", { valueAsNumber: true, min: 0 })}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Grupo(s)</Label>
          <Input
            placeholder="7CM1, 4IV2"
            {...register("grupos")}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Fila 2 */}
      <div className="grid md:grid-cols-5 gap-4">
        <div>
          <Label>Programa académico</Label>
          <Input
            placeholder="Ingeniería Mecatrónica"
            {...register("programa_academico")}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Academia</Label>
          <Input
            placeholder="Nombre de la academia"
            {...register("academia")}
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label>Unidad de aprendizaje</Label>
          <Input
            placeholder="Nombre de la unidad"
            {...register("unidad_aprendizaje_nombre")}
            readOnly={readOnly}
          />
        </div>

        <div>
          <Label>Área de formación</Label>
          <Controller
            name="area_formacion"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Institucional",
                    "Científica básica",
                    "Profesional",
                    "Terminal",
                  ].map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label>Modalidad</Label>
          <Controller
            name="modalidad"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {["Escolarizada", "No escolarizada", "Mixta"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Fila 3: sesiones por semestre */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>No. de sesiones por semestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-5 gap-2">
              {(["aula", "laboratorio", "clinica", "otro"] as const).map((k) => {
                const reg = register(`sesiones_por_semestre_det.${k}`, {
                  valueAsNumber: true,
                  min: 0,
                });

                return (
                  <div key={k}>
                    <p className="text-xs capitalize mb-1">{k}</p>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      {...reg}
                      onChange={(e) => {
                        // Sanitiza negativos (y paste de valores raros)
                        if (readOnly) return;
                        e.target.value = clampNonNegativeInput(e.target.value);
                        reg.onChange(e);
                      }}
                      readOnly={readOnly}
                    />
                  </div>
                );
              })}

              <div>
                <p className="text-xs mb-1">Total</p>
                <Input type="number" value={Math.max(0, totalSesiones)} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 4: horas */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Card 2: Horas por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Horas por semestre (tipo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-2">
              {(["teoria", "practica"] as const).map((k) => {
                const reg = register(`horas_por_semestre.${k}`, {
                  valueAsNumber: true,
                  min: 0,
                });

                return (
                  <div key={k}>
                    <p className="text-xs capitalize mb-1">{k}</p>
                    <Input
                      type="number"
                      step="0.5"
                      min={0}
                      inputMode="decimal"
                      {...reg}
                      onChange={(e) => {
                        if (readOnly) return;
                        e.target.value = clampNonNegativeInput(e.target.value);
                        reg.onChange(e);
                      }}
                      readOnly={readOnly}
                    />
                  </div>
                );
              })}

              <div>
                <p className="text-xs mb-1">Total</p>
                <Input type="number" value={Math.max(0, totalTipo)} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Horas por espacio */}
        <Card>
          <CardHeader>
            <CardTitle>Horas por semestre (espacio)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-5 gap-2">
              {(
                ["aula", "laboratorio", "clinica", "otro"] as const
              ).map((k) => {
                const reg = register(`horas_por_semestre.${k}`, {
                  valueAsNumber: true,
                  min: 0,
                });

                return (
                  <div key={k}>
                    <p className="text-xs capitalize mb-1">{k}</p>
                    <Input
                      type="number"
                      step="0.5"
                      min={0}
                      inputMode="decimal"
                      {...reg}
                      onChange={(e) => {
                        if (readOnly) return;
                        e.target.value = clampNonNegativeInput(e.target.value);
                        reg.onChange(e);
                      }}
                      readOnly={readOnly}
                    />
                  </div>
                );
              })}

              <div>
                <p className="text-xs mb-1">Total</p>
                <Input
                  type="number"
                  value={Math.max(0, totalEspacios)}
                  readOnly
                />
              </div>
            </div>

            {totalTipo !== totalEspacios &&
              (totalTipo !== 0 || totalEspacios !== 0) && (
                <p className="text-xs text-amber-600 mt-2">
                  Aviso: el total por <b>tipo</b> ({totalTipo}) no coincide con
                  el total por <b>espacio</b> ({totalEspacios}).
                </p>
              )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
