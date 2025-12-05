"use client";

import { useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function Plagio() {
  const { register, setValue, watch } = useFormContext<PlaneacionType>();

  // Siempre usar watch con fallback booleano
  const ithenticate = !!watch("plagio.ithenticate");
  const turnitin = !!watch("plagio.turnitin");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        5. Herramientas para detectar el plagio
      </h2>

      <div className="flex items-center gap-6">
        {/* iThenticate */}
        <label className="flex items-center gap-2">
          <Checkbox
            checked={ithenticate}
            onCheckedChange={(v) =>
              setValue("plagio.ithenticate", Boolean(v), {
                shouldValidate: true,
              })
            }
          />
          <span>iThenticate</span>
        </label>

        {/* Turnitin */}
        <label className="flex items-center gap-2">
          <Checkbox
            checked={turnitin}
            onCheckedChange={(v) =>
              setValue("plagio.turnitin", Boolean(v), {
                shouldValidate: true,
              })
            }
          />
          <span>Turnitin</span>
        </label>

        {/* Otro */}
        <div className="flex-1">
          <Label>Otro (especificar)</Label>
          <Input
            placeholder="Nombre de la herramienta"
            {...register("plagio.otro")}
          />
        </div>
      </div>
    </section>
  );
}
