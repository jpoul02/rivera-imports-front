"use client";

import Link from "next/link";
import {
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Globe,
  Store,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display-title text-xl">{children}</h2>
      <div className="mt-1 h-0.5 w-10 bg-primary" />
    </div>
  );
}

export function DashboardScreen() {
  const { hasPermiso } = useAuth();
  const { data, loading } = useFetch(api.getDashboard);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpis = [
    { label: "Ingresos totales", value: formatMoney(data.ingresos_totales), icon: DollarSign },
    { label: "Unidades vendidas", value: String(data.unidades_vendidas), icon: ShoppingCart },
    { label: "Artículos en catálogo", value: String(data.total_articulos), icon: Package },
    {
      label: "Stock bajo",
      value: String(data.stock_bajo.length),
      icon: AlertTriangle,
      alerta: data.stock_bajo.length > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl sm:text-4xl">DASHBOARD</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen general del negocio</p>
        </div>
        {hasPermiso("articulos_gestionar") && (
          <Button asChild className="h-10">
            <Link href="/products/add">
              Agregar artículo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative gap-2 overflow-hidden py-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary/80" />
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </CardTitle>
              <kpi.icon
                className={
                  kpi.alerta ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"
                }
              />
            </CardHeader>
            <CardContent>
              <p className={`display-title text-3xl ${kpi.alerta ? "text-primary" : ""}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Ventas recientes */}
        <Card className="xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <SectionTitle>VENTAS RECIENTES</SectionTitle>
            <Button asChild variant="ghost" className="h-10 font-semibold text-primary">
              <Link href="/sales?tab=historial">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.ventas_recientes.map((venta, i) => (
              <div key={venta.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    {venta.tipo_venta === "web" ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Store className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{venta.articulo_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {venta.cliente_nombre || "Cliente mostrador"} · {formatDateTime(venta.fecha)}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {venta.tipo_venta === "web" ? "Web" : "Física"}
                  </Badge>
                  <p className="font-mono text-sm font-semibold">{formatMoney(venta.total)}</p>
                </div>
              </div>
            ))}
            {data.ventas_recientes.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay ventas registradas.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          {/* Top artículos */}
          <Card>
            <CardHeader>
              <SectionTitle>MÁS VENDIDOS</SectionTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.top_articulos.map((t, i) => (
                <Link
                  key={t.articulo_id}
                  href={`/products/${t.articulo_id}`}
                  className="flex items-center gap-3 rounded-md p-1.5 transition-colors duration-150 hover:bg-muted"
                >
                  <span className="display-title w-6 text-center text-lg text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.nombre}</p>
                    <p className="text-xs text-muted-foreground">{t.unidades} unidades</p>
                  </div>
                  <p className="font-mono text-sm font-semibold">{formatMoney(t.ingresos)}</p>
                </Link>
              ))}
              {data.top_articulos.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin datos aún.</p>
              )}
            </CardContent>
          </Card>

          {/* Stock bajo */}
          <Card>
            <CardHeader>
              <SectionTitle>STOCK BAJO</SectionTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.stock_bajo.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  href={`/products/${a.id}`}
                  className="flex items-center gap-3 rounded-md p-1.5 transition-colors duration-150 hover:bg-muted"
                >
                  <FotoArticulo
                    src={a.foto}
                    alt={a.nombre}
                    className="h-10 w-10 rounded-md"
                    iconClassName="w-4 h-4"
                    sizes="40px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.marca} {a.modelo}
                    </p>
                  </div>
                  <Badge variant="destructive">{a.stock} uds</Badge>
                </Link>
              ))}
              {data.stock_bajo.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todo el inventario está sano.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
