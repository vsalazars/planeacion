// src/components/planeacion/PlaneacionAside.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, CircleAlert, ListChecks } from "lucide-react";

import {
  SECTION_LABELS,
  SectionKey,
  SectionProgress,
} from "./PlaneacionValidation";

type Props = {
  sectionProgress: Record<SectionKey, SectionProgress>;
};

export default function PlaneacionAside({ sectionProgress }: Props) {
  const sectionKeys = Object.keys(sectionProgress) as SectionKey[];

  const totalSections = sectionKeys.length;
  const completedSections = sectionKeys.filter(
    (key) => (sectionProgress[key].missing || []).length === 0
  ).length;

  const completionPercent =
    totalSections > 0
      ? Math.round((completedSections / totalSections) * 100)
      : 0;

  return (
    <aside className="hidden md:flex w-[320px] shrink-0">

      <div className="sticky top-[5.5rem]">
        <Card className="max-h-[calc(100vh-136px)] overflow-y-auto flex flex-col shadow-sm pb-4">
        

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ListChecks className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <CardTitle className="text-sm font-semibold">
                    Avance por sección
                  </CardTitle>
                  <CardDescription className="text-[11px] leading-snug">
                    Seguimiento detallado de la planeación didáctica.
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={completionPercent === 100 ? "default" : "outline"}
                className="text-[10px] px-2 py-0"
              >
                {completionPercent === 100 ? "Completa" : "En progreso"}
              </Badge>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {completedSections} de {totalSections} secciones completas
                </span>
                <span className="font-medium text-foreground">
                  {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-1.5" />
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Se actualiza al cargar la planeación y utilizar{" "}
              <span className="font-medium">“Guardar”.</span>
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-3 flex-1 flex flex-col">
            <div className="space-y-3 pr-1 pb-16">

              {sectionKeys.map((key) => {
                const sec = sectionProgress[key];
                const missing = sec.missing || [];
                const isComplete = missing.length === 0;

                return (
                  <div
                    key={key}
                    className={`
                      rounded-md border px-3 py-2.5 text-xs transition-colors
                      ${
                        isComplete
                          ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/70"
                          : "bg-muted/60 hover:bg-muted border-border/80"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="font-medium text-[11px]">
                          {SECTION_LABELS[key]}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${
                          isComplete
                            ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-300"
                            : "border-amber-500/60 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {isComplete ? "Completa" : "Pendiente"}
                      </Badge>
                    </div>

                    {!isComplete && (
                      <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
                        {missing.map((m, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="mt-[3px] inline-block h-1 w-1 rounded-full bg-muted-foreground/60" />
                            <span className="leading-snug">{m}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isComplete && (
                      <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                        Todos los campos requeridos están completos en esta
                        sección.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
