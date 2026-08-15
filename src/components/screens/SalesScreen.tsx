"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Globe, Store, Minus, Plus, Receipt, Loader2 } from "lucide-react";
import { api, mensajeDeError } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { ComboboxSelect } from "@/components/common/ComboboxSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEPARTAMENTOS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad",
  "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador",
  "San Vicente", "Santa Ana", "Sonsonate", "Usulután",
];

export function SalesScreen({ defaultTab }: { defaultTab: string }) {
  const { data: articulos, refetch: refetchArticulos } = useFetch(api.getArticulos);
  const { data: ventas, refetch: refetchVentas } = useFetch(api.getVentas);

  const [articuloId, setArticuloId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [tipoVenta, setTipoVenta] = useState<"fisica" | "web">("fisica");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);

  const articulo = (articulos ?? []).find((a) => String(a.id) === articuloId);
  const total = articulo ? articulo.precio * cantidad : 0;

  const disponibles = useMemo(
    () =>
      (articulos ?? [])
        .filter((a) => a.stock > 0)
        .map((a) => ({
          value: String(a.id),
          label: a.nombre,
          sublabel: `${a.marca} ${a.modelo} · ${a.stock} en stock · ${formatMoney(a.precio)}`,
        })),
    [articulos]
  );

  const limpiar = () => {
    setArticuloId("");
    setCantidad(1);
    setClienteNombre("");
    setClienteTelefono("");
    setDepartamento("");
    setDireccion("");
    setNotas("");
  };

  const handleRegistrar = async () => {
    if (!articulo) {
      toast.error("Seleccioná un artículo");
      return;
    }
    if (cantidad < 1 || cantidad > articulo.stock) {
      toast.error(`Cantidad inválida — hay ${articulo.stock} unidades disponibles`);
      return;
    }
    if (tipoVenta === "web" && (!departamento || !direccion.trim())) {
      toast.error("Las ventas web necesitan departamento y dirección de envío");
      return;
    }
    setEnviando(true);
    try {
      await api.registrarVenta({
        articulo_id: articulo.id,
        cantidad,
        tipo_venta: tipoVenta,
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        ...(tipoVenta === "web" && { departamento, direccion: direccion.trim() }),
        notas: notas.trim(),
      });
      toast.success(`Venta registrada — ${formatMoney(total)}`);
      limpiar();
      refetchArticulos();
      refetchVentas();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo registrar la venta"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-title text-3xl sm:text-4xl">VENTAS</h1>
        <div className="mt-2 h-0.5 w-12 bg-primary" />
      </div>

      <Tabs defaultValue={defaultTab === "historial" ? "historial" : "registrar"}>
        <TabsList className="h-10">
          <TabsTrigger value="registrar">Registrar venta</TabsTrigger>
          <TabsTrigger value="historial">Historial ({(ventas ?? []).length})</TabsTrigger>
        </TabsList>

        {/* ── Registrar ── */}
        <TabsContent value="registrar" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="display-title text-lg">DATOS DE LA VENTA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Artículo</Label>
                  <ComboboxSelect
                    items={disponibles}
                    value={articuloId}
                    onChange={setArticuloId}
                    placeholder="Buscar artículo con stock..."
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        disabled={cantidad <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                        className="h-10 w-20 text-center font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        onClick={() =>
                          setCantidad((c) => (articulo ? Math.min(articulo.stock, c + 1) : c + 1))
                        }
                        disabled={!!articulo && cantidad >= articulo.stock}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {articulo && (
                      <p className="text-xs text-muted-foreground">
                        {articulo.stock} unidades disponibles
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de venta</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={tipoVenta === "fisica" ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setTipoVenta("fisica")}
                      >
                        <Store className="h-4 w-4" />
                        Física
                      </Button>
                      <Button
                        type="button"
                        variant={tipoVenta === "web" ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setTipoVenta("web")}
                      >
                        <Globe className="h-4 w-4" />
                        Web
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Nombre del cliente</Label>
                    <Input
                      id="cliente"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Cliente mostrador"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={clienteTelefono}
                      onChange={(e) =>
                        setClienteTelefono(e.target.value.replace(/[^\d-]/g, ""))
                      }
                      placeholder="0000-0000"
                      className="h-10 font-mono"
                    />
                  </div>
                </div>

                {tipoVenta === "web" && (
                  <div className="grid gap-5 rounded-md border border-primary/20 bg-primary/[0.03] p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <ComboboxSelect
                        items={DEPARTAMENTOS.map((d) => ({ value: d, label: d }))}
                        value={departamento}
                        onChange={setDepartamento}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección de envío</Label>
                      <Input
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Colonia, calle, número..."
                        className="h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Textarea
                    id="notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                    placeholder="Observaciones de la venta..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            <Card className="h-fit lg:col-span-2">
              <CardHeader>
                <CardTitle className="display-title flex items-center gap-2 text-lg">
                  <Receipt className="h-4 w-4 text-primary" />
                  RESUMEN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {articulo ? (
                  <div className="flex items-center gap-3">
                    <FotoArticulo
                      src={articulo.foto}
                      alt={articulo.nombre}
                      categoria={articulo.categoria}
                      className="h-14 w-14 shrink-0 rounded-md"
                      sizes="56px"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{articulo.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {articulo.marca} {articulo.modelo}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Seleccioná un artículo para ver el resumen.
                  </p>
                )}

                {articulo && (
                  <div className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Precio unitario</span>
                      <span className="font-mono">{formatMoney(articulo.precio)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cantidad</span>
                      <span className="font-mono">×{cantidad}</span>
                    </div>
                    <div className="flex items-baseline justify-between border-t pt-3">
                      <span className="display-title text-lg">TOTAL</span>
                      <span className="font-mono text-2xl font-bold text-primary">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="h-10 w-full"
                  disabled={!articulo || enviando}
                  onClick={handleRegistrar}
                >
                  {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar venta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Historial ── */}
        <TabsContent value="historial" className="mt-6">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ventas ?? []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDateTime(v.fecha)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{v.articulo_nombre}</p>
                      {v.notas && (
                        <p className="max-w-56 truncate text-xs text-muted-foreground">
                          {v.notas}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{v.cliente_nombre || "Cliente mostrador"}</p>
                      {v.tipo_venta === "web" && v.departamento && (
                        <p className="text-xs text-muted-foreground">{v.departamento}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.tipo_venta === "web" ? "default" : "secondary"}>
                        {v.tipo_venta === "web" ? "Web" : "Física"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{v.cantidad}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatMoney(v.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {(ventas ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Aún no hay ventas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
