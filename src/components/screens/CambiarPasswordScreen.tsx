"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { homePath } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CambiarPasswordScreen() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const actualizado = await api.actualizarMiPerfil({ password });
      toast.success("Contraseña actualizada");
      await refreshUser();
      router.push(homePath(actualizado.permisos));
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo actualizar la contraseña"));
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="display-title text-3xl">CAMBIAR CONTRASEÑA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta se creó con una contraseña temporal. Elegí una nueva antes de continuar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-4 w-4 text-primary" />
            Nueva contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña nueva</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="h-10"
                aria-invalid={!!error}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar y continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
