"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { cn } from "@/lib/utils";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;

interface SubirFotoArticuloProps {
  fotoActual: string;
  nombre: string;
  onFileChange: (file: File | null) => void;
  className?: string;
}

/** Thumbnail clickeable que abre el selector de archivo y valida tipo/tamaño antes de aceptar. */
export function SubirFotoArticulo({
  fotoActual,
  nombre,
  onFileChange,
  className,
}: SubirFotoArticuloProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error("Formato no permitido. Usá JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`La imagen no puede superar ${MAX_MB}MB`);
      e.target.value = "";
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="block w-40 cursor-pointer transition-opacity hover:opacity-80"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview de un blob local, next/image no puede optimizarlo
          <img
            src={preview}
            alt={nombre || "Vista previa"}
            className="aspect-square w-full rounded-md object-cover ring-1 ring-border"
          />
        ) : (
          <FotoArticulo
            src={fotoActual}
            alt={nombre || "Vista previa"}
            className="aspect-square w-full rounded-md ring-1 ring-border"
            iconClassName="w-8 h-8"
            sizes="160px"
          />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        Click en la foto pa subir una nueva. JPG, PNG o WEBP, máx {MAX_MB}MB.
      </p>
    </div>
  );
}
