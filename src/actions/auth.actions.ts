"use server";

import { cookies } from "next/headers";
import type { Usuario } from "@/types";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

export async function loginAction(
  usuario: string,
  password: string
): Promise<{ success: true; usuario: Usuario } | { success: false; error: string }> {
  const body = new URLSearchParams({ username: usuario, password });
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor" };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Credenciales inválidas" }));
    return { success: false, error: err.detail ?? "Usuario o contraseña incorrectos" };
  }

  const data: { access_token: string; usuario: Usuario } = await res.json();

  (await cookies()).set(AUTH_COOKIE_NAME, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true, usuario: data.usuario };
}

export async function logoutAction() {
  (await cookies()).delete(AUTH_COOKIE_NAME);
}
