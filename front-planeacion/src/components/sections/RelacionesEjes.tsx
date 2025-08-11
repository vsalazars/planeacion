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

function AyudaEje({
  titulo,
  quePoner,
  checklist,
  ejemplo,
}: {
  titulo: string;
  quePoner: string;
  checklist: string[];
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
          <b>Checklist rápido</b>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            {checklist.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ul>
        </div>
        <div>
          <b>Ejemplo breve</b>
          <p className="mt-1">{ejemplo}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function RelacionesEjes() {
  const { register } = useFormContext<PlaneacionType>();

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
                    checklist={[
                    "Nombrar unidades previas exactas (según plan de estudios).",
                    "Usar nombres oficiales, separados por comas.",
                    "Incluir solo las indispensables para el entendimiento inicial.",
                    ]}
                    ejemplo="Álgebra, Cálculo Diferencial, Fundamentos de Programación."
                />
                </div>
                <Input placeholder="Cálculo I, Álgebra" {...register("antecedentes")} />
            </div>

            <div>
                <div className="flex items-center justify-between">
                <Label>Laterales</Label>
                <AyudaEje
                    titulo="Laterales"
                    quePoner="Unidades de aprendizaje que se cursan de forma paralela y complementan contenidos de la materia."
                    checklist={[
                    "Indicar asignaturas que comparten temario o refuerzan contenidos.",
                    "Deben ser cursadas en el mismo semestre o nivel.",
                    "Usar nombres oficiales del plan de estudios.",
                    ]}
                    ejemplo="Física I, Taller de Comunicación Oral y Escrita."
                />
                </div>
                <Input placeholder="Física I" {...register("laterales")} />
            </div>

            <div>
                <div className="flex items-center justify-between">
                <Label>Subsecuentes</Label>
                <AyudaEje
                    titulo="Subsecuentes"
                    quePoner="Unidades de aprendizaje que dependen directamente de los conocimientos y competencias adquiridas en esta materia."
                    checklist={[
                    "Nombrar asignaturas que requieren esta materia como base.",
                    "Usar nombres oficiales del plan de estudios.",
                    "Considerar las que continúan la línea de formación.",
                    ]}
                    ejemplo="Cálculo III, Mecánica de Materiales."
                />
                </div>
                <Input placeholder="Cálculo III" {...register("subsecuentes")} />
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
              checklist={[
                "Actividad/proyecto con impacto social/ambiental claro.",
                "Uso eficiente de recursos/materiales; prácticas de reducción/resuso.",
                "Vinculación con comunidad/sector (si aplica) y resultados esperados.",
                "Evidencias solicitadas (reporte, bitácora, prototipo, campaña).",
                "Criterios/instrumentos de evaluación (rúbrica, lista de cotejo).",
              ]}
              ejemplo="Desarrollo de propuesta de ahorro energético para el laboratorio: medición de consumo base, implementación piloto, reporte con indicadores antes/después y recomendaciones; evaluación con rúbrica (criterios de pertinencia, datos y viabilidad)."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Describe las actividades, evidencias y criterios de evaluación orientados a impacto social/ambiental…"
            {...register("ejes.compromiso_social_sustentabilidad")}
          />
        </div>

        {/* 2.2.2 Perspectiva, inclusión y erradicación de la violencia de género */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Perspectiva, inclusión y erradicación de la violencia de género</Label>
            <AyudaEje
              titulo="Perspectiva de género e inclusión"
              quePoner="Medidas y dinámicas para garantizar igualdad sustantiva, participación equitativa, lenguaje inclusivo y cultura de paz; explica cómo se implementa y cómo se verifica."
              checklist={[
                "Acuerdos de convivencia y canalización a protocolos institucionales.",
                "Estrategias para participación equitativa y rotación de roles.",
                "Materiales/ejemplos sin sesgos; lenguaje inclusivo.",
                "Flexibilidades razonables (p. ej., responsabilidades de cuidado).",
                "Evidencia y evaluación (rúbrica sin sesgos, auto/coevaluación).",
              ]}
              ejemplo="Trabajo en equipos con rotación de roles técnicos y liderazgo; acuerdos de convivencia al inicio; anuncio de canales de atención institucional; rúbrica de participación con criterios objetivos y sin sesgos."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Detalla reglas de convivencia, estrategias de participación, materiales inclusivos y mecanismos de atención…"
            {...register("ejes.perspectiva_genero")}
          />
        </div>

        {/* 2.2.3 Internacionalización del IPN */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Internacionalización del IPN</Label>
            <AyudaEje
              titulo="Internacionalización"
              quePoner="Acciones que desarrollen competencias globales: uso de estándares internacionales, recursos en otro idioma, comparación de contextos, colaboración académica externa."
              checklist={[
                "Lecturas/recursos en otro idioma o normas internacionales (ISO/IEEE…).",
                "Comparativa de prácticas/legislación de otros países.",
                "Clase espejo o microproyecto con otra institución (virtual/presencial).",
                "Productos con enfoque intercultural y criterios de evaluación claros.",
                "Evidencia de reflexión sobre diferencias de contexto.",
              ]}
              ejemplo="Análisis comparado de norma ISO vs. normativa nacional; clase espejo con universidad socia para discutir casos; entrega de reflexión sobre implicaciones en distintos contextos."
            />
          </div>
          <Textarea
            rows={5}
            placeholder="Expón estándares, comparativas, colaboraciones externas y evidencias de logro intercultural…"
            {...register("ejes.internacionalizacion")}
          />
        </div>
      </div>
    </section>
  );
}
