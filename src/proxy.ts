import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const PUBLIC_PATHS = ["/login", "/catalogo"];

/**
 * Sólo valida estructura + expiración del JWT, no la firma: el backend
 * valida la firma en cada request proxificado. Esto es un gate de UX
 * (evitar el flash de páginas protegidas), no el límite de autorización real.
 */
function isTokenPresent(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://images.unsplash.com;
    font-src 'self' data:;
    connect-src 'self' ${apiUrl};
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Las llamadas a /api/proxy llevan su propio manejo de 401 en el cliente
  // (axios interceptor); acá sólo les pegamos el CSP y las dejamos pasar.
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const tokenValid = token ? isTokenPresent(token) : false;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!tokenValid && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // No redirigimos acá cuando ya hay cookie y pathname === "/login": ese
  // gate ya lo hace login/page.tsx contra la validación real del backend
  // (api.me()). Duplicarlo acá, validando sólo estructura/exp, puede
  // divergir del veredicto real del backend y producir un loop de
  // redirects (login -> "/" -> login -> ...).

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
