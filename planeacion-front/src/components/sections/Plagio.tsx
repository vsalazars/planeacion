"use client";

import { useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Props = {
  readOnly?: boolean;
};

export default function Plagio({ readOnly = false }: Props) {
  const { register, setValue, watch } = useFormContext<PlaneacionType>();

  const ithenticate = !!watch("plagio.ithenticate");
  const turnitin = !!watch("plagio.turnitin");

  return (
    <section className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
      <h2 className="text-lg font-semibold">
        5. Herramientas para detectar el plagio
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full min-w-0">
        <label className="flex items-center gap-2 w-full min-w-0">
          <Checkbox
            checked={ithenticate}
            disabled={readOnly}
            onCheckedChange={(v) => {
              if (readOnly) return;
              setValue("plagio.ithenticate", Boolean(v), {
                shouldValidate: true,
              });
            }}
          />
          <span className="text-sm">iThenticate</span>
        </label>

        <label className="flex items-center gap-2 w-full min-w-0">
          <Checkbox
            checked={turnitin}
            disabled={readOnly}
            onCheckedChange={(v) => {
              if (readOnly) return;
              setValue("plagio.turnitin", Boolean(v), { shouldValidate: true });
            }}
          />
          <span className="text-sm">Turnitin</span>
        </label>

        <div className="sm:col-span-2 lg:col-span-1 w-full max-w-full min-w-0">
          <Label className="text-sm mb-1.5 block">Otro (especificar)</Label>
          <Input
            className="w-full max-w-full min-w-0"
            placeholder="Nombre de la herramienta"
            {...register("plagio.otro")}
            readOnly={readOnly}
          />
        </div>
      </div>
    </section>
  );
}
