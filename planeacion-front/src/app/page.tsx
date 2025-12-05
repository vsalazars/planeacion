"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LogIn,
  Mail,
  Lock,
  UserPlus,
  KeyRound,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

// ====== ENV / URLS ======
// Por defecto: backend Go en http://localhost:8080/api
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/dashboard-planeacion";

const URLS = {
  unidades: `${API_BASE}/unidades`,
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/login`,
};

// ====== Tipos ======
type Unidad = {
  id: number;
  nombre: string;
  abreviatura?: string | null;
};

export default function Home() {
  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registro
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regEmail2, setRegEmail2] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [registering, setRegistering] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Unidades
  const [units, setUnits] = useState<Unidad[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const router = useRouter();

  const displayUnitLabel = (u: Unidad) =>
    u.abreviatura ? `${u.nombre} (${u.abreviatura})` : u.nombre;

  const selectedUnit = selectedUnitId
    ? units.find((u) => String(u.id) === selectedUnitId)
    : undefined;

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // Cargar unidades al abrir modal de registro
  useEffect(() => {
    let ignore = false;

    async function loadUnits() {
      try {
        setUnitsError(null);
        setUnitsLoading(true);

        const res = await fetch(URLS.unidades, { cache: "no-store" });

        if (!res.ok) {
          const maybeJSON = await safeJson(res);
          const msg =
            maybeJSON?.error ||
            maybeJSON?.msg ||
            maybeJSON?.detail ||
            "No se pudo cargar el catálogo de unidades";
          throw new Error(msg);
        }

        const payload = await res.json();

        // Backend Go devuelve { items: Unidad[], total }
        const items: Unidad[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : [];

        if (!ignore) setUnits(items);
      } catch (err: any) {
        if (!ignore)
          setUnitsError(
            err?.message ?? "Error cargando unidades académicas"
          );
      } finally {
        if (!ignore) setUnitsLoading(false);
      }
    }

    if (openRegister && units.length === 0 && !unitsLoading) loadUnits();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRegister]);

  // ---- Login ----
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch(URLS.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPass,
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        const msg =
          data?.error ||
          data?.msg ||
          (data?.detail &&
            (Array.isArray(data.detail)
              ? data.detail[0]?.msg
              : data.detail)) ||
          (res.status === 401
            ? "Credenciales inválidas"
            : `No se pudo iniciar sesión (${res.status})`);
        throw new Error(msg);
      }

      const data = await res.json();
      const token = data.access_token || data.token || data?.accessToken;
      if (!token)
        throw new Error("Respuesta de autenticación inválida (sin token).");

      // Guarda cookie HttpOnly en Next (no accesible desde JS)
      const ses = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, maxAge: 3600 }),
      });
      if (!ses.ok) throw new Error("No se pudo establecer la sesión.");

      // (Opcional) guarda user en localStorage para UI
      if (data.user)
        localStorage.setItem("auth_user", JSON.stringify(data.user));

      toast.success("¡Bienvenido! Redirigiendo al panel…");

      // redirige a ?next=... si existe
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || DASHBOARD_PATH;
      router.push(next);
    } catch (err: any) {
      setLoginError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoggingIn(false);
    }
  }

  // ---- Registro ----
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (regEmail.trim().toLowerCase() !== regEmail2.trim().toLowerCase()) {
      setRegError("Los correos no coinciden");
      return;
    }
    if (regPass !== regPass2) {
      setRegError("Las contraseñas no coinciden");
      return;
    }
    if (!selectedUnitId) {
      setRegError("Selecciona una unidad académica");
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(URLS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: regName.trim(),
          email: regEmail.trim(),
          password: regPass,
          unidad_id: Number(selectedUnitId),
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        const msg =
          data?.error ||
          data?.msg ||
          (data?.detail &&
            (Array.isArray(data.detail)
              ? data.detail[0]?.msg
              : data.detail)) ||
          `No se pudo crear la cuenta (${res.status})`;
        throw new Error(msg);
      }

      toast.success("Cuenta creada correctamente. Ya puedes iniciar sesión.");
      setOpenRegister(false);
      setRegName("");
      setRegEmail("");
      setRegEmail2("");
      setRegPass("");
      setRegPass2("");
      setSelectedUnitId("");
      setRegError(null);
    } catch (err: any) {
      setRegError(err?.message ?? "Error al registrar usuario");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* NAV */}
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

      {/* HERO */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="mb-3 inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
              Versión preliminar
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Planeación didáctica centralizada y alineada al modelo
              institucional
            </h1>
            <p className="mt-4 text-muted-foreground max-w-prose">
              Diseña, organiza y da seguimiento a planeaciones con los cinco
              apartados del instructivo: datos generales, orientación, unidades
              temáticas, evaluación y bibliografía.
            </p>

            {/* BOTÓN ÚNICO: INICIAR → abre Sheet con LOGIN */}
            <div className="mt-8">
              <Sheet>
                <SheetTrigger asChild>
                  {/* ⬇️ clave: prevenir submit accidental de forms ancestros */}
                  <Button type="button" size="lg" className="px-6">
                    <LogIn className="mr-2 h-5 w-5" />
                    Iniciar
                  </Button>
                </SheetTrigger>

                {/* Sheet de Login */}
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <div className="flex h-full flex-col">
                    <SheetHeader className="space-y-1 text-center">
                      <SheetTitle className="text-xl">Bienvenido</SheetTitle>
                    </SheetHeader>

                    <div className="mt-6 flex-1">
                      <form
                        onSubmit={handleLoginSubmit}
                        className="mx-auto w-full max-w-sm space-y-6"
                      >
                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm">
                            Correo
                          </Label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="tucorreo@ipn.mx"
                              autoComplete="email"
                              value={loginEmail}
                              onChange={(e) =>
                                setLoginEmail(e.target.value)
                              }
                              required
                              autoFocus
                              className="pl-9"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-sm">
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              value={loginPass}
                              onChange={(e) =>
                                setLoginPass(e.target.value)
                              }
                              required
                              className="pl-9"
                            />
                          </div>
                        </div>

                        {/* Error */}
                        {loginError && (
                          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {loginError}
                          </div>
                        )}

                        {/* Submit */}
                        <Button
                          type="submit"
                          className="w-full h-11"
                          disabled={loggingIn}
                        >
                          {loggingIn ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            "Entrar"
                          )}
                        </Button>

                        {/* Acciones secundarias */}
                        <div className="flex items-center justify-between text-sm">
                          <Link
                            href="/auth/recover"
                            className="text-muted-foreground hover:underline inline-flex items-center"
                          >
                            <KeyRound className="mr-1 h-4 w-4" />
                            ¿Olvidaste tu contraseña?
                          </Link>

                          {/* Modal de registro */}
                          <Dialog
                            open={openRegister}
                            onOpenChange={(v) => {
                              setOpenRegister(v);
                              setRegError(null);
                              setLoginError(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              {/* ⬇️ clave: evitar submit del form de login */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="inline-flex items-center"
                              >
                                <UserPlus className="mr-1 h-4 w-4" />
                                Registrarse
                              </Button>
                            </DialogTrigger>

                            {/* Dialog más ancho para evitar desbordes */}
                            <DialogContent className="w-[min(96vw,44rem)] sm:max-w-[44rem] md:max-w-[48rem]">
                              <DialogHeader className="space-y-1">
                                <DialogTitle>Crear cuenta</DialogTitle>
                                <DialogDescription>
                                  Completa los campos para registrarte.
                                </DialogDescription>
                              </DialogHeader>

                              <form
                                onSubmit={handleRegisterSubmit}
                                className="space-y-4"
                              >
                                {/* Unidad académica */}
                                <div className="space-y-2 min-w-0">
                                  <Select
                                    value={selectedUnitId}
                                    onValueChange={(v) =>
                                      setSelectedUnitId(v)
                                    }
                                    disabled={
                                      unitsLoading || !!unitsError
                                    }
                                  >
                                    <SelectTrigger
                                      className="w-full max-w-full min-w-0 items-start h-auto py-2 pr-8"
                                      title={
                                        selectedUnit
                                          ? displayUnitLabel(
                                              selectedUnit
                                            )
                                          : undefined
                                      }
                                    >
                                      <div className="flex-1 min-w-0">
                                        <SelectValue
                                          placeholder={
                                            unitsLoading
                                              ? "Cargando..."
                                              : "Selecciona una unidad académica"
                                          }
                                          className="whitespace-normal break-words line-clamp-2"
                                        />
                                      </div>
                                    </SelectTrigger>

                                    {/* Dropdown amplio y con scroll */}
                                    <SelectContent className="max-h-72 overflow-y-auto max-w-[min(96vw,40rem)]">
                                      {units.map((u) => (
                                        <SelectItem
                                          key={u.id}
                                          value={String(u.id)}
                                          title={displayUnitLabel(u)}
                                          className="py-2 leading-snug whitespace-normal break-words"
                                        >
                                          {displayUnitLabel(u)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {unitsError && (
                                    <p className="text-xs text-destructive">
                                      {unitsError}
                                    </p>
                                  )}
                                </div>

                                {/* Nombre */}
                                <div className="space-y-2">
                                  <Input
                                    id="reg-name"
                                    type="text"
                                    placeholder="Nombre y apellidos"
                                    autoComplete="name"
                                    value={regName}
                                    onChange={(e) =>
                                      setRegName(e.target.value)
                                    }
                                    required
                                  />
                                </div>

                                {/* Email + Confirmación */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="reg-email">
                                      Correo institucional
                                    </Label>
                                    <Input
                                      id="reg-email"
                                      type="email"
                                      placeholder="tucorreo@ipn.mx"
                                      autoComplete="email"
                                      value={regEmail}
                                      onChange={(e) =>
                                        setRegEmail(e.target.value)
                                      }
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="reg-email2">
                                      Confirmar correo
                                    </Label>
                                    <Input
                                      id="reg-email2"
                                      type="email"
                                      placeholder="Repite el correo"
                                      autoComplete="email"
                                      value={regEmail2}
                                      onChange={(e) =>
                                        setRegEmail2(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                </div>

                                {/* Password + Confirmación */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="reg-password">
                                      Contraseña
                                    </Label>
                                    <Input
                                      id="reg-password"
                                      type="password"
                                      placeholder="Mínimo 8 caracteres"
                                      autoComplete="new-password"
                                      value={regPass}
                                      onChange={(e) =>
                                        setRegPass(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="reg-password2">
                                      Confirmar contraseña
                                    </Label>
                                    <Input
                                      id="reg-password2"
                                      type="password"
                                      placeholder="Repite la contraseña"
                                      autoComplete="new-password"
                                      value={regPass2}
                                      onChange={(e) =>
                                        setRegPass2(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                </div>

                                {/* Error de registro */}
                                {regError && (
                                  <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {regError}
                                  </div>
                                )}

                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      setOpenRegister(false)
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={registering}
                                  >
                                    {registering ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando...
                                      </>
                                    ) : (
                                      "Crear cuenta"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </form>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* columna derecha opcional */}
        </div>
      </section>
    </main>
  );
}
