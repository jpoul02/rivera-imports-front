"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, ShieldCheck } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import type { Rol } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RolesScreen() {
  const { data: roles, loading, refetch } = useFetch(api.getRoles);
  const { data: permisos } = useFetch(api.getPermisos);

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Rol | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const abrirNuevo = () => {
    setEditando(null);
    setNombre("");
    setDescripcion("");
    setPermisosSeleccionados([]);
    setOpen(true);
  };

  const abrirEditar = (rol: Rol) => {
    setEditando(rol);
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion);
    setPermisosSeleccionados(rol.permisos);
    setOpen(true);
  };

  const togglePermiso = (clave: string) => {
    setPermisosSeleccionados((actual) =>
      actual.includes(clave) ? actual.filter((p) => p !== clave) : [...actual, clave]
    );
  };

  const guardar = async () => {
    if (!nombre.trim() || !descripcion.trim() || permisosSeleccionados.length === 0) {
      toast.error("Completá nombre, descripción y al menos un permiso");
      return;
    }
    setEnviando(true);
    try {
      if (editando) {
        await api.actualizarRol(editando.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          permisos: permisosSeleccionados,
        });
        toast.success("Rol actualizado");
      } else {
        await api.crearRol({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          permisos: permisosSeleccionados,
        });
        toast.success("Rol creado");
      }
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo guardar el rol"));
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (rol: Rol) => {
    try {
      await api.eliminarRol(rol.id);
      toast.success("Rol eliminado");
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo eliminar el rol"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl sm:text-4xl">ROLES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {roles?.length ?? 0} roles del sistema
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10" onClick={abrirNuevo}>
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                {editando ? "EDITAR ROL" : "NUEVO ROL"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editando?.es_sistema && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Rol de sistema — nombre y permisos son fijos. Sólo se puede editar la
                  descripción.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="r-nombre">Nombre</Label>
                <Input
                  id="r-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={editando?.es_sistema}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-descripcion">Descripción</Label>
                <Textarea
                  id="r-descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                  {(permisos ?? []).map((p) => (
                    <label key={p.clave} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={permisosSeleccionados.includes(p.clave)}
                        onCheckedChange={() => togglePermiso(p.clave)}
                        disabled={editando?.es_sistema}
                      />
                      <span>{p.etiqueta}</span>
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
              <Button className="h-10" onClick={guardar} disabled={enviando}>
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                {editando ? "Guardar cambios" : "Crear rol"}
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
                <TableHead>Rol</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead className="text-right">Usuarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(roles ?? []).map((rol) => (
                <TableRow key={rol.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{rol.nombre}</p>
                        <p className="text-xs text-muted-foreground">{rol.descripcion}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rol.permisos.slice(0, 3).map((p) => (
                        <Badge key={p} variant="secondary">
                          {p}
                        </Badge>
                      ))}
                      {rol.permisos.length > 3 && (
                        <Badge variant="secondary">+{rol.permisos.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {rol.usuarios_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => abrirEditar(rol)}
                        aria-label={`Editar ${rol.nombre}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!rol.es_sistema && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Eliminar ${rol.nombre}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar el rol {rol.nombre}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {rol.usuarios_count > 0
                                  ? `${rol.usuarios_count} usuario(s) tienen este rol. Esta acción no se puede deshacer.`
                                  : "Esta acción no se puede deshacer."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="h-10 bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => eliminar(rol)}
                              >
                                Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
