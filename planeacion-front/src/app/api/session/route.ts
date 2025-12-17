import { NextResponse } from "next/server";

function pickTokenFromAuthHeader(auth: string | null) {
  if (!auth) return "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function isHttpsRequest(request: Request) {
  const xfProto = (request.headers.get("x-forwarded-proto") || "").toLowerCase();
  if (xfProto) return xfProto === "https";

  // Fallback (útil en dev sin proxy)
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const tokenFromBody =
    (typeof body?.token === "string" && body.token.trim()) ||
    (typeof body?.credential === "string" && body.credential.trim()) ||
    (typeof body?.id_token === "string" && body.id_token.trim()) ||
    (typeof body?.access_token === "string" && body.access_token.trim()) ||
    "";

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

  const isHttps = isHttpsRequest(request);

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge,
  });

  return res;
}

export async function DELETE(request: Request) {
  const res = NextResponse.json({ ok: true });

  const isHttps = isHttpsRequest(request);

  res.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 0,
  });

  return res;
}
