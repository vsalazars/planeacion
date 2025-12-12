import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlaneacionesDashboard from "@/components/planeacion/PlaneacionesDashboard";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, University, LayoutDashboard, User2 } from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

// Server Action logout
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
    <main className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Barra superior */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Fila única: branding izquierda / usuario + logout derecha */}
          <div className="flex items-center justify-between gap-4">
            {/* Izquierda: logo + sistema */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Instituto Politécnico Nacional"
                className="h-13 w-auto rounded-md bg-background object-contain"
              />


              <div className="flex flex-col gap-0.5">
                
                <div className="flex items-center gap-2">
                  
                  <h1 className="text-base sm:text-lg font-semibold leading-tight">
                    Sistema de Planeación Didáctica
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Planeaciones, unidades temáticas y evaluación en un solo lugar.
                </p>
              </div>
            </div>

            {/* Derecha: botón logout + avatar con panel desplegable */}
            <div className="flex items-center gap-3">
              {/* Botón solo ícono para cerrar sesión */}
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>

              {/* Avatar con panel de información del usuario */}
              <details className="relative group">
                <summary className="list-none flex items-center cursor-pointer">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="text-[11px] font-semibold">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>
                </summary>

                <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-popover shadow-lg p-3 z-50">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="text-[11px] font-semibold">
                        {iniciales}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user?.nombre_completo}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="w-fit text-[10px] px-2 py-0 mt-0.5"
                      >
                        Docente
                      </Badge>
                      <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                        <University className="h-3.5 w-3.5 mt-0.5 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {unidadTexto}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <form action={logoutAction}>
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </form>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido: sin scroll global, solo interno en PlaneacionesDashboard */}
      <div className="flex-1 min-h-0 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden overflow-x-hidden">
        <PlaneacionesDashboard token={token} />
      </div>

    </main>
  );
}
