"use client";

import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Plus, X, Tags, CarFront, Layers, Loader2 } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import type { CatalogoItem, ModeloItem } from "@/types";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function esConflicto(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

/** X con confirmación; si el borrado choca porque hay artículos en uso,
 * pasa a pedir un destino y reasigna+elimina en vez de solo fallar. */
function BadgeConEliminar({
  nombre,
  onEliminar,
  opciones,
  onReasignar,
}: {
  nombre: string;
  onEliminar: () => Promise<void>;
  opciones: { value: string; label: string }[];
  onReasignar: (destinoId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"confirmar" | "reasignar">("confirmar");
  const [destino, setDestino] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    setOpen(false);
    setModo("confirmar");
    setDestino("");
  };

  const intentarEliminar = async () => {
    setEnviando(true);
    try {
      await onEliminar();
      toast.success(`«${nombre}» eliminado`);
      cerrar();
    } catch (error) {
      if (esConflicto(error)) {
        setModo("reasignar");
      } else {
        toast.error(mensajeDeError(error, "No se pudo eliminar"));
      }
    } finally {
      setEnviando(false);
    }
  };

  const confirmarReasignar = async () => {
    if (!destino) return;
    setEnviando(true);
    try {
      await onReasignar(Number(destino));
      toast.success(`Artículos movidos — «${nombre}» eliminado`);
      cerrar();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo reasignar"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${nombre}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {modo === "confirmar" ? (
          <>
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                ¿ELIMINAR «{nombre.toUpperCase()}»?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Si hay artículos del inventario usando «{nombre}», te voy a pedir a dónde
              moverlos antes de poder borrarlo.
            </p>
            <DialogFooter>
              <Button variant="ghost" className="h-10 font-semibold text-primary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                className="h-10 bg-destructive text-white hover:bg-destructive/90"
                onClick={intentarEliminar}
                disabled={enviando}
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Sí, eliminar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                «{nombre.toUpperCase()}» ESTÁ EN USO
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Elegí a dónde mover los artículos que la usan. Después se borra «{nombre}».
            </p>
            <ComboboxSelect
              items={opciones}
              value={destino}
              onChange={setDestino}
              placeholder="Elegir destino..."
            />
            <DialogFooter>
              <Button variant="ghost" className="h-10 font-semibold text-primary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                className="h-10"
                onClick={confirmarReasignar}
                disabled={!destino || enviando}
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Mover y eliminar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Igual que BadgeConEliminar pero para marcas: al reasignar hace falta
 * también un modelo destino, porque borrar la marca borra sus modelos. */
function BadgeMarcaConEliminar({
  marca,
  marcas,
  modelos,
  onEliminar,
  onReasignar,
}: {
  marca: CatalogoItem;
  marcas: CatalogoItem[];
  modelos: ModeloItem[];
  onEliminar: () => Promise<void>;
  onReasignar: (destinoMarcaId: number, destinoModeloId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"confirmar" | "reasignar">("confirmar");
  const [destinoMarca, setDestinoMarca] = useState("");
  const [destinoModelo, setDestinoModelo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const opcionesMarca = marcas
    .filter((m) => m.id !== marca.id)
    .map((m) => ({ value: String(m.id), label: m.nombre }));
  const opcionesModelo = modelos
    .filter((m) => String(m.marca_id) === destinoMarca)
    .map((m) => ({ value: String(m.id), label: m.nombre }));

  const cerrar = () => {
    setOpen(false);
    setModo("confirmar");
    setDestinoMarca("");
    setDestinoModelo("");
  };

  const intentarEliminar = async () => {
    setEnviando(true);
    try {
      await onEliminar();
      toast.success(`«${marca.nombre}» eliminada`);
      cerrar();
    } catch (error) {
      if (esConflicto(error)) {
        setModo("reasignar");
      } else {
        toast.error(mensajeDeError(error, "No se pudo eliminar"));
      }
    } finally {
      setEnviando(false);
    }
  };

  const confirmarReasignar = async () => {
    if (!destinoMarca || !destinoModelo) return;
    setEnviando(true);
    try {
      await onReasignar(Number(destinoMarca), Number(destinoModelo));
      toast.success(`Artículos movidos — «${marca.nombre}» eliminada`);
      cerrar();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo reasignar"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrar())}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${marca.nombre}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {modo === "confirmar" ? (
          <>
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                ¿ELIMINAR «{marca.nombre.toUpperCase()}»?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Si hay artículos de esta marca, te voy a pedir a qué marca y modelo moverlos
              antes de poder borrarla.
            </p>
            <DialogFooter>
              <Button variant="ghost" className="h-10 font-semibold text-primary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                className="h-10 bg-destructive text-white hover:bg-destructive/90"
                onClick={intentarEliminar}
                disabled={enviando}
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Sí, eliminar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="display-title text-xl">
                «{marca.nombre.toUpperCase()}» ESTÁ EN USO
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Elegí la marca y el modelo a donde mover los artículos. Después se borra «
              {marca.nombre}» junto con sus modelos.
            </p>
            <div className="space-y-3">
              <ComboboxSelect
                items={opcionesMarca}
                value={destinoMarca}
                onChange={(v) => {
                  setDestinoMarca(v);
                  setDestinoModelo("");
                }}
                placeholder="Marca destino..."
              />
              <ComboboxSelect
                items={opcionesModelo}
                value={destinoModelo}
                onChange={setDestinoModelo}
                placeholder={destinoMarca ? "Modelo destino..." : "Elegí primero una marca"}
                disabled={!destinoMarca}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" className="h-10 font-semibold text-primary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                className="h-10"
                onClick={confirmarReasignar}
                disabled={!destinoMarca || !destinoModelo || enviando}
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Mover y eliminar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListaEditable({
  titulo,
  icon: Icon,
  items,
  onAdd,
  placeholder,
  renderAccion,
}: {
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CatalogoItem[];
  onAdd: (valor: string) => Promise<void>;
  placeholder: string;
  renderAccion: (item: CatalogoItem) => React.ReactNode;
}) {
  const [nuevo, setNuevo] = useState("");

  const agregar = async () => {
    const valor = nuevo.trim();
    if (!valor) return;
    try {
      await onAdd(valor);
      setNuevo("");
      toast.success(`«${valor}» agregado`);
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo agregar"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="display-title flex items-center gap-2 text-lg">
          <Icon className="h-4 w-4 text-primary" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
            placeholder={placeholder}
            className="h-10"
          />
          <Button className="h-10" onClick={agregar}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1.5 py-1.5 pr-1.5 pl-3 text-sm font-normal"
            >
              {item.nombre}
              {renderAccion(item)}
            </Badge>
          ))}
          {items.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">Catálogo vacío.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CatalogsScreen() {
  const { data: catalogos, refetch } = useFetch(api.getCatalogos);

  const [marcaId, setMarcaId] = useState("");
  const [nuevoModelo, setNuevoModelo] = useState("");

  const modelosDeMarca = (catalogos?.modelos ?? []).filter(
    (m) => String(m.marca_id) === marcaId
  );

  const agregarModelo = async () => {
    const valor = nuevoModelo.trim();
    if (!marcaId || !valor) return;
    try {
      await api.crearModelo(valor, Number(marcaId));
      setNuevoModelo("");
      toast.success(`«${valor}» agregado`);
      refetch();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo agregar el modelo"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-title text-3xl sm:text-4xl">CATÁLOGOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categorías, marcas y modelos disponibles al crear artículos
        </p>
        <div className="mt-2 h-0.5 w-12 bg-primary" />
      </div>

      <Tabs defaultValue="categorias">
        <TabsList className="h-10">
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="marcas">Marcas</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="mt-6">
          <ListaEditable
            titulo="CATEGORÍAS DE PARTES"
            icon={Tags}
            items={catalogos?.categorias ?? []}
            onAdd={async (v) => {
              await api.crearCategoria(v);
              refetch();
            }}
            placeholder="Nueva categoría (ej. Escape)"
            renderAccion={(item) => (
              <BadgeConEliminar
                nombre={item.nombre}
                onEliminar={async () => {
                  await api.eliminarCategoria(item.id);
                  refetch();
                }}
                opciones={(catalogos?.categorias ?? [])
                  .filter((c) => c.id !== item.id)
                  .map((c) => ({ value: String(c.id), label: c.nombre }))}
                onReasignar={async (destinoId) => {
                  await api.reasignarYEliminarCategoria(item.id, destinoId);
                  refetch();
                }}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="marcas" className="mt-6">
          <ListaEditable
            titulo="MARCAS DE VEHÍCULOS"
            icon={CarFront}
            items={catalogos?.marcas ?? []}
            onAdd={async (v) => {
              await api.crearMarca(v);
              refetch();
            }}
            placeholder="Nueva marca (ej. Suzuki)"
            renderAccion={(item) => (
              <BadgeMarcaConEliminar
                marca={item}
                marcas={catalogos?.marcas ?? []}
                modelos={catalogos?.modelos ?? []}
                onEliminar={async () => {
                  await api.eliminarMarca(item.id);
                  refetch();
                }}
                onReasignar={async (destinoMarcaId, destinoModeloId) => {
                  await api.reasignarYEliminarMarca(item.id, destinoMarcaId, destinoModeloId);
                  refetch();
                }}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="modelos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="display-title flex items-center gap-2 text-lg">
                <Layers className="h-4 w-4 text-primary" />
                MODELOS POR MARCA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-2">
                <p className="text-sm font-medium">Marca</p>
                <ComboboxSelect
                  items={(catalogos?.marcas ?? []).map((m) => ({
                    value: String(m.id),
                    label: m.nombre,
                  }))}
                  value={marcaId}
                  onChange={setMarcaId}
                  placeholder="Seleccioná una marca..."
                />
              </div>

              {marcaId && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={nuevoModelo}
                      onChange={(e) => setNuevoModelo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && agregarModelo()}
                      placeholder="Nuevo modelo"
                      className="h-10"
                    />
                    <Button className="h-10" onClick={agregarModelo}>
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modelosDeMarca.map((modelo) => (
                      <Badge
                        key={modelo.id}
                        variant="secondary"
                        className="gap-1.5 py-1.5 pr-1.5 pl-3 text-sm font-normal"
                      >
                        {modelo.nombre}
                        <BadgeConEliminar
                          nombre={modelo.nombre}
                          onEliminar={async () => {
                            await api.eliminarModelo(modelo.id);
                            refetch();
                          }}
                          opciones={modelosDeMarca
                            .filter((m) => m.id !== modelo.id)
                            .map((m) => ({ value: String(m.id), label: m.nombre }))}
                          onReasignar={async (destinoId) => {
                            await api.reasignarYEliminarModelo(modelo.id, destinoId);
                            refetch();
                          }}
                        />
                      </Badge>
                    ))}
                    {modelosDeMarca.length === 0 && (
                      <p className="py-4 text-sm text-muted-foreground">
                        Sin modelos para esta marca.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
