import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlaneacionForm from "@/components/planeacion/PlaneacionForm";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, University, User2 } from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

// Server Action logout (mejor declararla fuera del componente)
export async function logoutAction() {
  "use server";
  const store = await cookies();
  store.delete("auth_token");
  redirect("/");
}

export default async function DashboardPlaneacionPage() {
  // --- protección por cookie ---
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/?reason=auth");

  // /me (con token)
  const meRes = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!meRes.ok) {
    redirect("/?reason=auth");
  }

  const user = await meRes.json();

  // Unidad académica
  let unidad:
    | { id: number; nombre: string; abreviatura?: string | null }
    | null = null;

  try {
    const uaRes = await fetch(`${API_BASE}/unidades/${user.unidad_id}`, {
      cache: "no-store",
    });
    if (uaRes.ok) {
      unidad = await uaRes.json();
    }
  } catch {
    unidad = null;
  }

  // Iniciales del avatar
  const iniciales =
    typeof user?.nombre_completo === "string"
      ? user.nombre_completo
          .split(" ")
          .filter(Boolean)
          .map((p: string) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "US";

  // Texto completo de la UA
  const unidadTexto = unidad?.nombre
    ? unidad?.abreviatura
      ? `${unidad.nombre} (${unidad.abreviatura})`
      : unidad.nombre
    : "Unidad Académica";

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Barra superior */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Fila 1 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            {/* Logo institucional */}
            <div className="flex items-center">
              <img
                src="/logo.jpg"
                alt="Instituto Politécnico Nacional"
                className="h-18 w-auto"
              />
            </div>

            {/* Usuario + acciones */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
                <span className="flex items-center gap-1 text-sm font-medium">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  {user?.nombre_completo}
                </span>
              </div>

              <Separator
                orientation="vertical"
                className="h-6 hidden sm:block"
              />

              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>

          {/* Fila 2: Unidad académica */}
          <div className="rounded-md border bg-muted/60 px-3 py-2 text-sm">
            <div className="flex items-start gap-2">
              <University className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="whitespace-pre-wrap break-words">
                {unidadTexto}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PlaneacionForm token={token} />
      </div>
    </main>
  );
}
