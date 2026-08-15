"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginasVisibles } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  className?: string;
}

export function Paginacion({ pagina, totalPaginas, onCambiar, className }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onCambiar(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {paginasVisibles(pagina, totalPaginas).map((p, i) =>
        p === "..." ? (
          <span
            key={i === 1 ? "ellipsis-start" : "ellipsis-end"}
            className="px-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === pagina ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onCambiar(p)}
            aria-label={`Página ${p}`}
            aria-current={p === pagina ? "page" : undefined}
            className={cn("font-mono", p === pagina && "pointer-events-none")}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
