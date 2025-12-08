import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas privadas
  const isProtected = pathname.startsWith("/planeaciones") || pathname.startsWith("/dashboard-planeacion");

  if (isProtected) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      const url = new URL("/", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/planeaciones/:path*", "/dashboard-planeacion/:path*"],
};
