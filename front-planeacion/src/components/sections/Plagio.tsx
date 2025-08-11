"use client";
import { useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function Plagio() {
  const { register, setValue, watch } = useFormContext<PlaneacionType>();
  const ith = watch("plagio.ithenticate");
  const tur = watch("plagio.turnitin");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">5. Herramientas para detectar el plagio</h2>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <Checkbox checked={!!ith} onCheckedChange={v => setValue("plagio.ithenticate", !!v)} />
          <span>iThenticate</span>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={!!tur} onCheckedChange={v => setValue("plagio.turnitin", !!v)} />
          <span>Turnitin</span>
        </label>
        <div className="flex-1">
          <Label>Otro (especificar)</Label>
          <Input placeholder="Nombre de la herramienta" {...register("plagio.otro")} />
        </div>
      </div>
    </section>
  );
}
