"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Props = { unidadesCount: number };

export default function Referencias({ unidadesCount }: Props) {
  const { control, register, setValue, watch } = useFormContext<PlaneacionType>();
  const refs = useFieldArray({ control, name: "referencias" });

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">4. Referencias</h2>

      <div className="space-y-3">
        {refs.fields.map((f, i) => {
          const selected = watch(`referencias.${i}.unidades_aplica`) || [];
          return (
            <div key={f.id} className="border rounded-xl p-3 space-y-2">
              <div>
                <Label>Cita APA</Label>
                <Input {...register(`referencias.${i}.cita_apa`)} placeholder="Apellido, A. (Año). Título..." />
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <Label>Unidades temáticas a las que aplica</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: unidadesCount }).map((_, n) => {
                      const val = n + 1;
                      const isSel = selected.includes(val);
                      return (
                        <button
                          type="button"
                          key={val}
                          className={`px-2 py-1 rounded border text-sm ${isSel ? "bg-primary text-primary-foreground" : ""}`}
                          onClick={() => {
                            const curr = new Set(selected);
                            if (curr.has(val)) curr.delete(val); else curr.add(val);
                            setValue(`referencias.${i}.unidades_aplica`, Array.from(curr));
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select onValueChange={(v) => setValue(`referencias.${i}.tipo`, v as any)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Básica">Básica</SelectItem>
                      <SelectItem value="Complementaria">Complementaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => refs.remove(i)}>Quitar referencia</Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={() => refs.append({ cita_apa: "", unidades_aplica: [], tipo: "Básica" })}>
        Agregar referencia
      </Button>
    </section>
  );
}
