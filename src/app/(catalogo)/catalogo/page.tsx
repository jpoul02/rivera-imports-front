"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Paginacion } from "@/components/common/Paginacion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const POR_PAGINA = 12;

export default function CatalogoPage() {
  const { data, loading } = useFetch(api.getCatalogoPublico);

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (data?.articulos ?? []).filter((a) => {
      if (categoria && a.categoria !== categoria) return false;
      if (
        q &&
        ![a.nombre, a.marca, a.modelo, a.categoria].some((v) => v.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [data, busqueda, categoria]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      {/* Hero */}
      <div className="relative isolate overflow-hidden border-b border-neutral-800">
        <Image
          src="/pickup.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-neutral-950/70" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="font-mono text-xs tracking-[0.25em] text-neutral-300">CATÁLOGO</p>
          <h1 className="display-title mt-2 text-4xl text-white sm:text-5xl">
            REPUESTOS Y PARTES
          </h1>
          <p className="mt-3 max-w-lg text-sm text-neutral-300">
            Navegá el catálogo de Rivera Imports. Agregá lo que te interesa a tu lista y
            consultá disponibilidad por WhatsApp.
          </p>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1 racing-stripe" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, marca o modelo..."
              className="h-10 pl-9"
            />
          </div>
        </div>

        {!loading && data && data.categorias.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={categoria === "" ? "default" : "outline"}
              className="h-8 rounded-full"
              onClick={() => {
                setCategoria("");
                setPagina(1);
              }}
            >
              Todas
            </Button>
            {data.categorias.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={categoria === c.nombre ? "default" : "outline"}
                className="h-8 rounded-full"
                onClick={() => {
                  setCategoria(c.nombre);
                  setPagina(1);
                }}
              >
                {c.nombre}
              </Button>
            ))}
          </div>
        )}

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginados.map((a) => (
                <Link key={a.id} href={`/catalogo/${a.id}`}>
                  <Card className="h-full gap-3 overflow-hidden py-0 transition-colors duration-150 hover:border-primary/40">
                    <FotoArticulo
                      src={a.foto}
                      alt={a.nombre}
                      categoria={a.categoria}
                      className="aspect-square w-full"
                      iconClassName="w-10 h-10"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <CardContent className="space-y-1.5 pb-4">
                      <Badge variant="outline" className="text-xs">
                        {a.categoria}
                      </Badge>
                      <p className="truncate text-sm font-medium">{a.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.marca} · {a.modelo}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-sm font-semibold">
                          {formatMoney(a.precio)}
                        </span>
                        <Badge variant={a.disponible ? "secondary" : "destructive"}>
                          {a.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filtrados.length === 0 && (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No hay artículos que coincidan con tu búsqueda.
              </p>
            )}

            {filtrados.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
