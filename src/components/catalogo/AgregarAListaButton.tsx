"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useListaInteres } from "@/context/ListaInteresContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgregarAListaButtonProps {
  articuloId: number;
  nombre: string;
  className?: string;
}

export function AgregarAListaButton({ articuloId, nombre, className }: AgregarAListaButtonProps) {
  const { agregar } = useListaInteres();
  const [agregado, setAgregado] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    agregar(articuloId, nombre);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <Button
      type="button"
      variant={agregado ? "secondary" : "outline"}
      className={cn("h-10", className)}
      onClick={handleClick}
    >
      {agregado ? (
        <>
          <Check className="h-4 w-4" />
          Agregado
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Agregar
        </>
      )}
    </Button>
  );
}
