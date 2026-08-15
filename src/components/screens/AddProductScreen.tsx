"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { SubirFotoArticulo } from "@/components/common/SubirFotoArticulo";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormState {
  nombre: string;
  categoriaId: string;
  marcaId: string;
  modeloId: string;
  precio: string;
  stock: string;
  descripcion: string;
}

const inicial: FormState = {
  nombre: "",
  categoriaId: "",
  marcaId: "",
  modeloId: "",
  precio: "",
  stock: "0",
  descripcion: "",
};

export function AddProductScreen() {
  const { data: catalogos } = useFetch(api.getCatalogos);
  const router = useRouter();
  const [form, setForm] = useState<FormState>(inicial);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [errores, setErrores] = useState<Partial<Record<keyof FormState, string>>>({});
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const modelosDisponibles = (catalogos?.modelos ?? []).filter(
    (m) => String(m.marca_id) === form.marcaId
  );

  const validar = (): boolean => {
    const e: typeof errores = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.categoriaId) e.categoriaId = "Seleccioná una categoría";
    if (!form.marcaId) e.marcaId = "Seleccioná una marca";
    if (!form.modeloId) e.modeloId = "Seleccioná un modelo";
    const precio = Number(form.precio);
    if (!form.precio || isNaN(precio) || precio <= 0) e.precio = "Precio inválido";
    const stock = Number(form.stock);
    if (form.stock === "" || isNaN(stock) || stock < 0 || !Number.isInteger(stock))
      e.stock = "Stock inválido";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) {
      toast.error("Revisá los campos marcados");
      return;
    }
    setEnviando(true);
    try {
      const nuevo = await api.crearArticulo({
        nombre: form.nombre.trim(),
        categoria_id: Number(form.categoriaId),
        marca_id: Number(form.marcaId),
        modelo_id: Number(form.modeloId),
        foto: "",
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
      });
      if (fotoFile) {
        try {
          await api.subirImagenArticulo(nuevo.id, fotoFile);
        } catch (error) {
          toast.error(mensajeDeError(error, "Artículo guardado, pero la foto no se pudo subir"));
        }
      }
      toast.success("Artículo agregado al inventario");
      router.push(`/products/${nuevo.id}`);
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo guardar el artículo"));
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button
          variant="ghost"
          className="h-10 -ml-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="display-title mt-2 text-3xl sm:text-4xl">AGREGAR ARTÍCULO</h1>
        <div className="mt-2 h-0.5 w-12 bg-primary" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="display-title text-lg">DATOS DEL ARTÍCULO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del artículo</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej. Pastillas de freno cerámicas"
                className="h-10"
                aria-invalid={!!errores.nombre}
              />
              {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <ComboboxSelect
                  items={(catalogos?.categorias ?? []).map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  value={form.categoriaId}
                  onChange={(v) => set("categoriaId", v)}
                  placeholder="Seleccionar..."
                />
                {errores.categoriaId && (
                  <p className="text-xs text-destructive">{errores.categoriaId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <ComboboxSelect
                  items={(catalogos?.marcas ?? []).map((m) => ({
                    value: String(m.id),
                    label: m.nombre,
                  }))}
                  value={form.marcaId}
                  onChange={(v) => {
                    set("marcaId", v);
                    set("modeloId", "");
                  }}
                  placeholder="Seleccionar..."
                />
                {errores.marcaId && <p className="text-xs text-destructive">{errores.marcaId}</p>}
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <ComboboxSelect
                  items={modelosDisponibles.map((m) => ({
                    value: String(m.id),
                    label: m.nombre,
                  }))}
                  value={form.modeloId}
                  onChange={(v) => set("modeloId", v)}
                  placeholder={form.marcaId ? "Seleccionar..." : "Elegí una marca primero"}
                  disabled={!form.marcaId}
                />
                {errores.modeloId && <p className="text-xs text-destructive">{errores.modeloId}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (USD)</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => set("precio", e.target.value)}
                  placeholder="0.00"
                  className="h-10 font-mono"
                  aria-invalid={!!errores.precio}
                />
                {errores.precio && <p className="text-xs text-destructive">{errores.precio}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock inicial</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  className="h-10 font-mono"
                  aria-invalid={!!errores.stock}
                />
                {errores.stock && <p className="text-xs text-destructive">{errores.stock}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Detalles del artículo: compatibilidad, material, garantía..."
                rows={3}
                aria-invalid={!!errores.descripcion}
              />
              {errores.descripcion && (
                <p className="text-xs text-destructive">{errores.descripcion}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="display-title flex items-center gap-2 text-lg">
              <ImageIcon className="h-4 w-4 text-primary" />
              FOTOGRAFÍA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubirFotoArticulo fotoActual="" nombre={form.nombre} onFileChange={setFotoFile} />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-10 font-semibold text-primary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" className="h-10 sm:min-w-44" disabled={enviando}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar artículo
          </Button>
        </div>
      </form>
    </div>
  );
}
