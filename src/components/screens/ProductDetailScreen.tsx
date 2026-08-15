"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  PackagePlus,
  PackageMinus,
  Trash2,
  History,
} from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, formatDate } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ProductDetailScreen({ id }: { id: string }) {
  const { hasPermiso } = useAuth();
  const router = useRouter();
  const articuloId = Number(id);

  const { data: articulo, loading, refetch } = useFetch(() => api.getArticulo(articuloId));
  const { data: historial, refetch: refetchHistorial } = useFetch(() =>
    api.getMovimientos(articuloId)
  );
  const { data: catalogos } = useFetch(api.getCatalogos);
  const { data: config } = useFetch(api.getConfiguracion);

  const [editOpen, setEditOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [edit, setEdit] = useState({
    nombre: "",
    categoriaId: "",
    marcaId: "",
    modeloId: "",
    foto: "",
    precio: "",
    descripcion: "",
  });
  const [ajuste, setAjuste] = useState({
    tipo: "entrada" as "entrada" | "salida",
    cantidad: "",
    nota: "",
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="aspect-square lg:col-span-2" />
          <div className="space-y-4 lg:col-span-3">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="py-20 text-center">
        <p className="display-title text-2xl text-muted-foreground">ARTÍCULO NO ENCONTRADO</p>
        <Button className="mt-6 h-10" onClick={() => router.push("/inventory")}>
          Volver al inventario
        </Button>
      </div>
    );
  }

  const umbral = config?.umbral_stock_bajo ?? 5;
  const puedeGestionar = hasPermiso("articulos_gestionar");
  const modelosDisponibles = (catalogos?.modelos ?? []).filter(
    (m) => String(m.marca_id) === edit.marcaId
  );

  const abrirEdicion = () => {
    setEdit({
      nombre: articulo.nombre,
      categoriaId: String(articulo.categoria_id),
      marcaId: String(articulo.marca_id),
      modeloId: String(articulo.modelo_id),
      foto: articulo.foto,
      precio: String(articulo.precio),
      descripcion: articulo.descripcion,
    });
    setEditOpen(true);
  };

  const guardarEdicion = async () => {
    const precio = Number(edit.precio);
    if (!edit.nombre.trim() || !edit.categoriaId || !edit.marcaId || !edit.modeloId) {
      toast.error("Completá nombre, categoría, marca y modelo");
      return;
    }
    if (isNaN(precio) || precio <= 0) {
      toast.error("Precio inválido");
      return;
    }
    try {
      await api.actualizarArticulo(articulo.id, {
        nombre: edit.nombre.trim(),
        categoria_id: Number(edit.categoriaId),
        marca_id: Number(edit.marcaId),
        modelo_id: Number(edit.modeloId),
        foto: edit.foto.trim(),
        precio,
        descripcion: edit.descripcion.trim(),
      });
      setEditOpen(false);
      toast.success("Artículo actualizado");
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo actualizar"));
    }
  };

  const aplicarAjuste = async () => {
    const cantidad = Number(ajuste.cantidad);
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      toast.error("Cantidad inválida");
      return;
    }
    try {
      await api.ajustarStock(articulo.id, {
        tipo: ajuste.tipo,
        cantidad,
        nota: ajuste.nota.trim(),
      });
      setStockOpen(false);
      setAjuste({ tipo: "entrada", cantidad: "", nota: "" });
      toast.success("Stock actualizado");
      refetch();
      refetchHistorial();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo ajustar el stock"));
    }
  };

  const eliminar = async () => {
    try {
      await api.eliminarArticulo(articulo.id);
      toast.success("Artículo eliminado");
      router.push("/inventory");
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo eliminar"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button
        variant="ghost"
        className="h-10 -ml-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Foto */}
        <Card className="overflow-hidden py-0 lg:col-span-2">
          <FotoArticulo
            src={articulo.foto}
            alt={articulo.nombre}
            categoria={articulo.categoria}
            className="aspect-square w-full"
            iconClassName="w-16 h-16"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        </Card>

        {/* Info */}
        <div className="space-y-5 lg:col-span-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{articulo.categoria}</Badge>
              <span className="text-sm text-muted-foreground">
                Ingresado el {formatDate(articulo.fecha_ingreso)}
              </span>
            </div>
            <h1 className="display-title mt-2 text-3xl sm:text-4xl">{articulo.nombre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {articulo.marca} · {articulo.modelo}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Precio</p>
              <p className="font-mono text-3xl font-bold">{formatMoney(articulo.precio)}</p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Stock</p>
              <p
                className={`display-title text-3xl ${
                  articulo.stock <= umbral ? "text-primary" : ""
                }`}
              >
                {articulo.stock} <span className="text-base text-muted-foreground">uds</span>
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">{articulo.descripcion}</p>

          {puedeGestionar && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="h-10" onClick={abrirEdicion}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>

              <Dialog open={stockOpen} onOpenChange={setStockOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <PackagePlus className="h-4 w-4" />
                    Ajustar stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="display-title text-xl">AJUSTAR STOCK</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={ajuste.tipo === "entrada" ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setAjuste((a) => ({ ...a, tipo: "entrada" }))}
                      >
                        <PackagePlus className="h-4 w-4" />
                        Entrada
                      </Button>
                      <Button
                        type="button"
                        variant={ajuste.tipo === "salida" ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setAjuste((a) => ({ ...a, tipo: "salida" }))}
                      >
                        <PackageMinus className="h-4 w-4" />
                        Salida
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidad">Cantidad</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="1"
                        step="1"
                        value={ajuste.cantidad}
                        onChange={(e) => setAjuste((a) => ({ ...a, cantidad: e.target.value }))}
                        className="h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nota">Nota</Label>
                      <Input
                        id="nota"
                        value={ajuste.nota}
                        onChange={(e) => setAjuste((a) => ({ ...a, nota: e.target.value }))}
                        placeholder="Motivo del ajuste"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="h-10 font-semibold text-primary"
                      onClick={() => setStockOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button className="h-10" onClick={aplicarAjuste}>
                      Aplicar ajuste
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasPermiso("articulos_eliminar") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este artículo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará «{articulo.nombre}» del inventario junto con su historial
                        de stock. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="h-10 bg-destructive text-white hover:bg-destructive/90"
                        onClick={eliminar}
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historial de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="display-title flex items-center gap-2 text-lg">
            <History className="h-4 w-4 text-primary" />
            HISTORIAL DE STOCK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock resultante</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(historial ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{formatDate(m.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === "entrada" ? "secondary" : "outline"}>
                      {m.tipo === "entrada" ? "Entrada" : m.tipo === "salida" ? "Salida" : "Ajuste"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      m.cantidad > 0 ? "text-emerald-600" : "text-primary"
                    }`}
                  >
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </TableCell>
                  <TableCell className="text-right font-mono">{m.stock_nuevo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.nota}</TableCell>
                </TableRow>
              ))}
              {(historial ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Sin movimientos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog edición */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">EDITAR ARTÍCULO</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="e-nombre">Nombre</Label>
              <Input
                id="e-nombre"
                value={edit.nombre}
                onChange={(e) => setEdit((f) => ({ ...f, nombre: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <ComboboxSelect
                  items={(catalogos?.categorias ?? []).map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  value={edit.categoriaId}
                  onChange={(v) => setEdit((f) => ({ ...f, categoriaId: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <ComboboxSelect
                  items={(catalogos?.marcas ?? []).map((m) => ({
                    value: String(m.id),
                    label: m.nombre,
                  }))}
                  value={edit.marcaId}
                  onChange={(v) => setEdit((f) => ({ ...f, marcaId: v, modeloId: "" }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <ComboboxSelect
                  items={modelosDisponibles.map((m) => ({
                    value: String(m.id),
                    label: m.nombre,
                  }))}
                  value={edit.modeloId}
                  onChange={(v) => setEdit((f) => ({ ...f, modeloId: v }))}
                  disabled={!edit.marcaId}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-precio">Precio (USD)</Label>
              <Input
                id="e-precio"
                type="number"
                min="0"
                step="0.01"
                value={edit.precio}
                onChange={(e) => setEdit((f) => ({ ...f, precio: e.target.value }))}
                className="h-10 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-foto">URL de fotografía</Label>
              <Input
                id="e-foto"
                value={edit.foto}
                onChange={(e) => setEdit((f) => ({ ...f, foto: e.target.value }))}
                placeholder="https://..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-desc">Descripción</Label>
              <Textarea
                id="e-desc"
                value={edit.descripcion}
                onChange={(e) => setEdit((f) => ({ ...f, descripcion: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="h-10 font-semibold text-primary"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="h-10" onClick={guardarEdicion}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
