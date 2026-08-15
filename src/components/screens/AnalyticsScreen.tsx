"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useApp } from "@/context/AppContext";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfigIngresos = {
  ingresos: { label: "Ingresos", color: "var(--chart-1)" },
} satisfies ChartConfig;

const chartConfigCategorias = {
  ingresos: { label: "Ingresos", color: "var(--chart-1)" },
  unidades: { label: "Unidades", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function AnalyticsScreen() {
  const { articulos, ventas } = useApp();

  const porDia = useMemo(() => {
    const dias = new Map<string, number>();
    const hoy = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      dias.set(d.toISOString().slice(0, 10), 0);
    }
    for (const v of ventas) {
      const key = v.fecha.slice(0, 10);
      if (dias.has(key)) dias.set(key, (dias.get(key) ?? 0) + v.total);
    }
    return [...dias.entries()].map(([fecha, ingresos]) => ({
      fecha: new Date(`${fecha}T00:00:00`).toLocaleDateString("es-SV", {
        day: "2-digit",
        month: "short",
      }),
      ingresos: Number(ingresos.toFixed(2)),
    }));
  }, [ventas]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, { ingresos: number; unidades: number }>();
    for (const v of ventas) {
      const articulo = articulos.find((a) => a.id === v.articuloId);
      const cat = articulo?.categoria ?? "Otros";
      const prev = map.get(cat) ?? { ingresos: 0, unidades: 0 };
      map.set(cat, {
        ingresos: prev.ingresos + v.total,
        unidades: prev.unidades + v.cantidad,
      });
    }
    return [...map.entries()]
      .map(([categoria, data]) => ({ categoria, ...data }))
      .sort((a, b) => b.ingresos - a.ingresos);
  }, [ventas, articulos]);

  const resumen = useMemo(() => {
    const ingresos = ventas.reduce((acc, v) => acc + v.total, 0);
    const ticketPromedio = ventas.length ? ingresos / ventas.length : 0;
    const valorInventario = articulos.reduce((acc, a) => acc + a.precio * a.stock, 0);
    const web = ventas.filter((v) => v.tipoVenta === "web").length;
    return { ingresos, ticketPromedio, valorInventario, web, fisicas: ventas.length - web };
  }, [ventas, articulos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-title text-3xl sm:text-4xl">ANALÍTICAS</h1>
        <div className="mt-2 h-0.5 w-12 bg-primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Ingresos acumulados", value: formatMoney(resumen.ingresos) },
          { label: "Ticket promedio", value: formatMoney(resumen.ticketPromedio) },
          { label: "Valor del inventario", value: formatMoney(resumen.valorInventario) },
          { label: "Física / Web", value: `${resumen.fisicas} / ${resumen.web}` },
        ].map((kpi) => (
          <Card key={kpi.label} className="gap-1 py-5">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="display-title text-2xl">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="display-title text-lg">
              INGRESOS — ÚLTIMOS 14 DÍAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigIngresos} className="h-72 w-full">
              <LineChart data={porDia} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="ingresos"
                  type="monotone"
                  stroke="var(--color-ingresos)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="display-title text-lg">VENTAS POR CATEGORÍA</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigCategorias} className="h-72 w-full">
              <BarChart data={porCategoria} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="categoria"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  angle={-20}
                  height={50}
                  textAnchor="end"
                />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
