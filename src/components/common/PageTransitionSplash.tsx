"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PickupLoader } from "@/components/common/PickupLoader";
import { cn } from "@/lib/utils";

const DURACION_SALIDA = 400;

/** Splash de transición entre cada page del sitio (catálogo y admin) — el pickup se arma pieza por pieza. */
export function PageTransitionSplash() {
  const pathname = usePathname();
  const pathnameAnterior = useRef(pathname);
  const [fase, setFase] = useState<"visible" | "saliendo" | "oculto">("visible");

  useEffect(() => {
    if (pathnameAnterior.current === pathname) return;
    pathnameAnterior.current = pathname;
    setFase("visible");
  }, [pathname]);

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
        "fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 duration-400 ease-out transition-opacity",
        fase === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <PickupLoader onComplete={() => setFase("saliendo")} className="w-64" />
    </div>
  );
}
