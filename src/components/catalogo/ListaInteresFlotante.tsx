"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, mensajeDeError } from "@/lib/api";
import { codificarLista } from "@/lib/lista-codigo";
import { useListaInteres } from "@/context/ListaInteresContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

function construirEnlaceLista(items: { articuloId: number; cantidad: number }[]) {
  return `${window.location.origin}/catalogo/lista?c=${codificarLista(items)}`;
}

function construirMensaje(items: { articuloId: number; nombre: string; cantidad: number }[]) {
  const lineas = items.map((i) => `• ${i.nombre} x${i.cantidad}`);
  return `Hola, me interesa comprar los siguientes productos (sujeto a disponibilidad):\n\n${lineas.join("\n")}\n\nVer lista: ${construirEnlaceLista(items)}`;
}

export function ListaInteresFlotante() {
  const { items, total, actualizarCantidad, quitar, limpiar } = useListaInteres();
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleConsultar = async () => {
    if (!NUMERO_WHATSAPP || items.length === 0) return;
    // Safari/iOS descarta window.open() si no ocurre síncrono dentro del
    // gesto de click — se abre en blanco ya, se navega después del await.
    const ventana = window.open("", "_blank");
    setEnviando(true);
    try {
      await api.consultarWhatsapp();
      const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(construirMensaje(items))}`;
      if (ventana) {
        ventana.location.href = url;
      } else {
        window.location.href = url;
      }
      setOpen(false);
    } catch (error) {
      ventana?.close();
      toast.error(mensajeDeError(error, "No se pudo procesar la consulta. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  };

  const tituloDeshabilitado = !NUMERO_WHATSAPP
    ? "Número de WhatsApp no configurado"
    : items.length === 0
      ? "Agregá artículos a tu lista primero"
      : undefined;

  return (
    <div className="fixed right-4 bottom-6 z-40 sm:right-6">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
          >
            <ShoppingBag className="h-6 w-6" />
            {total > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
                {total}
              </Badge>
            )}
            <span className="sr-only">Lista de interés</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="flex max-h-[70vh] w-80 flex-col gap-0 p-0 sm:w-96"
        >
          <div className="border-b p-4">
            <p className="text-sm font-semibold">Tu lista de interés</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Todavía no agregaste artículos.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.articuloId}
                className="flex items-center justify-between gap-2 rounded-md border p-3"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.nombre}</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Disminuir cantidad"
                    onClick={() => actualizarCantidad(item.articuloId, item.cantidad - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.cantidad}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Aumentar cantidad"
                    onClick={() => actualizarCantidad(item.articuloId, item.cantidad + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar de la lista"
                  onClick={() => quitar(item.articuloId)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t p-4">
            {items.length > 0 && (
              <Button variant="ghost" className="h-10" onClick={limpiar}>
                Vaciar lista
              </Button>
            )}
            <Button
              className="h-10"
              disabled={!NUMERO_WHATSAPP || items.length === 0 || enviando}
              title={tituloDeshabilitado}
              onClick={handleConsultar}
            >
              Consultar por WhatsApp
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
