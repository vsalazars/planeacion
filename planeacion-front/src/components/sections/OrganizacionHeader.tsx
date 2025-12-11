"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Target, Workflow } from "lucide-react";

export default function OrganizacionHeader() {
  const { register, control } = useFormContext<PlaneacionType>();

  // Para darle un mini “estado” al header
  const proposito = useWatch({
    control,
    name: "organizacion.proposito" as any,
  }) as string | undefined;

  const estrategia = useWatch({
    control,
    name: "organizacion.estrategia" as any,
  }) as string | undefined;

  const metodos = useWatch({
    control,
    name: "organizacion.metodos" as any,
  }) as string | undefined;

  const campos = [
    proposito?.trim(),
    estrategia?.trim(),
    metodos?.trim(),
  ];
  const filled = campos.filter((v) => v && v.length > 0).length;
  const total = campos.length;
  const completado = Math.round((filled / total) * 100);

  return (
    <section className="space-y-4">
      {/* Header visual pro */}
      <Card className="border-primary/20 bg-gradient-to-r from-background via-background to-primary/10 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  3
                </span>
                Organización didáctica
              </CardTitle>
              <CardDescription className="mt-1 text-xs md:text-sm">
                Define el propósito general, la estrategia rectora y los métodos de enseñanza que articulan la unidad de aprendizaje.
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Target className="h-3 w-3" />
                  Propósito
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Workflow className="h-3 w-3" />
                  Estrategia
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  Métodos
                </Badge>
              </div>
            </div>
          </div>

          {/* Estado rápido de avance */}
          <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end gap-1 text-xs">
            <span className="text-muted-foreground">
              Encabezado completado:
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${completado}%` }}
                />
              </div>
              <span className="text-[11px] font-medium tabular-nums">
                {isNaN(completado) ? "0" : completado}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {filled} de {total} campos clave
            </span>
          </div>
        </CardHeader>

        <Separator className="opacity-60" />

        {/* Campos del formulario */}
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-3 space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                Propósito u objetivo general de la unidad de aprendizaje
                <span className="text-[10px] rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  Eje rector
                </span>
              </Label>
              <Textarea
                rows={3}
                placeholder="Redacta el propósito u objetivo general; utiliza verbos de acción, condición de logro y contexto…"
                {...register("organizacion.proposito" as any)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Estrategia de aprendizaje (rectora)
              </Label>
              <Input
                placeholder="ABP, estudio de casos, proyectos, aula invertida, etc."
                {...register("organizacion.estrategia" as any)}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-sm">
                Métodos de enseñanza
              </Label>
              <Input
                placeholder="Deductivo; inductivo; analógico; lógico; heurístico; etc."
                {...register("organizacion.metodos" as any)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
