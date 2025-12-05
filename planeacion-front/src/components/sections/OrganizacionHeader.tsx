"use client";

import { useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function OrganizacionHeader() {
  const { register } = useFormContext<PlaneacionType>();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">3. Organización didáctica (encabezado)</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <Label>Propósito u objetivo general de la unidad de aprendizaje</Label>
          {/* temporal: fuera del schema, lo integramos después */}
          <Textarea rows={3} placeholder="Redacta el propósito u objetivo general…" {...register("organizacion.proposito" as any)} />
        </div>

        <div>
          <Label>Estrategia de aprendizaje (rectora)</Label>
          <Input placeholder="ABP, Estudio de casos, Proyectos, etc." {...register("organizacion.estrategia" as any)} />
        </div>

        <div className="md:col-span-2">
          <Label>Métodos de enseñanza</Label>
          <Input placeholder="Deductivo; Inductivo; Analógico; Lógico; etc." {...register("organizacion.metodos" as any)} />
        </div>
      </div>
    </section>
  );
}
