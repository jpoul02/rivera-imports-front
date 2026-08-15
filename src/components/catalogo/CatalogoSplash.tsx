"use client";

import { useEffect, useState } from "react";
import { PickupLoader } from "@/components/common/PickupLoader";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rivera-imports-splash-visto";
const DURACION_SALIDA = 400;

/** Splash de carga mobile-only, solo la primera vez por sesión — el pickup se arma pieza por pieza. */
export function CatalogoSplash() {
  const [fase, setFase] = useState<"oculto" | "visible" | "saliendo">("oculto");

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "1");
    setFase("visible");
  }, []);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const timer = setTimeout(() => setFase("oculto"), DURACION_SALIDA);
    return () => clearTimeout(timer);
  }, [fase]);

  if (fase === "oculto") return null;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 duration-400 ease-out transition-opacity sm:hidden",
        fase === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <PickupLoader onComplete={() => setFase("saliendo")} className="w-64" />
    </div>
  );
}
