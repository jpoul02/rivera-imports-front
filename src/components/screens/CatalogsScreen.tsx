"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Tags, CarFront, Layers } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import type { CatalogoItem } from "@/types";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function BadgeConConfirmacion({
  nombre,
  onConfirmar,
}: {
  nombre: string;
  onConfirmar: () => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${nombre}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar «{nombre}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Si hay artículos del inventario usando «{nombre}», el sistema no va a
            dejar borrarlo. Movelos a otra opción primero si querés liberarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-10">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="h-10 bg-destructive text-white hover:bg-destructive/90"
            onClick={async () => {
              try {
                await onConfirmar();
                toast.success(`«${nombre}» eliminado`);
              } catch (error) {
                toast.error(mensajeDeError(error, "No se pudo eliminar"));
              }
            }}
          >
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ListaEditable({
  titulo,
  icon: Icon,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CatalogoItem[];
  onAdd: (valor: string) => Promise<void>;
  onRemove: (item: CatalogoItem) => Promise<void>;
  placeholder: string;
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
              <BadgeConConfirmacion nombre={item.nombre} onConfirmar={() => onRemove(item)} />
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

  const modelos = (catalogos?.modelos ?? []).filter(
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
            onRemove={async (item) => {
              await api.eliminarCategoria(item.id);
              refetch();
            }}
            placeholder="Nueva categoría (ej. Escape)"
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
            onRemove={async (item) => {
              await api.eliminarMarca(item.id);
              refetch();
            }}
            placeholder="Nueva marca (ej. Suzuki)"
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
                    {modelos.map((modelo) => (
                      <Badge
                        key={modelo.id}
                        variant="secondary"
                        className="gap-1.5 py-1.5 pr-1.5 pl-3 text-sm font-normal"
                      >
                        {modelo.nombre}
                        <BadgeConConfirmacion
                          nombre={modelo.nombre}
                          onConfirmar={async () => {
                            await api.eliminarModelo(modelo.id);
                            refetch();
                          }}
                        />
                      </Badge>
                    ))}
                    {modelos.length === 0 && (
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
