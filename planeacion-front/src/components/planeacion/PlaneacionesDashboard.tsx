"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import PlaneacionForm from "./PlaneacionForm";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

type PlaneacionStatus = "borrador" | "finalizada";

type PlaneacionResumen = {
  id: number;
  nombre_planeacion: string;
  created_at?: string;
  updated_at?: string;
  status?: PlaneacionStatus;
};

export default function PlaneacionesDashboard({ token }: { token: string }) {
  const router = useRouter();

  const [planeaciones, setPlaneaciones] = useState<PlaneacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 👉 para forzar remount del formulario
  const [formKey, setFormKey] = useState(0);
  // 👉 nombre inicial cuando es NUEVA planeación
  const [initialNombrePlaneacion, setInitialNombrePlaneacion] = useState<
    string | undefined
  >(undefined);

  // 👉 indica si la planeación seleccionada es solo lectura (finalizada)
  const [selectedReadOnly, setSelectedReadOnly] = useState(false);

  // 👉 estado del diálogo "Nueva planeación"
  const [showNuevaDialog, setShowNuevaDialog] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  // ─────────────────────────────
  // Cargar lista de planeaciones
  // ─────────────────────────────
  async function loadPlaneaciones() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/planeaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          `No se pudieron cargar las planeaciones (${res.status})`
        );
      }

      const data = await res.json();
      const items: PlaneacionResumen[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setPlaneaciones(items);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error cargando planeaciones");
      toast.error(err?.message || "Error cargando planeaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaneaciones();
  }, []);

  // ─────────────────────────────
  // Handlers de UI
  // ─────────────────────────────
  function handleNuevaPlaneacion() {
    // Abrimos el diálogo de shadcn, sin usar window.prompt
    setNuevoNombre("");
    setShowNuevaDialog(true);
  }

  function confirmarNuevaPlaneacion() {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      toast.error("Escribe un nombre para la nueva planeación.");
      return;
    }

    if (typeof window !== "undefined") {
      // limpiar cualquier id previo guardado
      window.localStorage.removeItem("planeacion_actual_id");
    }

    // Esto indica que estamos en modo "nueva planeación"
    setSelectedId(null);
    setSelectedReadOnly(false);

    // guardamos el nombre para el formulario nuevo
    setInitialNombrePlaneacion(nombre);

    // forzamos remount del formulario para tenerlo en blanco
    setFormKey((k) => k + 1);

    setShowNuevaDialog(false);
    toast.info(`Nueva planeación: "${nombre}"`);
  }

  function handleEditar(id: number) {
    const pl = planeaciones.find((p) => p.id === id);
    if (!pl) return;

    const isFinal = pl.status === "finalizada";

    // Seleccionar planeación (aunque esté finalizada)
    setSelectedId(id);
    setInitialNombrePlaneacion(undefined); // se tomará del backend
    setSelectedReadOnly(isFinal);
    setFormKey((k) => k + 1);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("planeacion_actual_id", String(id));
    }

    if (isFinal) {
      toast.info(
        `Planeación finalizada (solo lectura): ${
          pl.nombre_planeacion || `Planeación #${id}`
        }`
      );
    } else {
      toast.info(
        `Editando planeación didáctica: ${
          pl.nombre_planeacion || `Planeación #${id}`
        }`
      );
    }
  }

  async function handleRefrescar() {
    await loadPlaneaciones();
  }

  // 👉 se llama desde PlaneacionForm cuando la planeación se finaliza
  async function handleFinalizarDesdeForm() {
    await loadPlaneaciones();
    setSelectedReadOnly(true);
    // Opcional: ocultar el placeholder de "sin guardar aún"
    setInitialNombrePlaneacion(undefined);
  }

  // 👉 eliminar la planeación seleccionada
  async function handleEliminarSeleccionada() {
    if (!selectedId) {
      toast.error("Selecciona una planeación para eliminar.");
      return;
    }

    const pl = planeaciones.find((p) => p.id === selectedId);
    const nombre = pl?.nombre_planeacion || `Planeación #${selectedId}`;

    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `¿Seguro que deseas eliminar "${nombre}"?\nEsta acción no se puede deshacer.`
      );
      if (!ok) return;
    }

    try {
      const res = await fetch(`${API_BASE}/planeaciones/${selectedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let msg = `No se pudo eliminar la planeación (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.error || data?.msg || msg;
        } catch {
          //
        }
        toast.error(msg);
        return;
      }

      toast.success(`Planeación eliminada: "${nombre}"`);

      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("planeacion_actual_id");
        if (stored === String(selectedId)) {
          window.localStorage.removeItem("planeacion_actual_id");
        }
      }

      setSelectedId(null);
      setSelectedReadOnly(false);
      setInitialNombrePlaneacion(undefined);
      setFormKey((k) => k + 1); // resetear formulario
      await loadPlaneaciones();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al eliminar la planeación");
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full min-h-0">
        {/* Header general */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold">Planeación didáctica</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus planeaciones y edítalas en un solo lugar.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefrescar}
              disabled={loading}
            >
              {loading ? "Actualizando…" : "Actualizar lista"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleEliminarSeleccionada}
              disabled={!selectedId}
            >
              Eliminar
            </Button>
            <Button type="button" onClick={handleNuevaPlaneacion}>
              Nueva planeación
            </Button>
          </div>
        </div>

        {/* Layout principal responsivo */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-136px)] min-h-0">
          {/* Columna izquierda: Mis planeaciones */}
          <Card
            className="
              w-full lg:w-1/3 xl:w-1/4 2xl:w-1/5
              min-w-[260px]
              p-4 flex flex-col gap-3 min-h-[260px]
              lg:sticky lg:top-[5.5rem]
              max-h-[calc(100vh-136px)]
            "
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm md:text-base">
                Mis planeaciones
              </h2>
              <span className="text-xs text-muted-foreground">
                {planeaciones.length} registro
                {planeaciones.length === 1 ? "" : "s"}
              </span>
            </div>

            <Separator />

            {error && <p className="text-xs text-destructive">{error}</p>}

            <ScrollArea className="flex-1 max-h-full pr-2">
              <div className="space-y-3">
                {/* 👉 Mostrar la nueva planeación activa (sin id) en la barra */}
                {initialNombrePlaneacion && selectedId === null && (
                  <div className="w-full rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Nueva planeación
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {initialNombrePlaneacion}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          (Sin guardar aún)
                        </span>
                      </div>
                      <div className="pt-1">
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px]"
                        >
                          Borrador
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {planeaciones.length === 0 && !loading && (
                  <p className="text-xs text-muted-foreground">
                    Aún no tienes planeaciones. Crea una nueva usando el botón
                    <span className="font-medium"> “Nueva planeación”</span>.
                  </p>
                )}

                {planeaciones.map((p) => {
                  const isSelected = p.id === selectedId;
                  const status = (p.status || "borrador") as PlaneacionStatus;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleEditar(p.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                        status === "finalizada"
                          ? isSelected
                            ? "border-primary bg-primary/5 opacity-80"
                            : "opacity-70 hover:bg-muted/60"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col">
                          <span className="font-medium truncate">
                            {p.nombre_planeacion || `Planeación #${p.id}`}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Creada: {formatDate(p.created_at) || "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Última actualización:{" "}
                            {formatDate(p.updated_at) || "—"}
                          </span>
                        </div>

                        <div className="pt-1">
                          <Badge
                            variant={
                              status === "finalizada" ? "default" : "outline"
                            }
                            className="text-[10px]"
                          >
                            {status === "finalizada"
                              ? "Finalizada"
                              : "Borrador"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Columna derecha: Formulario (nueva / edición) */}
          <Card className="w-full lg:flex-1 p-4 h-[calc(100vh-200px)] flex flex-col overflow-hidden mb-6">
            <PlaneacionForm
              key={formKey}
              token={token}
              planeacionId={selectedId}
              initialNombrePlaneacion={initialNombrePlaneacion}
              readOnly={selectedReadOnly} // 👈 seguir respetando solo lectura
              onFinalizar={handleFinalizarDesdeForm} // 👈 refrescar barra al finalizar
            />
          </Card>
        </div>
      </div>

      {/* Dialog shadcn para nueva planeación */}
      <Dialog open={showNuevaDialog} onOpenChange={setShowNuevaDialog}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmarNuevaPlaneacion();
            }}
          >
            <DialogHeader>
              <DialogTitle>Nueva planeación</DialogTitle>
              <DialogDescription>
                Escribe el nombre con el que deseas identificar esta
                planeación didáctica.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">
                Nombre de la planeación
              </label>
              <Input
                autoFocus
                placeholder="Ej. Planeación cálculo diferencial grupo 1CV1"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNuevaDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
