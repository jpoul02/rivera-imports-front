"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsersScreen() {
  const { user } = useAuth();
  const { data: usuarios, loading, refetch } = useFetch(api.getUsuarios);
  const { data: roles } = useFetch(api.getRoles);

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const toggleRol = (nombreRol: string) => {
    setRolesSeleccionados((actual) =>
      actual.includes(nombreRol) ? actual.filter((r) => r !== nombreRol) : [...actual, nombreRol]
    );
  };

  const crear = async () => {
    if (!nombre.trim() || !usuario.trim() || !email.trim() || rolesSeleccionados.length === 0) {
      toast.error("Completá nombre, usuario, correo y al menos un rol");
      return;
    }
    setEnviando(true);
    try {
      await api.crearUsuario({
        nombre: nombre.trim(),
        usuario: usuario.trim().toLowerCase(),
        email: email.trim(),
        roles: rolesSeleccionados,
      });
      toast.success("Usuario creado — le llegó la contraseña temporal por correo");
      setNombre("");
      setUsuario("");
      setEmail("");
      setRolesSeleccionados([]);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo crear el usuario"));
    } finally {
      setEnviando(false);
    }
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    try {
      await api.actualizarUsuario(id, { activo });
      toast.success(activo ? "Usuario activado" : "Usuario desactivado");
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo actualizar el usuario"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl sm:text-4xl">USUARIOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {usuarios?.length ?? 0} usuarios del sistema
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10">
              <UserPlus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="display-title text-xl">NUEVO USUARIO</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u-nombre">Nombre completo</Label>
                <Input
                  id="u-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="u-usuario">Usuario</Label>
                <Input
                  id="u-usuario"
                  value={usuario}
                  onChange={(e) =>
                    setUsuario(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))
                  }
                  placeholder="sin espacios"
                  className="h-10 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="u-email">Correo</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@dominio.com"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Ahí le llega la contraseña temporal para entrar la primera vez.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="space-y-2 rounded-md border p-3">
                  {(roles ?? []).map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={rolesSeleccionados.includes(r.nombre)}
                        onCheckedChange={() => toggleRol(r.nombre)}
                      />
                      <span className="capitalize">{r.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                className="h-10 font-semibold text-primary"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button className="h-10" onClick={crear} disabled={enviando}>
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="py-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Usuario</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usuarios ?? []).map((u) => {
                const esYo = user?.usuario === u.usuario;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-sm">
                          <AvatarFallback className="rounded-sm bg-primary/10 font-semibold text-primary">
                            {u.nombre.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {u.nombre}
                            {esYo && (
                              <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                            )}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">@{u.usuario}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((rolNombre) => (
                          <Badge
                            key={rolNombre}
                            variant={rolNombre === "administrador" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {rolNombre}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={u.activo}
                        disabled={esYo}
                        onCheckedChange={(checked) => toggleActivo(u.id, checked)}
                        aria-label={`Activar o desactivar a ${u.nombre}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
