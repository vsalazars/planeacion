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

export default function PlaneacionesDashboard({ token }: { token: string }) {
  const router = useRouter();

  const [planeaciones, setPlaneaciones] = useState<PlaneacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedReadOnly, setSelectedReadOnly] = useState(false);

  const [formKey, setFormKey] = useState(0);
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
      if (!res.ok)
        throw new Error(
          `No se pudieron cargar las planeaciones (${res.status})`
        );

      const data = await res.json();
      setPlaneaciones(Array.isArray(data?.items) ? data.items : data);
    } catch (err: any) {
      setError(err?.message);
      toast.error(err?.message || "Error cargando planeaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaneaciones();
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

    localStorage.removeItem("planeacion_actual_id");

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

    localStorage.setItem("planeacion_actual_id", String(id));
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
      const res = await fetch(
        `${API_BASE}/planeaciones/${confirmDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("No se pudo eliminar la planeación");

      toast.success(`Planeación eliminada: "${confirmDelete.nombre}"`);

      localStorage.removeItem("planeacion_actual_id");

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

  function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

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

            {/* Eliminar (destructive pro) */}
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
      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-136px)]">
        <Card className="p-4 flex flex-col overflow-hidden">
          <h2 className="font-semibold mb-2">Mis planeaciones</h2>
          <Separator />
          <ScrollArea className="flex-1 mt-3 pr-2">
            <div className="space-y-3">
              {planeaciones.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleEditar(p.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${
                    p.id === selectedId
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium line-clamp-2">
                    {p.nombre_planeacion}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Creada: {formatDate(p.created_at)}
                  </div>
                  <Badge className="mt-1" variant="outline">
                    {p.status || "borrador"}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4 overflow-hidden">
          <PlaneacionForm
            key={formKey}
            token={token}
            planeacionId={selectedId}
            initialNombrePlaneacion={initialNombrePlaneacion}
            readOnly={selectedReadOnly}
            onFinalizar={loadPlaneaciones}
          />
        </Card>
      </div>

      {/* ===== DIALOG NUEVA ===== */}
      <Dialog open={showNuevaDialog} onOpenChange={setShowNuevaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva planeación</DialogTitle>
            <DialogDescription>
              Escribe el nombre de la planeación.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarNuevaPlaneacion}>Crear</Button>
          </DialogFooter>
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
