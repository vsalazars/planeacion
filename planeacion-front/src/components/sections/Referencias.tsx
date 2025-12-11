"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  unidadesCount: number;
  readOnly?: boolean; // 👈 NUEVO
};

export default function Referencias({ unidadesCount, readOnly = false }: Props) {
  const { control, register, setValue, watch } =
    useFormContext<PlaneacionType>();

  const refs = useFieldArray({
    control,
    name: "referencias",
  });

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">4. Referencias</h2>

      <div className="space-y-3">
        {refs.fields.map((f, i) => {
          const selectedRaw =
            (watch(
              `referencias.${i}.unidades_aplica`
            ) as Array<number | string> | undefined) || [];
          const selected = selectedRaw
            .map((v) => Number(v))
            .filter((v) => !Number.isNaN(v));

          const tipoActual = (watch(
            `referencias.${i}.tipo`
          ) as string | undefined) || "";

          return (
            <div key={f.id} className="border rounded-xl p-3 space-y-2">
              <div>
                <Label>Cita APA</Label>
                <Input
                  {...register(`referencias.${i}.cita_apa` as const)}
                  placeholder="Apellido, A. (Año). Título..."
                  readOnly={readOnly} // 👈 solo lectura
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {/* Unidades a las que aplica */}
                <div>
                  <Label>Unidades temáticas a las que aplica</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.from({ length: unidadesCount }).map((_, n) => {
                      const val = n + 1;
                      const isSel = selected.includes(val);
                      return (
                        <button
                          type="button"
                          key={val}
                          className={`px-2 py-1 rounded border text-sm transition ${
                            isSel
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          disabled={readOnly} // 👈 no permite cambiar selección
                          onClick={() => {
                            if (readOnly) return;
                            const curr = new Set(selected);
                            if (curr.has(val)) curr.delete(val);
                            else curr.add(val);
                            const arr = Array.from(curr).sort(
                              (a, b) => a - b
                            );
                            setValue(
                              `referencias.${i}.unidades_aplica`,
                              arr,
                              { shouldValidate: true }
                            );
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={tipoActual}
                    onValueChange={(v) =>
                      setValue(`referencias.${i}.tipo`, v as any, {
                        shouldValidate: true,
                      })
                    }
                    disabled={readOnly} // 👈 bloquea cambios
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Básica">Básica</SelectItem>
                      <SelectItem value="Complementaria">
                        Complementaria
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refs.remove(i)}
                  disabled={readOnly} // 👈 no permite quitar en solo lectura
                >
                  Quitar referencia
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          refs.append({
            cita_apa: "",
            unidades_aplica: [],
            tipo: "Básica",
          } as any)
        }
        disabled={readOnly} // 👈 no agrega si está finalizada
      >
        Agregar referencia
      </Button>
    </section>
  );
}
