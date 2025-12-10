"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";

// Tipar un poco la respuesta que viene del backend
type Planeacion = {
  id: number;
  docente_id: number;
  unidad_academica_id: number;
  nombre_planeacion: string;
  status: string;
  created_at: string; // viene como ISO string
  updated_at: string; // viene como ISO string
};

export default function PlaneacionesPage() {
  const router = useRouter();

  const [planeaciones, setPlaneaciones] = useState<Planeacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function formatFecha(iso: string) {
    try {
      return new Date(iso).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  // --------------------------------------------------------
  // Cargar lista real desde /api/planeaciones
  // --------------------------------------------------------
  async function cargarPlaneaciones() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/planeaciones", { cache: "no-store" });

      const data = await res.json();

      if (!res.ok) {
        // El backend ya envía { error: "..." }
        const msg =
          (data && data.error) ||
          `Error obteniendo planeaciones (status ${res.status})`;
        setErrorMsg(msg);
        setPlaneaciones([]);
        return;
      }

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : [];

      setPlaneaciones(items);
    } catch (err) {
      console.error("Error cargando planeaciones:", err);
      setErrorMsg("No se pudo conectar con el servidor de planeaciones.");
      setPlaneaciones([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPlaneaciones();
  }, []);

  // --------------------------------------------------------
  // Crear planeación: pedir nombre al usuario
  // --------------------------------------------------------
  async function crearPlaneacion() {
    // Pedimos el nombre de la nueva planeación
    const nombre = window.prompt(
      "Escribe el nombre de la nueva planeación (por ejemplo: 'Álgebra 1 - Grupo A'):"
    );

    // Si el usuario cancela el prompt, no hacemos nada
    if (nombre === null) return;

    const trimmed = nombre.trim();
    if (!trimmed) {
      alert("El nombre de la planeación no puede estar vacío.");
      return;
    }

    try {
      const res = await fetch("/api/planeaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_planeacion: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo crear la planeación");
        return;
      }

      const id = data.id;
      localStorage.setItem("planeacion_actual_id", String(id));
      router.push(`/dashboard-planeacion?planeacionId=${id}`);
    } catch (err) {
      console.error(err);
      alert("Error creando planeación.");
    }
  }

  // --------------------------------------------------------
  // Eliminar planeación
  // --------------------------------------------------------
  async function eliminarPlaneacion(id: number) {
    if (!confirm("¿Eliminar esta planeación? Esta acción no se puede deshacer.")) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/planeaciones/${id}`, { method: "DELETE" });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Error eliminando planeación.");
        return;
      }

      await cargarPlaneaciones();
    } catch {
      alert("No se pudo eliminar.");
    } finally {
      setDeletingId(null);
    }
  }

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Planeaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y edita tus planeaciones vinculadas a tu cuenta.
          </p>
        </div>

        <Button
          onClick={crearPlaneacion}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva planeación
        </Button>
      </header>

      {/* =================== ALERTA DE ERROR =================== */}
      {errorMsg && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* =================== LISTA =================== */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : planeaciones.length === 0 && !errorMsg ? (
        <div className="text-muted-foreground text-center py-20">
          <p className="text-lg">Aún no tienes planeaciones.</p>
          <Button onClick={crearPlaneacion} className="mt-4">
            Crear la primera
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {planeaciones.map((p) => {
            const isFinalizada = p.status === "finalizada";

            return (
              <Card
                key={p.id}
                className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <h2 className="text-xl font-semibold">
                    {p.nombre_planeacion || "Planeación sin título"}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Creada:{" "}
                      <span className="font-medium">{formatFecha(p.created_at)}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Última actualización:{" "}
                      <span className="font-medium">
                        {formatFecha(p.updated_at)}
                      </span>
                    </span>
                  </div>

                  <Badge
                    variant={
                      p.status === "finalizada"
                        ? "default"
                        : p.status === "en_progreso"
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-2"
                  >
                    {p.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  {/* Editar (deshabilitado si está finalizada) */}
                  <Button
                    variant={isFinalizada ? "outline" : "secondary"}
                    size="sm"
                    disabled={isFinalizada}
                    onClick={
                      isFinalizada
                        ? undefined
                        : () =>
                            router.push(
                              `/dashboard-planeacion?planeacionId=${p.id}`
                            )
                    }
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {isFinalizada ? "Finalizada" : "Editar"}
                  </Button>

                  {/* Eliminar (si quieres, también podrías bloquear para finalizadas) */}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === p.id}
                    onClick={() => eliminarPlaneacion(p.id)}
                  >
                    {deletingId === p.id ? "..." : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            );
          })}

        </div>
      )}
    </main>
  );
}
