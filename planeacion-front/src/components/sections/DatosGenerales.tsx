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
};

const FieldError = ({ path }: { path: any }) =>
  path ? (
    <p className="text-xs text-destructive mt-1">{String(path.message)}</p>
  ) : null;

export default function DatosGenerales({}: Props) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<PlaneacionType>();

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
    setValue("horas_por_semestre.total", totalEspacios, { shouldValidate: true });
  }, [totalEspacios, setValue]);

  // ----- Cálculos sesiones -----
  const sesAula = useWatch({ control, name: "sesiones_por_semestre_det.aula" });
  const sesLab = useWatch({ control, name: "sesiones_por_semestre_det.laboratorio" });
  const sesCli = useWatch({ control, name: "sesiones_por_semestre_det.clinica" });
  const sesOtro = useWatch({ control, name: "sesiones_por_semestre_det.otro" });
  const totalSesiones = useMemo(() => {
    const a = Number(sesAula || 0);
    const l = Number(sesLab || 0);
    const c = Number(sesCli || 0);
    const o = Number(sesOtro || 0);
    return a + l + c + o;
  }, [sesAula, sesLab, sesCli, sesOtro]);
  useEffect(() => {
    setValue("sesiones_por_semestre", totalSesiones, { shouldValidate: true });
  }, [totalSesiones, setValue]);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">1. Datos generales y de identificación</h2>

      {/* Fila 1 */}
      <div className="grid md:grid-cols-6 gap-4">
        <div>
          <Label>Periodo escolar</Label>
          <Input placeholder="24/1" {...register("periodo_escolar")} />
          <FieldError path={errors.periodo_escolar} />
        </div>
        <div>
          <Label>Año del plan de estudios</Label>
          <Input type="number" placeholder="2024" {...register("plan_estudios_anio", { valueAsNumber: true })} />
          <FieldError path={errors.plan_estudios_anio} />
        </div>
        <div>
          <Label>Semestre / Nivel</Label>
          <Input placeholder="III / 3" {...register("semestre_nivel")} />
          <FieldError path={errors.semestre_nivel} />
        </div>
        <div>
          <Label>Créditos Tepic</Label>
          <Input type="number" step="0.1" {...register("creditos.tepic", { valueAsNumber: true })} />
          <FieldError path={errors.creditos?.tepic} />
        </div>
        <div>
          <Label>Créditos SATCA</Label>
          <Input type="number" step="0.1" {...register("creditos.satca", { valueAsNumber: true })} />
          <FieldError path={errors.creditos?.satca} />
        </div>
        <div>
          <Label>Grupo(s)</Label>
          <Input placeholder="7CM1, 4IV2" {...register("grupos")} />
          <FieldError path={errors.grupos} />
        </div>
      </div>

      {/* Fila 2 */}
      <div className="grid md:grid-cols-5 gap-4">
        <div>
          <Label>Programa académico</Label>
          <Input placeholder="Ingeniería X" {...register("programa_academico")} />
          <FieldError path={errors.programa_academico} />
        </div>
        <div>
          <Label>Academia</Label>
          <Input placeholder="Nombre de la academia" {...register("academia")} />
          <FieldError path={errors.academia} />
        </div>
        <div>
          <Label>Unidad de aprendizaje</Label>
          <Input placeholder="Nombre de la unidad" {...register("unidad_aprendizaje_nombre")} />
          <FieldError path={errors.unidad_aprendizaje_nombre} />
        </div>
        <div>
          <Label>Área de formación</Label>
          <Controller
            name="area_formacion"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {["Institucional", "Científica básica", "Profesional", "Terminal y de integración"].map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError path={errors.area_formacion} />
        </div>
        <div>
          <Label>Modalidad</Label>
          <Controller
            name="modalidad"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {["Escolarizada", "No escolarizada", "Mixta"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError path={errors.modalidad} />
        </div>
        
      </div>

      {/* Fila 3 con Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Card 1: Sesiones */}
        <Card>
          <CardHeader><CardTitle>No. de sesiones por semestre</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-5 gap-2">
              {["aula", "laboratorio", "clinica", "otro"].map((k) => (
                <div key={k}>
                  <p className="text-xs capitalize mb-1">{k}</p>
                  <Input type="number" {...register(`sesiones_por_semestre_det.${k}`, { valueAsNumber: true })} />
                </div>
              ))}
              <div>
                <p className="text-xs mb-1">Total</p>
                <Input type="number" value={totalSesiones} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Horas por tipo */}
        <Card>
          <CardHeader><CardTitle>Horas por semestre — por tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-2">
              {["teoria", "practica"].map((k) => (
                <div key={k}>
                  <p className="text-xs capitalize mb-1">{k}</p>
                  <Input type="number" step="0.1" {...register(`horas_por_semestre.${k}`, { valueAsNumber: true })} />
                </div>
              ))}
              <div>
                <p className="text-xs mb-1">Total</p>
                <Input type="number" value={totalTipo} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Horas por espacio */}
        <Card>
          <CardHeader><CardTitle>Horas por semestre — por espacio</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-5 gap-2">
              {["aula", "laboratorio", "clinica", "otro"].map((k) => (
                <div key={k}>
                  <p className="text-xs capitalize mb-1">{k}</p>
                  <Input type="number" step="0.1" {...register(`horas_por_semestre.${k}`, { valueAsNumber: true })} />
                </div>
              ))}
              <div>
                <p className="text-xs mb-1">Total</p>
                <Input type="number" value={totalEspacios} readOnly />
              </div>
            </div>
            {totalTipo !== totalEspacios && (
              <p className="text-xs text-amber-600 mt-2">
                Aviso: el total por <b>tipo</b> ({totalTipo}) no coincide con el total por <b>espacio</b> ({totalEspacios}).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
