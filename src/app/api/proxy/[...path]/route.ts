import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Ctx = { params: Promise<{ path: string[] }> };

// ponytail: proxy espeja 1:1 la superficie de src/lib/api.ts (backend es la
// autoridad de auth/autorización real); si algún día se necesita restringir
// paths desde acá, validar contra un allowlist explícito.
async function forward(request: Request, { params }: Ctx) {
  const { path } = await params;
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("host");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const search = new URL(request.url).search;
  const targetUrl = `${API_URL}/${path.join("/")}${search}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);

    // fetch() ya descomprime el body — reenviar el Content-Encoding
    // original del backend hace que el navegador intente descomprimir
    // bytes que ya están planos (net::ERR_CONTENT_DECODING_FAILED).
    // content-length/transfer-encoding tampoco aplican: dejar que el
    // server de Next calcule el framing de la respuesta que sí manda.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ detail: "No se pudo conectar con el servidor" }, { status: 502 });
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
