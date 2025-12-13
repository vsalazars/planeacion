"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
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
import { LogIn, Mail, Lock, UserPlus, KeyRound, Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

// ====== ENV / URLS ======
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(
  /\/$/,
  ""
);

const DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/planeaciones";

const URLS = {
  unidades: `${API_BASE}/unidades`,
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/login`,
  google: `${API_BASE}/auth/google`,
};

// ====== Tipos ======
type Unidad = {
  id: number;
  nombre: string;
  abreviatura?: string | null;
};

declare global {
  interface Window {
    google?: any;
  }
}

export default function Home() {
  const router = useRouter();

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
  const [regSelectedUnitId, setRegSelectedUnitId] = useState<string>("");

  // Unidades (catálogo)
  const [units, setUnits] = useState<Unidad[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Google (flujo)
  const [googleBusy, setGoogleBusy] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string>("");
  const [openGoogleUnit, setOpenGoogleUnit] = useState(false);
  const [googleUnitId, setGoogleUnitId] = useState<string>("");

  // Sheet (para re-render seguro del botón)
  const [openSheet, setOpenSheet] = useState(false);

  // Control de inicialización GIS para evitar dobles renders
  const gisInitializedRef = useRef(false);
  const gisRenderedRef = useRef(false);

  const displayUnitLabel = (u: Unidad) =>
    u.abreviatura ? `${u.nombre} (${u.abreviatura})` : u.nombre;

  const selectedRegUnit = useMemo(
    () =>
      regSelectedUnitId
        ? units.find((u) => String(u.id) === regSelectedUnitId)
        : undefined,
    [regSelectedUnitId, units]
  );

  const selectedGoogleUnit = useMemo(
    () =>
      googleUnitId ? units.find((u) => String(u.id) === googleUnitId) : undefined,
    [googleUnitId, units]
  );

  function clearPlaneacionLocalContext() {
    // ✅ evita 404 por planeacion_actual_id de otro usuario
    try {
      localStorage.removeItem("planeacion_actual_id");
    } catch {}
  }

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadUnitsOnce() {
    if (unitsLoading || units.length > 0) return;
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
      const items: Unidad[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : [];

      setUnits(items);
    } catch (err: any) {
      setUnitsError(err?.message ?? "Error cargando unidades académicas");
    } finally {
      setUnitsLoading(false);
    }
  }

  // Cargar unidades cuando se abra registro o el modal de unidad para Google
  useEffect(() => {
    if (openRegister || openGoogleUnit) loadUnitsOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRegister, openGoogleUnit]);

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
            (Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail)) ||
          (res.status === 401
            ? "Credenciales inválidas"
            : `No se pudo iniciar sesión (${res.status})`);
        throw new Error(msg);
      }

      const data = await res.json();
      const token = data.access_token || data.token || data?.accessToken;
      if (!token) throw new Error("Respuesta de autenticación inválida (sin token).");

      const ses = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, maxAge: 3600 }),
      });
      if (!ses.ok) throw new Error("No se pudo establecer la sesión.");

      if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user));

      // ✅ clave: limpia contexto anterior (evita 404 en panel con otro usuario)
      clearPlaneacionLocalContext();

      toast.success("¡Bienvenido! Redirigiendo al panel…");

      const params = new URLSearchParams(window.location.search);
      let next = params.get("next");
      if (!next || next.startsWith("/dashboard-planeacion")) next = DASHBOARD_PATH;
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
    if (!regSelectedUnitId) {
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
          unidad_id: Number(regSelectedUnitId),
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        const msg =
          data?.error ||
          data?.msg ||
          (data?.detail &&
            (Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail)) ||
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
      setRegSelectedUnitId("");
      setRegError(null);
    } catch (err: any) {
      setRegError(err?.message ?? "Error al registrar usuario");
    } finally {
      setRegistering(false);
    }
  }

  // ---- Google login: primero intentamos SIN unidad, si backend pide unidad, abrimos modal ----
  async function exchangeGoogleTokenForJWT(idToken: string, unidadID?: number) {
    setGoogleBusy(true);
    setLoginError(null);

    try {
      const res = await fetch(URLS.google, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          unidadID ? { id_token: idToken, unidad_id: unidadID } : { id_token: idToken }
        ),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = data?.error || data?.msg || `No se pudo iniciar con Google (${res.status})`;

        // Si el backend exige unidad_id para usuario nuevo
        if (
          res.status === 400 &&
          typeof msg === "string" &&
          msg.toLowerCase().includes("unidad_id")
        ) {
          setPendingGoogleToken(idToken);
          setGoogleUnitId("");
          setOpenGoogleUnit(true);
          return;
        }

        throw new Error(msg);
      }

      const token = data?.access_token || data?.token || data?.accessToken;
      if (!token) throw new Error("Respuesta inválida (sin token).");

      const ses = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, maxAge: 3600 }),
      });
      if (!ses.ok) throw new Error("No se pudo establecer la sesión.");

      if (data?.user) localStorage.setItem("auth_user", JSON.stringify(data.user));

      // ✅ clave: limpia contexto anterior (evita 404 en panel con otro usuario)
      clearPlaneacionLocalContext();

      toast.success("¡Bienvenido! Redirigiendo al panel…");

      const params = new URLSearchParams(window.location.search);
      let next = params.get("next");
      if (!next || next.startsWith("/dashboard-planeacion")) next = DASHBOARD_PATH;
      router.push(next);
    } catch (err: any) {
      setLoginError(err?.message ?? "Error al iniciar con Google");
    } finally {
      setGoogleBusy(false);
    }
  }

  // Render del botón clásico de Google (GIS)
  function renderGoogleButton(force = false) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (!window.google?.accounts?.id) return;

    // Evita doble inicialización/render (StrictMode en dev puede disparar 2 veces)
    if (!gisInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          const idTok = resp?.credential;
          if (!idTok) {
            toast.error("No se recibió credencial de Google.");
            return;
          }
          exchangeGoogleTokenForJWT(idTok);
        },
        // reduce errores FedCM
        use_fedcm_for_prompt: false,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      gisInitializedRef.current = true;
    }

    const el = document.getElementById("googleBtn");
    if (!el) return;

    if (gisRenderedRef.current && !force) return;

    el.innerHTML = "";
    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
      width: 320,
      logo_alignment: "left",
    });

    gisRenderedRef.current = true;
  }

  // Render automático cuando el Sheet se abre (cuando el div existe)
  useEffect(() => {
    if (!openSheet) return;
    // pequeño delay para asegurar mount del contenido del Sheet
    const t = setTimeout(() => {
      try {
        renderGoogleButton(true);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSheet]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // si el sheet ya está abierto al cargar, renderizamos
          try {
            if (openSheet) renderGoogleButton(true);
          } catch {}
        }}
      />

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
              Planeación didáctica centralizada y alineada al modelo institucional
            </h1>
            <p className="mt-4 text-muted-foreground max-w-prose">
              Diseña, organiza y da seguimiento a planeaciones con los cinco
              apartados del instructivo: datos generales, orientación, unidades
              temáticas, evaluación y bibliografía.
            </p>

            <div className="mt-8">
              <Sheet
                open={openSheet}
                onOpenChange={(open) => {
                  setOpenSheet(open);
                  if (open) {
                    // al abrir: limpia errores, y re-render de Google en useEffect(openSheet)
                    setLoginError(null);
                  }
                }}
              >
                <SheetTrigger asChild>
                  <Button type="button" size="lg" className="px-6">
                    <LogIn className="mr-2 h-5 w-5" />
                    Iniciar
                  </Button>
                </SheetTrigger>

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
                              onChange={(e) => setLoginEmail(e.target.value)}
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
                              onChange={(e) => setLoginPass(e.target.value)}
                              required
                              className="pl-9"
                            />
                          </div>
                        </div>

                        {loginError && (
                          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {loginError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11"
                          disabled={loggingIn || googleBusy}
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

                        {/* Google clásico */}
                        <div className="space-y-2">
                          <div
                            id="googleBtn"
                            className={`flex justify-center ${
                              googleBusy ? "opacity-50 pointer-events-none" : ""
                            }`}
                          />
                          {googleBusy && (
                            <div className="text-xs text-muted-foreground text-center">
                              Procesando Google…
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <Link
                            href="/auth/recover"
                            className="text-muted-foreground hover:underline inline-flex items-center"
                          >
                            <KeyRound className="mr-1 h-4 w-4" />
                            ¿Olvidaste tu contraseña?
                          </Link>

                          <Dialog
                            open={openRegister}
                            onOpenChange={(v) => {
                              setOpenRegister(v);
                              setRegError(null);
                              setLoginError(null);
                              if (v) loadUnitsOnce();
                            }}
                          >
                            <DialogTrigger asChild>
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
                                {/* Unidad académica (registro) */}
                                <div className="space-y-2 min-w-0">
                                  <Label className="text-sm">
                                    Unidad académica
                                  </Label>
                                  <Select
                                    value={regSelectedUnitId}
                                    onValueChange={(v) =>
                                      setRegSelectedUnitId(v)
                                    }
                                    disabled={unitsLoading || !!unitsError}
                                  >
                                    <SelectTrigger
                                      className="w-full max-w-full min-w-0 items-start h-auto py-2 pr-8"
                                      title={
                                        selectedRegUnit
                                          ? displayUnitLabel(selectedRegUnit)
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

                                <div className="space-y-2">
                                  <Input
                                    id="reg-name"
                                    type="text"
                                    placeholder="Nombre y apellidos"
                                    autoComplete="name"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                  />
                                </div>

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

                                {regError && (
                                  <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {regError}
                                  </div>
                                )}

                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenRegister(false)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button type="submit" disabled={registering}>
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

      {/* MODAL: elegir unidad DESPUÉS de Google (solo si backend la pide) */}
      <Dialog
        open={openGoogleUnit}
        onOpenChange={(v) => {
          setOpenGoogleUnit(v);
          if (!v) {
            setPendingGoogleToken("");
            setGoogleUnitId("");
          } else {
            loadUnitsOnce();
          }
        }}
      >
        <DialogContent className="w-[min(96vw,42rem)] sm:max-w-[42rem]">
          <DialogHeader>
            <DialogTitle>Selecciona tu unidad académica</DialogTitle>
            <DialogDescription>
              Es necesaria para completar tu registro con Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-sm">Unidad académica</Label>
            <Select
              value={googleUnitId}
              onValueChange={(v) => setGoogleUnitId(v)}
              disabled={unitsLoading || !!unitsError}
            >
              <SelectTrigger
                className="w-full"
                title={
                  selectedGoogleUnit
                    ? displayUnitLabel(selectedGoogleUnit)
                    : undefined
                }
              >
                <SelectValue
                  placeholder={
                    unitsLoading ? "Cargando..." : "Selecciona una unidad académica"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {units.map((u) => (
                  <SelectItem
                    key={u.id}
                    value={String(u.id)}
                    title={displayUnitLabel(u)}
                  >
                    {displayUnitLabel(u)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {unitsError && <p className="text-xs text-destructive">{unitsError}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenGoogleUnit(false)}
              disabled={googleBusy}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={!googleUnitId || !pendingGoogleToken || googleBusy}
              onClick={() => {
                if (!googleUnitId || !pendingGoogleToken) return;
                setOpenGoogleUnit(false);
                exchangeGoogleTokenForJWT(pendingGoogleToken, Number(googleUnitId));
                setPendingGoogleToken("");
                setGoogleUnitId("");
              }}
            >
              {googleBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
