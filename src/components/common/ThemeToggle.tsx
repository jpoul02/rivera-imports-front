"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Guardia de hidratación estándar de next-themes: el servidor no conoce
    // el tema, así que se espera al montaje en cliente antes de renderizarlo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className={cn("size-8", className)} />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "relative text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
        className
      )}
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-transform duration-200 ease-out dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute inset-0 m-auto h-4 w-4 scale-0 rotate-90 transition-transform duration-200 ease-out dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
