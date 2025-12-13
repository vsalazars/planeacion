"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import PlaneacionForm from "./PlaneacionForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Plus, Trash2 } from "lucide-react";

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

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function getStatusUI(status?: PlaneacionStatus) {
  const s: PlaneacionStatus = (status || "borrador") as PlaneacionStatus;

  if (s === "finalizada") {
    return {
      label: "Finalizada",
      className:
        "bg-emerald-600/15 text-emerald-700 border-emerald-600/30 " +
        "dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/30",
    };
  }

  return {
    label: "Borrador",
    className:
      "bg-amber-600/15 text-amber-800 border-amber-600/30 " +
      "dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/30",
  };
}

export default function PlaneacionesDashboard({ token }: { token: string }) {
  const router = useRouter();

  const [planeaciones, setPlaneaciones] = useState<PlaneacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedReadOnly, setSelectedReadOnly] = useState(false);

  const [formKey, setFormKey] = useState(0);

  // Solo para el “preview” de nueva (sin guardar)
  const [initialNombrePlaneacion, setInitialNombrePlaneacion] =
    useState<string>();

  const [showNuevaDialog, setShowNuevaDialog] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  async function loadPlaneaciones() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/planeaciones`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(
          `No se pudieron cargar las planeaciones (${res.status})`
        );
      }

      const data = await res.json();

      // tu back devuelve arreglo directo
      const items: PlaneacionResumen[] = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setPlaneaciones(items);
    } catch (err: any) {
      const msg = err?.message || "Error cargando planeaciones";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaneaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNuevaPlaneacion() {
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
      window.localStorage.removeItem("planeacion_actual_id");
    }

    setSelectedId(null);
    setSelectedReadOnly(false);
    setInitialNombrePlaneacion(nombre);
    setFormKey((k) => k + 1);
    setShowNuevaDialog(false);

    toast.info(`Nueva planeación: "${nombre}"`);
  }

  function handleEditar(id: number) {
    const pl = planeaciones.find((p) => p.id === id);
    if (!pl) return;

    const isFinal = pl.status === "finalizada";

    setSelectedId(id);
    setSelectedReadOnly(isFinal);
    setInitialNombrePlaneacion(undefined);
    setFormKey((k) => k + 1);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("planeacion_actual_id", String(id));
    }
  }

  function handleEliminarSeleccionada() {
    if (!selectedId) {
      toast.error("Selecciona una planeación para eliminar.");
      return;
    }
    const pl = planeaciones.find((p) => p.id === selectedId);
    setConfirmDelete({
      id: selectedId,
      nombre: pl?.nombre_planeacion || `Planeación #${selectedId}`,
    });
  }

  async function confirmarEliminarPlaneacion() {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/planeaciones/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo eliminar la planeación");

      toast.success(`Planeación eliminada: "${confirmDelete.nombre}"`);

      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("planeacion_actual_id");
        if (stored === String(confirmDelete.id)) {
          window.localStorage.removeItem("planeacion_actual_id");
        }
      }

      setSelectedId(null);
      setSelectedReadOnly(false);
      setInitialNombrePlaneacion(undefined);
      setFormKey((k) => k + 1);

      await loadPlaneaciones();
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar la planeación");
    } finally {
      setConfirmDelete(null);
    }
  }

  const registrosLabel = useMemo(() => {
    const n = planeaciones.length;
    return `${n} registro${n === 1 ? "" : "s"}`;
  }, [planeaciones.length]);

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Planeación didáctica</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleNuevaPlaneacion}
            className="
              h-10 px-4 rounded-xl
              shadow-sm hover:shadow-md
              transition-all duration-200
              hover:-translate-y-[1px]
              active:translate-y-0
              focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
            "
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva planeación
          </Button>

          <Button
            variant="destructive"
            onClick={handleEliminarSeleccionada}
            disabled={!selectedId}
            className="
              h-10 px-4 rounded-xl
              shadow-sm hover:shadow-md
              transition-all duration-200
              hover:-translate-y-[1px]
              active:translate-y-0
              disabled:opacity-50 disabled:shadow-none disabled:translate-y-0
              focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:ring-offset-2
            "
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className="flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch gap-4 h-[calc(100vh-136px)] min-h-0 overflow-hidden min-w-0">
        {/* LISTA */}
        <Card className="p-4 flex flex-col gap-3 h-full min-h-0 overflow-hidden min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <h2 className="font-semibold text-sm md:text-base">
              Mis planeaciones
            </h2>
            <span className="text-xs text-muted-foreground shrink-0">
              {registrosLabel}
            </span>
          </div>

          <Separator />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <ScrollArea className="flex-1 min-h-0 h-full">
            <div className="space-y-3 pr-2">
              {/* Preview de nueva planeación SOLO si todavía no existe en BD */}
              {initialNombrePlaneacion && !selectedId && (
                <div className="w-full rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col">
                      <span className="font-medium">Nueva planeación</span>
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
                        className={`text-[10px] font-medium border ${getStatusUI(
                          "borrador"
                        ).className}`}
                      >
                        Borrador
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {planeaciones.length === 0 &&
                !loading &&
                !initialNombrePlaneacion && (
                  <p className="text-xs text-muted-foreground">
                    Aún no tienes planeaciones. Crea una con{" "}
                    <span className="font-medium">“Nueva planeación”</span>.
                  </p>
              )}


              {planeaciones.map((p) => {
                const isSelected = p.id === selectedId;
                const ui = getStatusUI(p.status);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleEditar(p.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                      p.status === "finalizada"
                        ? isSelected
                          ? "border-primary bg-primary/5 opacity-80"
                          : "opacity-70 hover:bg-muted/60"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium leading-snug break-words line-clamp-2">
                          {p.nombre_planeacion || `Planeación #${p.id}`}
                        </span>

                        <span className="text-[11px] text-muted-foreground">
                          Creada: {formatDate(p.created_at)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Última actualización: {formatDate(p.updated_at)}
                        </span>
                      </div>

                      <div className="pt-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium border ${ui.className}`}
                        >
                          {ui.label}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* FORM */}
        <Card className="w-full lg:flex-1 p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
          <PlaneacionForm
            key={formKey}
            token={token}
            planeacionId={selectedId}
            initialNombrePlaneacion={initialNombrePlaneacion}
            readOnly={selectedReadOnly}
            onFinalizar={loadPlaneaciones}
            onSaved={loadPlaneaciones}
            onCreated={(newId) => {
              // cuando ya existe en BD: oculta el preview "(Sin guardar aún)"
              setInitialNombrePlaneacion(undefined);

              // selecciona la recien creada
              setSelectedId(newId);
              setSelectedReadOnly(false);

              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  "planeacion_actual_id",
                  String(newId)
                );
              }

              // refresca lista
              loadPlaneaciones();

              // opcional: re-mount para “estado limpio”
              setFormKey((k) => k + 1);
            }}
          />
        </Card>
      </div>

      {/* ===== DIALOG NUEVA ===== */}
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
                Escribe el nombre con el que deseas identificar esta planeación
                didáctica.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">
                Nombre de la planeación
              </label>
              <Input
                autoFocus
                placeholder="Ej. Bases de Datos 2CM3"
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

      {/* ===== ALERT ELIMINAR ===== */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar planeación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar{" "}
              <strong>{confirmDelete?.nombre}</strong>?<br />
              <span className="text-destructive">
                Esta acción no se puede deshacer.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmarEliminarPlaneacion}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
