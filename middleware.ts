import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Minimalno: ako nema auth cookie-ja, prebaci na /login.
// Imena cookie-ja Better Auth postavlja; ako ih mijenjaš u configu, prilagodi ovdje.
const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)))
    return NextResponse.next();

  // Ako nema ijedan cookie koji počinje sa "ba:" (primjer), redirect.
  // (Po potrebi zamijeni uslov točnim imenom cookie-ja ako želiš strože)
  const hasAnyAuthCookie = Array.from(req.cookies.getAll()).some(
    (c) => c.name.includes("better-auth") || c.name.includes("ba")
  );
  if (!hasAnyAuthCookie) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Ako želiš ograničiti samo na sekcije:
export const config = {
  matcher: ["/admin/:path*", "/technician/:path*", "/client/:path*"],
};
