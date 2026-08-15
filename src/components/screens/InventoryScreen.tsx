"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Paginacion } from "@/components/common/Paginacion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function InventoryScreen() {
  const { hasPermiso } = useAuth();
  const { data: articulos, loading } = useFetch(api.getArticulos);
  const { data: catalogos } = useFetch(api.getCatalogos);
  const { data: config } = useFetch(api.getConfiguracion);

  const umbral = config?.umbral_stock_bajo ?? 5;

  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;

  const appliedCount = [categoriaId, marcaId, soloStockBajo ? "1" : ""].filter(Boolean).length;

  const filtrados = useMemo(() => {
    if (!articulos) return [];
    const q = busqueda.trim().toLowerCase();
    return articulos.filter((a) => {
      if (q && ![a.nombre, a.marca, a.modelo, a.categoria].some((v) => v.toLowerCase().includes(q)))
        return false;
      if (categoriaId && a.categoria_id !== Number(categoriaId)) return false;
      if (marcaId && a.marca_id !== Number(marcaId)) return false;
      if (soloStockBajo && a.stock > umbral) return false;
      return true;
    });
  }, [articulos, busqueda, categoriaId, marcaId, soloStockBajo, umbral]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));

  if (pagina > totalPaginas) {
    setPagina(totalPaginas);
  }

  const paginados = useMemo(
    () => filtrados.slice((pagina - 1) * porPagina, pagina * porPagina),
    [filtrados, pagina]
  );

  const limpiarFiltros = () => {
    setCategoriaId("");
    setMarcaId("");
    setSoloStockBajo(false);
    setPagina(1);
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Agotado</Badge>;
    if (stock <= umbral)
      return (
        <Badge variant="outline" className="border-primary/40 text-primary">
          {stock} uds — bajo
        </Badge>
      );
    return <Badge variant="secondary">{stock} uds</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl sm:text-4xl">INVENTARIO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtrados.length} de {articulos?.length ?? 0} artículos
          </p>
        </div>
        {hasPermiso("articulos_gestionar") && (
          <Button asChild className="h-10">
            <Link href="/products/add">
              <Plus className="h-4 w-4" />
              Agregar artículo
            </Link>
          </Button>
        )}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre, marca, modelo o categoría..."
            className="h-10 pl-9"
          />
        </div>

        <Popover open={filtrosOpen} onOpenChange={setFiltrosOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {appliedCount > 0 && (
                <Badge className="ml-1 h-5 min-w-5 rounded-full px-1.5">{appliedCount}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Categoría</p>
              <ComboboxSelect
                items={(catalogos?.categorias ?? []).map((c) => ({
                  value: String(c.id),
                  label: c.nombre,
                }))}
                value={categoriaId}
                onChange={(v) => {
                  setCategoriaId(v);
                  setPagina(1);
                }}
                placeholder="Todas las categorías"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Marca</p>
              <ComboboxSelect
                items={(catalogos?.marcas ?? []).map((m) => ({
                  value: String(m.id),
                  label: m.nombre,
                }))}
                value={marcaId}
                onChange={(v) => {
                  setMarcaId(v);
                  setPagina(1);
                }}
                placeholder="Todas las marcas"
              />
            </div>
            <Button
              variant={soloStockBajo ? "default" : "outline"}
              className="h-10 w-full"
              onClick={() => {
                setSoloStockBajo((v) => !v);
                setPagina(1);
              }}
            >
              Solo stock bajo
            </Button>
          </PopoverContent>
        </Popover>

        {appliedCount > 0 && (
          <Button
            variant="ghost"
            className="h-10 font-semibold text-primary"
            onClick={limpiarFiltros}
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla desktop */}
      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16" />
              <TableHead>Artículo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginados.map((a) => (
              <TableRow key={a.id} className="group">
                <TableCell className="py-2">
                  <FotoArticulo
                    src={a.foto}
                    alt={a.nombre}
                    className="h-11 w-11 rounded-md"
                    iconClassName="w-4 h-4"
                    sizes="44px"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/products/${a.id}`}
                    className="font-medium underline-offset-4 group-hover:text-primary group-hover:underline"
                  >
                    {a.nombre}
                  </Link>
                  <p className="max-w-72 truncate text-xs text-muted-foreground">
                    {a.descripcion}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{a.categoria}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {a.marca} <span className="text-muted-foreground">· {a.modelo}</span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(a.precio)}
                </TableCell>
                <TableCell className="text-right">{stockBadge(a.stock)}</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No hay artículos que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Cards móvil */}
      <div className="grid gap-3 md:hidden">
        {paginados.map((a) => (
          <Link key={a.id} href={`/products/${a.id}`}>
            <Card className="py-0 transition-colors duration-150 active:bg-muted">
              <CardContent className="flex items-center gap-3 p-3">
                <FotoArticulo
                  src={a.foto}
                  alt={a.nombre}
                  className="h-16 w-16 shrink-0 rounded-md"
                  sizes="64px"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.categoria} · {a.marca} {a.modelo}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {formatMoney(a.precio)}
                    </span>
                    {stockBadge(a.stock)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtrados.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay artículos que coincidan con los filtros.
          </p>
        )}
      </div>

      {filtrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">
              {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, filtrados.length)}
            </span>{" "}
            de {filtrados.length} artículos
          </p>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}
    </div>
  );
}
