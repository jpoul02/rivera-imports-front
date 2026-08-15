"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homePath } from "@/lib/permissions";
import { mensajeDeError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Plano de despiece — disco de freno ventilado. Firma visual de la marca. */
function BlueprintRotor() {
  const holes = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { cx: 200 + Math.cos(angle) * 78, cy: 200 + Math.sin(angle) * 78 };
  });
  const vents = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const x1 = 200 + Math.cos(angle) * 108;
    const y1 = 200 + Math.sin(angle) * 108;
    const x2 = 200 + Math.cos(angle) * 130;
    const y2 = 200 + Math.sin(angle) * 130;
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full max-w-md text-neutral-500"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="200" cy="200" r="150" strokeWidth="1.25" />
      <circle cx="200" cy="200" r="130" strokeWidth="0.75" opacity="0.5" />
      <circle cx="200" cy="200" r="108" strokeWidth="0.75" opacity="0.5" />
      <circle cx="200" cy="200" r="42" strokeWidth="1.25" />
      <circle cx="200" cy="200" r="10" strokeWidth="1" className="text-primary" opacity="0.8" />
      {vents.map((v, i) => (
        <line key={i} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} strokeWidth="0.75" opacity="0.4" />
      ))}
      {holes.map((h, i) => (
        <circle key={i} cx={h.cx} cy={h.cy} r="8" strokeWidth="1" />
      ))}
      {/* pinza de freno */}
      <path
        d="M 258 96 L 322 78 L 344 138 L 306 172 L 268 156 Z"
        strokeWidth="1.25"
        className="text-primary"
        opacity="0.9"
      />
      <line x1="284" y1="118" x2="316" y2="132" strokeWidth="0.75" opacity="0.6" />
      {/* línea de cota */}
      <line x1="60" y1="50" x2="60" y2="350" strokeWidth="0.75" opacity="0.6" />
      <line x1="53" y1="50" x2="67" y2="50" strokeWidth="0.75" opacity="0.6" />
      <line x1="53" y1="350" x2="67" y2="350" strokeWidth="0.75" opacity="0.6" />
    </svg>
  );
}

function RegistrationMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(homePath(user.permisos));
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel técnico — carbón fijo, marca constante en ambos temas */}
      <div
        className={cn(
          "relative flex h-72 shrink-0 flex-col justify-between overflow-hidden bg-neutral-950 px-6 py-6 transition-all duration-500 ease-out lg:h-auto lg:w-[55%] lg:px-12 lg:py-10",
          mounted ? "opacity-100" : "-translate-x-3 opacity-0"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 racing-stripe" />

        <RegistrationMark className="pointer-events-none absolute top-4 left-4 h-4 w-4 text-neutral-700" />
        <RegistrationMark className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-neutral-700" />
        <RegistrationMark className="pointer-events-none absolute bottom-4 left-4 hidden h-4 w-4 text-neutral-700 lg:block" />
        <RegistrationMark className="pointer-events-none absolute right-4 bottom-4 hidden h-4 w-4 text-neutral-700 lg:block" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary">
            <span className="display-title text-lg leading-none text-primary-foreground">RI</span>
          </div>
          <span className="display-title text-sm tracking-[0.3em] text-neutral-500">
            RIVERA IMPORTS
          </span>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-4 lg:py-6">
          <div className="h-full w-40 lg:w-full lg:max-w-md">
            <BlueprintRotor />
          </div>
        </div>

        <div className="relative z-10 space-y-1 font-mono text-[10px] text-neutral-600 lg:text-xs">
          <p>REF. 4102-B — ROTOR DELANTERO VENTILADO</p>
          <p>⌀300MM · 5 PERNOS · SISTEMA DE FRENOS</p>
        </div>
      </div>

      {/* Panel de acceso — respeta tema claro/oscuro */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div
          className={cn(
            "w-full max-w-sm transition-all delay-100 duration-500 ease-out",
            mounted ? "opacity-100" : "translate-y-3 opacity-0"
          )}
        >
          <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground">
            ACCESO AL SISTEMA
          </p>
          <h1 className="display-title mt-1 text-3xl">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Repuestos y partes de automóviles — Gestión de inventario
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                autoFocus
                className="h-10"
                placeholder="tu usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo: <span className="font-mono">raul / karla / diego</span> · contraseña{" "}
            <span className="font-mono">rivera123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
