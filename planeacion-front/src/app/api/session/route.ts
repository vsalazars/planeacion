import { NextResponse } from "next/server";

function pickTokenFromAuthHeader(auth: string | null) {
  if (!auth) return "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const tokenFromBody =
    typeof body?.token === "string" ? body.token.trim() : "";

  const tokenFromHeader = pickTokenFromAuthHeader(
    request.headers.get("authorization")
  );

  const token = tokenFromBody || tokenFromHeader;
  const maxAge =
    typeof body?.maxAge === "number" && body.maxAge > 0 ? body.maxAge : 3600;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "token requerido" },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // Si estás en HTTP (sin TLS), secure=true hace que el navegador NO guarde cookie.
  // Tú hoy estás en IP/HTTP, así que secure debe ser false.
  // Cuando migres a HTTPS, lo cambias a true.
  const isHttps =
    (request.headers.get("x-forwarded-proto") || "").toLowerCase() === "https";

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps, // <- clave detrás de Nginx
    path: "/",
    maxAge,
  });

  return res;
}

export async function DELETE(request: Request) {
  const res = NextResponse.json({ ok: true });

  const isHttps =
    (request.headers.get("x-forwarded-proto") || "").toLowerCase() === "https";

  res.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 0,
  });

  return res;
}
