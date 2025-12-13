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
  readOnly?: boolean;
};

export default function Referencias({ unidadesCount, readOnly = false }: Props) {
  const { control, register, setValue, watch } = useFormContext<PlaneacionType>();

  const refs = useFieldArray({
    control,
    name: "referencias",
  });

  return (
    <section className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
      <h2 className="text-lg font-semibold">4. Referencias</h2>

      <div className="space-y-3 w-full max-w-full min-w-0">
        {refs.fields.map((f, i) => {
          const selectedRaw =
            (watch(`referencias.${i}.unidades_aplica`) as Array<number | string> | undefined) || [];
          const selected = selectedRaw
            .map((v) => Number(v))
            .filter((v) => !Number.isNaN(v));

          const tipoActual =
            (watch(`referencias.${i}.tipo`) as string | undefined) || "";

          return (
            <div
              key={f.id}
              className="border rounded-xl p-3 space-y-2 w-full max-w-full min-w-0 overflow-x-hidden"
            >
              <div className="w-full max-w-full min-w-0">
                <Label>Cita APA</Label>
                <Input
                  className="w-full max-w-full min-w-0"
                  {...register(`referencias.${i}.cita_apa` as const)}
                  placeholder="Apellido, A. (Año). Título..."
                  readOnly={readOnly}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-full min-w-0">
                {/* Unidades a las que aplica */}
                <div className="w-full max-w-full min-w-0 overflow-x-hidden">
                  <Label>Unidades temáticas a las que aplica</Label>

                  {/* ✅ si hay muchas unidades, que NO empuje el ancho */}
                  <div className="mt-1 w-full max-w-full overflow-x-auto [scrollbar-gutter:stable]">
                    <div className="flex flex-nowrap sm:flex-wrap gap-2 min-w-max sm:min-w-0">
                      {Array.from({ length: unidadesCount }).map((_, n) => {
                        const val = n + 1;
                        const isSel = selected.includes(val);

                        return (
                          <button
                            type="button"
                            key={val}
                            className={`px-2 py-1 rounded border text-sm transition shrink-0 ${
                              isSel
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                            disabled={readOnly}
                            onClick={() => {
                              if (readOnly) return;
                              const curr = new Set(selected);
                              if (curr.has(val)) curr.delete(val);
                              else curr.add(val);
                              const arr = Array.from(curr).sort((a, b) => a - b);
                              setValue(`referencias.${i}.unidades_aplica`, arr, {
                                shouldValidate: true,
                              });
                            }}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tipo */}
                <div className="w-full max-w-full min-w-0">
                  <Label>Tipo</Label>
                  <Select
                    value={tipoActual}
                    onValueChange={(v) =>
                      setValue(`referencias.${i}.tipo`, v as any, {
                        shouldValidate: true,
                      })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full max-w-full min-w-0">
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
                  className="
                        h-9 px-4
                        rounded-xl
                        bg-[#5A1236] text-white border border-[#5A1236]
                        text-sm font-medium
                        shadow-sm shadow-[#5A1236]/25
                        transition-all duration-150
                        hover:bg-[#741845]
                        hover:shadow-md hover:shadow-[#5A1236]/30
                        active:scale-[0.98]
                        focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-[#5A1236]/30
                        focus-visible:ring-offset-2
                        disabled:opacity-50 disabled:shadow-none
                      "             
                  onClick={() => refs.remove(i)}
                  disabled={readOnly}
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
        className="
                        h-9 px-4
                        rounded-xl
                        bg-[#5A1236] text-white border border-[#5A1236]
                        text-sm font-medium
                        shadow-sm shadow-[#5A1236]/25
                        transition-all duration-150
                        hover:bg-[#741845]
                        hover:shadow-md hover:shadow-[#5A1236]/30
                        active:scale-[0.98]
                        focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-[#5A1236]/30
                        focus-visible:ring-offset-2
                        disabled:opacity-50 disabled:shadow-none
                      "             
        onClick={() =>
          refs.append({
            cita_apa: "",
            unidades_aplica: [],
            tipo: "Básica",
          } as any)
        }
        disabled={readOnly}
      >
        Agregar referencia
      </Button>
    </section>
  );
}
