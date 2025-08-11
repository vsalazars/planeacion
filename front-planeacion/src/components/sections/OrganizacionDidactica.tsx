"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlaneacionType } from "../schema";
import UnidadTematica from "./UnidadTematica";
import { toast } from "sonner";

const buildMinimalPathsForUnit = (idx: number) => {
  const base = `unidades_tematicas.${idx}`;
  const paths: string[] = [
    `${base}.numero`,
    `${base}.nombre_unidad_tematica`,
    `${base}.unidad_competencia`,
    `${base}.periodo_desarrollo.del`,
    `${base}.periodo_desarrollo.al`,
    `${base}.horas.aula`,
    `${base}.horas.laboratorio`,
    `${base}.horas.taller`,
    `${base}.horas.clinica`,
    `${base}.horas.otro`,
    `${base}.sesiones_totales`,
    `${base}.aprendizajes_esperados`,
  ];
  const bloqueKeys = [
    "numero_sesion",
    "temas_subtemas",
    "actividades.inicio",
    "actividades.desarrollo",
    "actividades.cierre",
    "valor_porcentual",
    "recursos",
    "evidencias",
    "instrumentos",
  ];
  return { base, paths, bloqueKeys };
};

export default function OrganizacionDidactica() {
  const { control, register, trigger, getValues } = useFormContext<PlaneacionType>();

  const unidadesFA = useFieldArray({ control, name: "unidades_tematicas" as const });
  const unidades = useWatch({ control, name: "unidades_tematicas" as const }) as any[] | undefined;

  const { totalHorasGlobal, totalSesionesGlobal } = useMemo(() => {
    let horas = 0;
    let sesiones = 0;
    for (const ut of unidades || []) {
      const h = ut?.horas || {};
      horas += Number(h.aula || 0) + Number(h.laboratorio || 0) + Number(h.taller || 0) + Number(h.clinica || 0) + Number(h.otro || 0);
      sesiones += Number(ut?.sesiones_totales || 0);
    }
    return { totalHorasGlobal: horas, totalSesionesGlobal: sesiones };
  }, [unidades]);

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">3. Organización didáctica</h2>
          <p className="text-sm text-muted-foreground">
            Total sesiones: {totalSesionesGlobal} | Total horas: {totalHorasGlobal}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Sesiones por semestre:</Label>
          <input
            className="border rounded-md px-2 py-1 text-sm"
            type="number"
            min={0}
            {...register("sesiones_por_semestre" as any, { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Lista de UT */}
      <div className="space-y-6">
        {unidadesFA.fields.map((f, i) => (
          <UnidadTematica
            key={f.id}
            index={i}
            onRemove={() => {
              unidadesFA.remove(i);
            }}
          />
        ))}
      </div>

      {/* Botón agregar UT */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            if (unidadesFA.fields.length > 0) {
              const values = getValues();
              let paths: string[] = [];
              unidadesFA.fields.forEach((_, idx) => {
                const { base, paths: basePaths, bloqueKeys } = buildMinimalPathsForUnit(idx);
                paths = paths.concat(basePaths);
                const bloques = (values?.unidades_tematicas?.[idx]?.bloques || []) as any[];
                bloques.forEach((_, j) => {
                  bloqueKeys.forEach((k) => paths.push(`${base}.bloques.${j}.${k}`));
                });
              });

              const ok = await trigger(paths as any, { shouldFocus: true });
              if (!ok) {
                toast.error("Completa las unidades temáticas actuales antes de agregar otra.");
                return;
              }

              const excede = (values?.unidades_tematicas || []).some((ut: any) => {
                const suma = (ut?.bloques || []).reduce((acc: number, b: any) => acc + Number(b?.valor_porcentual || 0), 0);
                return suma > 100;
              });
              if (excede) {
                toast.error("Alguna unidad supera el 100% en Valor (%).");
                return;
              }
            }

            unidadesFA.append({
              numero: unidadesFA.fields.length + 1,
              nombre_unidad_tematica: "",
              unidad_competencia: "",
              periodo_desarrollo: { del: "", al: "" },
              horas: { aula: 0, laboratorio: 0, taller: 0, clinica: 0, otro: 0 },
              sesiones_totales: 0,
              aprendizajes_esperados: [],
              bloques: [],
              precisiones: "",
            });
          }}
        >
          Agregar Unidad Temática
        </Button>
      </div>
    </div>
  );
}
