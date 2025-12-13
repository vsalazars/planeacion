"use client";

import { useFormContext } from "react-hook-form";
import { PlaneacionType } from "../schema";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";

type Props = {
  readOnly?: boolean;
};

function AyudaEje({
  titulo,
  quePoner,
  ejemplo,
}: {
  titulo: string;
  quePoner: string;
  ejemplo: string;
}) {
  return (
    <HoverCard openDelay={80} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
          <Info className="h-4 w-4" />
          <span className="sr-only">Ayuda: {titulo}</span>
        </Button>
      </HoverCardTrigger>

      <HoverCardContent className="w-96 text-xs leading-relaxed space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {titulo}
        </p>

        <p>
          <b>¿Qué escribir?</b> {quePoner}
        </p>

        <div>
          <b>Ejemplo breve</b>
          <p className="mt-1">{ejemplo}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

export default function RelacionesEjes({ readOnly = false }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PlaneacionType>();

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">
        2. Relación con otras unidades y ejes transversales
      </h2>

      {/* 2.1 Relación con otras UAs */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label>Antecedentes</Label>
            <AyudaEje
              titulo="Antecedentes"
              quePoner="Lista de unidades de aprendizaje que los estudiantes deben haber cursado antes, y que aportan conocimientos necesarios para esta materia."
              ejemplo="Álgebra, Cálculo Diferencial, Fundamentos de Programación."
            />
          </div>
          <Input
            placeholder="Cálculo I, Álgebra"
            {...register("antecedentes")}
            readOnly={readOnly}
          />
          <FieldError msg={errors.antecedentes?.message as string | undefined} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Laterales</Label>
            <AyudaEje
              titulo="Laterales"
              quePoner="Unidades de aprendizaje que se cursan de forma paralela y complementan contenidos de la materia."
              ejemplo="Física I, Taller de Comunicación Oral y Escrita."
            />
          </div>
          <Input
            placeholder="Física I"
            {...register("laterales")}
            readOnly={readOnly}
          />
          <FieldError msg={errors.laterales?.message as string | undefined} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Subsecuentes</Label>
            <AyudaEje
              titulo="Subsecuentes"
              quePoner="Unidades de aprendizaje que dependen directamente de los conocimientos y competencias adquiridas en esta materia."
              ejemplo="Cálculo III, Mecánica de Materiales."
            />
          </div>
          <Input
            placeholder="Cálculo III"
            {...register("subsecuentes")}
            readOnly={readOnly}
          />
          <FieldError
            msg={errors.subsecuentes?.message as string | undefined}
          />
        </div>
      </div>

      {/* 2.2 Ejes transversales con ayuda contextual (HoverCard) */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 2.2.1 Compromiso social y sustentabilidad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Compromiso social y sustentabilidad</Label>
            <AyudaEje
              titulo="Compromiso social y sustentabilidad"
              quePoner="Acciones concretas dentro del curso que promuevan responsabilidad social y uso sostenible de recursos; describe qué harán docente y estudiantes, con productos y forma de evaluación."
              ejemplo="Desarrollo de propuesta de ahorro energético para el laboratorio: medición de consumo base, implementación piloto, reporte con indicadores antes/después y recomendaciones; evaluación con rúbrica (criterios de pertinencia, datos y viabilidad)."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Describe las actividades, evidencias y criterios de evaluación orientados a impacto social/ambiental…"
            {...register("ejes.compromiso_social_sustentabilidad")}
            readOnly={readOnly}
          />
          <FieldError
            msg={
              (errors.ejes as any)?.compromiso_social_sustentabilidad
                ?.message as string | undefined
            }
          />
        </div>

        {/* 2.2.2 Perspectiva, inclusión y erradicación de la violencia de género */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Perspectiva, inclusión y erradicación de la violencia de género
            </Label>
            <AyudaEje
              titulo="Perspectiva de género e inclusión"
              quePoner="Medidas y dinámicas para garantizar igualdad sustantiva, participación equitativa, lenguaje inclusivo y cultura de paz; explica cómo se implementa y cómo se verifica."
              ejemplo="Trabajo en equipos con rotación de roles técnicos y liderazgo; acuerdos de convivencia al inicio; anuncio de canales de atención institucional; rúbrica de participación con criterios objetivos y sin sesgos."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Detalla reglas de convivencia, estrategias de participación, materiales inclusivos y mecanismos de atención…"
            {...register("ejes.perspectiva_genero")}
            readOnly={readOnly}
          />
          <FieldError
            msg={
              (errors.ejes as any)?.perspectiva_genero
                ?.message as string | undefined
            }
          />
        </div>

        {/* 2.2.3 Internacionalización del IPN */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Internacionalización del IPN</Label>
            <AyudaEje
              titulo="Internacionalización"
              quePoner="Acciones que desarrollen competencias globales: uso de estándares internacionales, recursos en otro idioma, comparación de contextos, colaboración académica externa."
              ejemplo="Análisis comparado de norma ISO vs. normativa nacional; clase espejo con universidad socia para discutir casos; entrega de reflexión sobre implicaciones en distintos contextos."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Expón estándares, comparativas, colaboraciones externas y evidencias de logro intercultural…"
            {...register("ejes.internacionalizacion")}
            readOnly={readOnly}
          />
          <FieldError
            msg={
              (errors.ejes as any)?.internacionalizacion
                ?.message as string | undefined
            }
          />
        </div>
      </div>
    </section>
  );
}
