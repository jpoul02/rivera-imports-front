"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ListChecks, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, mensajeDeError } from "@/lib/api";
import { codificarLista } from "@/lib/lista-codigo";
import { useListaInteres } from "@/context/ListaInteresContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

function construirEnlaceLista(items: { articuloId: number; cantidad: number }[]) {
  return `${window.location.origin}/catalogo/lista?c=${codificarLista(items)}`;
}

function construirMensaje(items: { articuloId: number; nombre: string; cantidad: number }[]) {
  const lineas = items.map((i) => `• ${i.nombre} x${i.cantidad}`);
  return `Hola, me interesa comprar los siguientes productos (sujeto a disponibilidad):\n\n${lineas.join("\n")}\n\nVer lista: ${construirEnlaceLista(items)}`;
}

export function CatalogoHeader() {
  const { items, total, actualizarCantidad, quitar, limpiar } = useListaInteres();
  const pathname = usePathname();
  const animar = pathname === "/catalogo";
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/catalogo" className="flex items-center gap-3">
          <Image
            src="/pickup.svg"
            alt="Rivera Imports"
            width={324}
            height={110}
            priority
            className={cn(
              "h-9 w-auto",
              animar && "transition-all duration-500 ease-out",
              animar && !mounted ? "-translate-x-4 opacity-0" : "translate-x-0 opacity-100"
            )}
          />
          <span className="display-title text-sm tracking-[0.3em] text-white">
            RIVERA IMPORTS
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 hover:text-white">
                <ListChecks className="h-5 w-5" />
                {total > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
                    {total}
                  </Badge>
                )}
                <span className="sr-only">Lista de interés</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Tu lista de interés</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-3 overflow-y-auto px-4">
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

              <SheetFooter>
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
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Link
            href="/login"
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Personal
          </Link>
        </div>
      </div>
    </header>
  );
}
