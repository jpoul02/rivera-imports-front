"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homePath } from "@/lib/permissions";
import { mensajeDeError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(homePath(user.permisos));
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      toast.error("Ingresá usuario y contraseña");
      return;
    }
    setEnviando(true);
    try {
      await login(usuario.trim(), password);
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo iniciar sesión"));
      setEnviando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 py-12">
      {/* Franjas racing de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-0 h-full w-[55%] opacity-[0.07]"
        style={{
          background:
            "repeating-linear-gradient(115deg, oklch(0.55 0.22 28) 0px, oklch(0.55 0.22 28) 70px, transparent 70px, transparent 150px)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1.5 racing-stripe" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-primary shadow-[0_0_60px_-12px_oklch(0.55_0.22_28)]">
            <span className="display-title text-3xl text-primary-foreground">RI</span>
          </div>
          <h1 className="display-title text-5xl tracking-wide text-white">
            RIVERA <span className="text-primary">IMPORTS</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Repuestos y partes de automóviles — Gestión de inventario
          </p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-neutral-300">
                  Usuario
                </Label>
                <Input
                  id="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="h-10 border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-600"
                  placeholder="tu usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 border-neutral-700 bg-neutral-950 text-white"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="h-10 w-full" disabled={enviando}>
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Iniciar sesión
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-neutral-600">
          Demo: <span className="font-mono text-neutral-400">raul / karla / diego</span> ·
          contraseña <span className="font-mono text-neutral-400">rivera123</span>
        </p>
      </div>
    </div>
  );
}
