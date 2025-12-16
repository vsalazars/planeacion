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
import {
  LogIn,
  Mail,
  Lock,
  UserPlus,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// ====== ENV / URLS ======
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");
const DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_PATH || "/planeaciones";

const URLS = {
  unidades: `${API_BASE}/unidades`,
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/login`,
  google: `${API_BASE}/auth/google`,
};

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

type Props = {
  buttonLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonSize?: React.ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
};

export default function AuthPanel({
  buttonLabel = "Iniciar",
  buttonVariant,
  buttonSize = "lg",
  buttonClassName = "px-6",
}: Props) {
  const router = useRouter();

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPass, setShowLoginPass] = useState(false);

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
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegPass2, setShowRegPass2] = useState(false);

  // Unidades
  const [units, setUnits] = useState<Unidad[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Google
  const [googleBusy, setGoogleBusy] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string>("");
  const [openGoogleUnit, setOpenGoogleUnit] = useState(false);
  const [googleUnitId, setGoogleUnitId] = useState<string>("");

  // Sheet
  const [openSheet, setOpenSheet] = useState(false);

  // ✅ Script listo
  const [googleReady, setGoogleReady] = useState(false);

  // GIS guards
  const gisInitializedRef = useRef(false);

  // ✅ Tamaño unificado (Enter + Google)
  const BTN_W = 360; // px
  const BTN_H = "h-12";
  const BTN_R = "rounded-full";

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
    () => (googleUnitId ? units.find((u) => String(u.id) === googleUnitId) : undefined),
    [googleUnitId, units]
  );

  function clearPlaneacionLocalContext() {
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
        const maybe = await safeJson(res);
        throw new Error(
          maybe?.error ||
            maybe?.msg ||
            maybe?.detail ||
            "No se pudo cargar el catálogo de unidades"
        );
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
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass }),
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
      if (!token) throw new Error("Respuesta inválida (sin token).");

      const ses = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, maxAge: 3600 }),
      });
      if (!ses.ok) throw new Error("No se pudo establecer la sesión.");

      if (data.user) localStorage.setItem("auth_user", JSON.stringify(data.user));
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

    if (regEmail.trim().toLowerCase() !== regEmail2.trim().toLowerCase())
      return setRegError("Los correos no coinciden");
    if (regPass !== regPass2) return setRegError("Las contraseñas no coinciden");
    if (!regSelectedUnitId) return setRegError("Selecciona una unidad académica");

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

  // ---- Google ----
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

        if (res.status === 400 && typeof msg === "string" && msg.toLowerCase().includes("unidad_id")) {
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

  function renderGoogleButtonWithRetry(tries = 0) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (!window.google?.accounts?.id) return;

    const el = document.getElementById("googleBtn");
    if (!el) {
      if (tries < 12) setTimeout(() => renderGoogleButtonWithRetry(tries + 1), 50);
      return;
    }

    if (!gisInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          const idTok = resp?.credential;
          if (!idTok) return toast.error("No se recibió credencial de Google.");
          exchangeGoogleTokenForJWT(idTok);
        },
        use_fedcm_for_prompt: false,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      gisInitializedRef.current = true;
    }

    const alreadyRendered = !!el.firstChild;
    if (!alreadyRendered) {
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        text: "continue_with",
        width: BTN_W,
        logo_alignment: "left",
      });
      (el.firstElementChild as HTMLElement | null)?.setAttribute("style", "width:100%;");
    }

    if (!el.firstChild && tries < 12) {
      setTimeout(() => renderGoogleButtonWithRetry(tries + 1), 80);
    }
  }

  useEffect(() => {
    if (!openSheet) return;
    if (!googleReady) return;
    const t1 = setTimeout(() => renderGoogleButtonWithRetry(0), 0);
    const t2 = setTimeout(() => renderGoogleButtonWithRetry(0), 80);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [openSheet, googleReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setGoogleReady(true);
          if (openSheet) {
            try {
              renderGoogleButtonWithRetry(0);
            } catch {}
          }
        }}
      />

      <Sheet
        open={openSheet}
        onOpenChange={(open) => {
          setOpenSheet(open);
          if (open) setLoginError(null);
        }}
      >
        <SheetTrigger asChild>
          <Button type="button" size={buttonSize} variant={buttonVariant} className={buttonClassName}>
            <LogIn className="mr-2 h-5 w-5" />
            {buttonLabel}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:max-w-md px-0 shadow-2xl ring-1 ring-border/60 bg-gradient-to-b from-background to-background/80 backdrop-blur"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-6 pt-6">
              <SheetHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <SheetTitle className="text-2xl tracking-tight font-semibold text-[#7A003C]">
                      Acceso a la plataforma
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-4">
                <Separator />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6">
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Correo</Label>
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
                      className={`pl-9 ${BTN_H} ${BTN_R}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      required
                      className={`pl-9 pr-11 ${BTN_H} ${BTN_R}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                      onClick={() => setShowLoginPass((v) => !v)}
                      aria-label={showLoginPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showLoginPass ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {loginError}
                  </div>
                )}

                {/* ===== Acciones discretas en la misma fila ===== */}
                <div className="mx-auto w-full" style={{ maxWidth: BTN_W }}>
                  <div className="flex items-center gap-3">
                    {/* Entrar (discreto) */}
                    <Button
                      type="submit"
                      className="flex-1 h-10 rounded-full text-sm shadow-sm"
                      disabled={loggingIn || googleBusy}
                    >
                      {loggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando…
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Entrar
                        </>
                      )}
                    </Button>

                    {/* Crear cuenta (discreto guinda) */}
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
                          disabled={loggingIn || googleBusy}
                          className="
                            flex-1 h-10 rounded-full text-sm shadow-sm
                            border border-[#7A003C]/30
                            bg-[#7A003C]/10 text-[#7A003C]
                            hover:bg-[#7A003C]/15
                          "
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Crear cuenta
                        </Button>
                      </DialogTrigger>

                      {/* ✅ MODAL más ancho */}
                      <DialogContent className="w-[min(96vw,56rem)] sm:max-w-[56rem] max-h-[90vh] overflow-hidden">
                        <DialogHeader className="space-y-1">
                          <DialogTitle>Crear cuenta</DialogTitle>
                          <DialogDescription>Completa los campos para registrarte.</DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[calc(90vh-10rem)] overflow-y-auto pr-1">
                          <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            {/* Unidad académica */}
                            <div className="space-y-2">
                              <Label className="text-sm">Unidad académica</Label>

                              <Select
                                value={regSelectedUnitId}
                                onValueChange={(v) => setRegSelectedUnitId(v)}
                                disabled={unitsLoading || !!unitsError}
                              >
                                <SelectTrigger className="w-full items-start h-auto py-2 pr-8">
                                  <div className="min-w-0 flex-1">
                                    {selectedRegUnit ? (
                                      <span className="block text-sm leading-snug whitespace-normal break-words">
                                        {displayUnitLabel(selectedRegUnit)}
                                      </span>
                                    ) : (
                                      <span className="block text-sm text-muted-foreground">
                                        {unitsLoading ? "Cargando..." : "Selecciona una unidad académica"}
                                      </span>
                                    )}
                                  </div>
                                </SelectTrigger>

                                <SelectContent className="max-h-72 overflow-y-auto max-w-[min(96vw,56rem)]">
                                  {units.map((u) => (
                                    <SelectItem
                                      key={u.id}
                                      value={String(u.id)}
                                      title={displayUnitLabel(u)}
                                      className="py-2 leading-snug whitespace-normal break-words"
                                    >
                                      <span className="block whitespace-normal break-words">
                                        {displayUnitLabel(u)}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {unitsError && <p className="text-xs text-destructive">{unitsError}</p>}
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
                                <Label htmlFor="reg-email">Correo institucional</Label>
                                <Input
                                  id="reg-email"
                                  type="email"
                                  placeholder="tucorreo@ipn.mx"
                                  autoComplete="email"
                                  value={regEmail}
                                  onChange={(e) => setRegEmail(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="reg-email2">Confirmar correo</Label>
                                <Input
                                  id="reg-email2"
                                  type="email"
                                  placeholder="Repite el correo"
                                  autoComplete="email"
                                  value={regEmail2}
                                  onChange={(e) => setRegEmail2(e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="reg-password">Contraseña</Label>
                                <div className="relative">
                                  <Input
                                    id="reg-password"
                                    type={showRegPass ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    value={regPass}
                                    onChange={(e) => setRegPass(e.target.value)}
                                    required
                                    className="pr-11"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full"
                                    onClick={() => setShowRegPass((v) => !v)}
                                    aria-label={showRegPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showRegPass ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="reg-password2">Confirmar contraseña</Label>
                                <div className="relative">
                                  <Input
                                    id="reg-password2"
                                    type={showRegPass2 ? "text" : "password"}
                                    placeholder="Repite la contraseña"
                                    autoComplete="new-password"
                                    value={regPass2}
                                    onChange={(e) => setRegPass2(e.target.value)}
                                    required
                                    className="pr-11"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full"
                                    onClick={() => setShowRegPass2((v) => !v)}
                                    aria-label={showRegPass2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showRegPass2 ? (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {regError && (
                              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {regError}
                              </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                              <Button type="button" variant="outline" onClick={() => setOpenRegister(false)}>
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
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Separador Google */}
                  <div className="mt-4 flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">o</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* Google */}
                  <div
                    className={`mt-3 w-full ${BTN_R} overflow-hidden ${googleBusy ? "opacity-50 pointer-events-none" : ""}`}
                    style={{ minHeight: 44 }}
                  >
                    <div id="googleBtn" className="w-full flex justify-center" />
                  </div>

                  {googleBusy && (
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      Procesando Google…
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2">
                  {/* ===== Recuperar contraseña (PENDIENTE) ===== */}
                  {/*
                  <div className="flex justify-center text-sm">
                    <Link
                      href="/auth/recover"
                      className="text-muted-foreground hover:text-foreground hover:underline inline-flex items-center"
                    >
                      <KeyRound className="mr-1 h-4 w-4" />
                      Recuperar contraseña
                    </Link>
                  </div>
                  */}

                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    Al continuar, se creará una sesión segura para mantener tu acceso.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* MODAL unidad Google */}
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
        <DialogContent className="w-[min(96vw,52rem)] sm:max-w-[52rem] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Selecciona tu unidad académica</DialogTitle>
            <DialogDescription>Es necesaria para completar tu registro con Google.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(85vh-10rem)] overflow-y-auto pr-1 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Unidad académica</Label>

              <Select
                value={googleUnitId}
                onValueChange={(v) => setGoogleUnitId(v)}
                disabled={unitsLoading || !!unitsError}
              >
                <SelectTrigger className="w-full items-start h-auto py-2 pr-8">
                  <div className="min-w-0 flex-1">
                    {selectedGoogleUnit ? (
                      <span className="block text-sm leading-snug whitespace-normal break-words">
                        {displayUnitLabel(selectedGoogleUnit)}
                      </span>
                    ) : (
                      <span className="block text-sm text-muted-foreground">
                        {unitsLoading ? "Cargando..." : "Selecciona una unidad académica"}
                      </span>
                    )}
                  </div>
                </SelectTrigger>

                <SelectContent className="max-h-72 overflow-y-auto max-w-[min(96vw,52rem)]">
                  {units.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={String(u.id)}
                      title={displayUnitLabel(u)}
                      className="py-2 leading-snug whitespace-normal break-words"
                    >
                      <span className="block whitespace-normal break-words">{displayUnitLabel(u)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {unitsError && <p className="text-xs text-destructive">{unitsError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpenGoogleUnit(false)} disabled={googleBusy}>
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
    </>
  );
}
