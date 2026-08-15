"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const ROLES: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "vendedor", label: "Vendedor" },
];

export function UsersScreen() {
  const { usuarios, addUsuario, updateUsuario } = useApp();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState<string>("");

  const crear = () => {
    if (!nombre.trim() || !usuario.trim() || !rol) {
      toast.error("Completá nombre, usuario y rol");
      return;
    }
    if (usuarios.some((u) => u.usuario === usuario.trim().toLowerCase())) {
      toast.error("Ese nombre de usuario ya existe");
      return;
    }
    addUsuario({
      nombre: nombre.trim(),
      usuario: usuario.trim().toLowerCase(),
      rol: rol as UserRole,
      activo: true,
    });
    setNombre("");
    setUsuario("");
    setRol("");
    setOpen(false);
    toast.success("Usuario creado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl sm:text-4xl">USUARIOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {usuarios.length} usuarios del sistema
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
                <Label>Rol</Label>
                <ComboboxSelect
                  items={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                  value={rol}
                  onChange={setRol}
                  placeholder="Seleccionar rol..."
                />
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
              <Button className="h-10" onClick={crear}>
                Crear usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
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
                    <Badge
                      variant={u.rol === "administrador" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {u.rol}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={u.activo}
                      disabled={esYo}
                      onCheckedChange={(checked) => {
                        updateUsuario(u.id, { activo: checked });
                        toast.success(
                          checked ? "Usuario activado" : "Usuario desactivado"
                        );
                      }}
                      aria-label={`Activar o desactivar a ${u.nombre}`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
