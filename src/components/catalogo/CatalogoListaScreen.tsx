"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogoArticulo } from "@/types";

export interface ItemLista {
  articuloId: number;
  cantidad: number;
}

interface ArticuloConCantidad extends CatalogoArticulo {
  cantidad: number;
}

async function cargarArticulos(items: ItemLista[]): Promise<ArticuloConCantidad[]> {
  const resultados = await Promise.all(
    items.map(async ({ articuloId, cantidad }) => {
      try {
        const articulo = await api.getCatalogoArticulo(articuloId);
        return { ...articulo, cantidad };
      } catch {
        return null;
      }
    })
  );
  return resultados.filter((a): a is ArticuloConCantidad => a !== null);
}

export function CatalogoListaScreen({ items }: { items: ItemLista[] }) {
  const { data: articulos, loading } = useFetch(() => cargarArticulos(items));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" className="-ml-2 h-10 text-muted-foreground">
        <Link href="/catalogo">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </Button>

      <div>
        <h1 className="display-title text-2xl sm:text-3xl">LISTA DE INTERÉS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Artículos que un cliente marcó como de interés.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {!loading && (!articulos || articulos.length === 0) && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Esta lista está vacía o los artículos ya no están disponibles.
        </p>
      )}

      {!loading && articulos && articulos.length > 0 && (
        <div className="space-y-3">
          {articulos.map((a) => (
            <Link key={a.id} href={`/catalogo/${a.id}`}>
              <Card className="flex-row items-center gap-4 overflow-hidden p-3 transition-colors duration-150 hover:border-primary/40">
                <FotoArticulo
                  src={a.foto}
                  alt={a.nombre}
                  categoria={a.categoria}
                  className="h-16 w-16 shrink-0 rounded-md"
                  iconClassName="w-6 h-6"
                  sizes="64px"
                />
                <CardContent className="flex flex-1 items-center justify-between gap-3 p-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.marca} · {a.modelo}
                    </p>
                    <span className="font-mono text-sm font-semibold">
                      {formatMoney(a.precio)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">x{a.cantidad}</Badge>
                    <Badge variant={a.disponible ? "secondary" : "destructive"}>
                      {a.disponible ? "Disponible" : "Agotado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
