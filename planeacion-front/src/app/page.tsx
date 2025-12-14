"use client";

import React from "react";
import Link from "next/link";

import AuthPanel from "@/components/auth/AuthPanel";
import PublicoInline from "@/components/publico/PublicoInline";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-md border">
              <span aria-hidden>📘</span>
            </div>
            <span className="font-semibold tracking-wide">
              Sistema de Planeación Didáctica
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#que-es" className="hover:text-foreground">
              ¿Qué es?
            </a>
            <a href="#beneficios" className="hover:text-foreground">
              Beneficios
            </a>
            <a href="#caracteristicas" className="hover:text-foreground">
              Características
            </a>
            <a href="#faqs" className="hover:text-foreground">
              FAQ
            </a>
            <a href="#contacto" className="hover:text-foreground">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          {/* Texto */}
          <div>
            <p className="mb-3 inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
              Versión preliminar
            </p>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Planeación didáctica
            </h1>

            <p className="mt-4 text-muted-foreground max-w-prose">
              Diseña, organiza y da seguimiento a planeaciones con los cinco
              apartados del instructivo: datos generales, orientación, unidades
              temáticas, evaluación y bibliografía.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {/* Login */}
              <AuthPanel
                buttonLabel="Iniciar sesión"
                buttonSize="lg"
                buttonClassName="px-6"
              />

              {/* Acceso público (scroll) */}
              <Button
                variant="outline"
                size="lg"
                className="px-6"
                onClick={() => {
                  document
                    .getElementById("busqueda-publica")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Buscar planeaciones
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Búsqueda pública: solo planeaciones finalizadas.
            </p>
          </div>

          {/* Marketing visual (placeholder) */}
          <div className="hidden md:flex justify-center">
            <div className="w-full max-w-md h-64 rounded-xl border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
              Vista previa / mockup
            </div>
          </div>
        </div>
      </section>

      {/* ================= BÚSQUEDA PÚBLICA INLINE ================= */}
      <section id="busqueda-publica" className="border-b bg-muted/20">
        {/* ✅ MISMO ANCHO QUE HERO (max-w-7xl) */}
        <div className="mx-auto max-w-7xl px-4 py-14">
          <PublicoInline />
        </div>
      </section>

      {/* ================= SECCIONES INFORMATIVAS ================= */}
      <section id="que-es" className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">¿Qué es?</h2>
          <p className="text-muted-foreground max-w-prose">
            El Sistema de Planeación Didáctica permite a los docentes estructurar,
            documentar y compartir planeaciones alineadas a los programas
            académicos institucionales, facilitando la organización, evaluación
            y seguimiento del proceso de enseñanza-aprendizaje.
          </p>
        </div>
      </section>

      <section id="beneficios" className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">Beneficios</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Estandarización de planeaciones didácticas.</li>
            <li>Seguimiento claro por unidades temáticas y sesiones.</li>
            <li>Evaluación transparente y documentada.</li>
            <li>Consulta pública de planeaciones finalizadas.</li>
          </ul>
        </div>
      </section>

      <section id="caracteristicas" className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">Características</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Editor guiado por secciones.</li>
            <li>Cronograma por unidades temáticas.</li>
            <li>Gestión de evidencias e instrumentos.</li>
            <li>Exportación e impresión.</li>
          </ul>
        </div>
      </section>

      <section id="faqs" className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">Preguntas frecuentes</h2>
          <p className="text-muted-foreground">
            Solo las planeaciones marcadas como <strong>finalizadas</strong> son
            visibles públicamente.
          </p>
        </div>
      </section>

      <section id="contacto">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-4">Contacto</h2>
          <p className="text-muted-foreground">
            Para soporte o comentarios, contacta al administrador del sistema.
          </p>
        </div>
      </section>
    </main>
  );
}
