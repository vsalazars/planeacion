import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PlaneacionesDashboard from "@/components/planeacion/PlaneacionesDashboard";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, University, User2 } from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";

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
                src="/logo.png"
                alt="Instituto Politécnico Nacional"
                className="h-13 w-auto rounded-md bg-background object-contain"
              />

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-semibold leading-tight">
                    Instituto Politécnico Nacional
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Dirección de Educación Superior
                </p>
              </div>
            </div>

            {/* Derecha: botón logout + avatar con panel desplegable */}
            <div className="flex items-center gap-3">
              {/* Botón solo ícono para cerrar sesión (CLIENT) */}
              <LogoutButton
                action={logoutAction}
                title="Cerrar sesión"
                className="rounded-full h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center"
              >
                <LogOut className="h-4 w-4" />
              </LogoutButton>

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
                        className="
                          w-fit mt-0.5 px-2 py-0 text-[10px]
                          border border-[#7A003C]/30
                          bg-[#7A003C]/10 text-[#7A003C]
                          font-medium
                        "
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
                    {/* Botón “Cerrar sesión” dentro del panel (CLIENT) */}
                    <LogoutButton
                      action={logoutAction}
                      title="Cerrar sesión"
                      className="
                        w-full h-9
                        rounded-full
                        text-xs font-medium
                        justify-center gap-2
                        border border-[#7A003C]/20
                        bg-transparent text-[#7A003C]
                        hover:bg-[#7A003C]/10
                        transition-colors
                        inline-flex items-center
                      "
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Cerrar sesión
                    </LogoutButton>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 min-h-0 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden overflow-x-hidden">
        <PlaneacionesDashboard token={token} />
      </div>
    </main>
  );
}
