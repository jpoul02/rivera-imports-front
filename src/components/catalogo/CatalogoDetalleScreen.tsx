"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogoDetalleScreen({ id }: { id: string }) {
  const articuloId = Number(id);
  const { data: articulo, loading } = useFetch(() => api.getCatalogoArticulo(articuloId));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
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
      <div className="py-24 text-center">
        <p className="display-title text-2xl text-muted-foreground">
          ARTÍCULO NO ENCONTRADO
        </p>
        <Button asChild className="mt-6 h-10">
          <Link href="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" className="-ml-2 h-10 text-muted-foreground">
        <Link href="/catalogo">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
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

        <div className="space-y-5 lg:col-span-3">
          <div>
            <Badge variant="outline">{articulo.categoria}</Badge>
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
            <Badge variant={articulo.disponible ? "secondary" : "destructive"}>
              {articulo.disponible ? "Disponible" : "Agotado"}
            </Badge>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">{articulo.descripcion}</p>
        </div>
      </div>
    </div>
  );
}
