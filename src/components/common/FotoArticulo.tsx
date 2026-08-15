"use client";

import { useState } from "react";
import Image from "next/image";
import { Cog } from "lucide-react";
import { cn } from "@/lib/utils";

interface FotoArticuloProps {
  src: string;
  alt: string;
  className?: string;
  iconClassName?: string;
  sizes?: string;
}

/** Foto de artículo con fallback de marca cuando no hay imagen o falla la carga. */
export function FotoArticulo({
  src,
  alt,
  className,
  iconClassName,
  sizes = "200px",
}: FotoArticuloProps) {
  const [error, setError] = useState(false);
  const showFallback = !src || error;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-neutral-900",
        className
      )}
    >
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-x-0 top-0 h-1 racing-stripe opacity-80" />
          <Cog
            className={cn("text-neutral-700", iconClassName ?? "w-8 h-8")}
            strokeWidth={1.5}
          />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
