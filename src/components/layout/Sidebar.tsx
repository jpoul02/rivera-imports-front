"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { menuItemsFor } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function LogoRivera({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/pickup.svg"
        alt="Rivera Imports"
        width={324}
        height={110}
        className="h-9 w-auto"
      />
      {!compact && (
        <div className="leading-none">
          <p className="display-title text-lg text-white tracking-wider">RIVERA</p>
          <p className="display-title text-xs text-primary tracking-[0.35em]">IMPORTS</p>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { permisos } = useAuth();

  const items = menuItemsFor(permisos);

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active =
          item.path === "/"
            ? pathname === "/"
            : pathname === item.path || pathname.startsWith(item.path + "/");
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
              "transition-colors duration-150",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary",
                "transition-opacity duration-150",
                active ? "opacity-100" : "opacity-0"
              )}
            />
            <item.icon
              className={cn(
                "h-4.5 w-4.5 shrink-0",
                active ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarFooter() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <Avatar className="h-9 w-9 rounded-sm">
          <AvatarFallback className="rounded-sm bg-primary/15 text-primary font-semibold">
            {user.nombre.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-white">{user.nombre}</p>
          <p className="truncate text-xs capitalize text-sidebar-foreground/70">
            {user.roles.join(" · ") || "sin rol"}
          </p>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={logout}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <LogoRivera />
      </div>
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}
