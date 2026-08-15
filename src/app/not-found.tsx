import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { BlueprintRotor } from "@/components/common/BlueprintRotor";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 racing-stripe" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <BlueprintRotor className="h-[32rem] w-[32rem]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
          REF. 404 — PIEZA NO ENCONTRADA
        </p>
        <h1 className="display-title mt-3 text-7xl sm:text-8xl">404</h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          No encontramos esta página. Puede que la ruta cambió o el enlace ya no existe.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="h-10">
            <Link href="/catalogo">
              <Search className="h-4 w-4" />
              Ver catálogo
            </Link>
          </Button>
          <Button asChild className="h-10">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
