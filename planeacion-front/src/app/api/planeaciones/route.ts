// src/app/api/planeaciones/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

// Helper: leer token de la cookie HttpOnly que ya creas en /api/session
function getTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get("auth_token");
  return cookie?.value || null;
}

// GET /api/planeaciones  -> lista SOLO del docente (según JWT en Go)
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    // Sin token → no hay sesión, devolvemos lista vacía para el front
    return NextResponse.json([], { status: 200 });
    // Si prefieres forzar login:
    // return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/planeaciones`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// POST /api/planeaciones  -> crea planeación usando el user_id del JWT en Go
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${API_BASE}/planeaciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
