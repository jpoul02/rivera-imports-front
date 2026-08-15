"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { canAccessPath, homePath } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, permisos } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const debeCambiarPassword = !!user?.debe_cambiar_password;
  const allowed = canAccessPath(pathname, permisos);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (debeCambiarPassword) {
      if (pathname !== "/cambiar-password") router.replace("/cambiar-password");
      return;
    }
    if (!allowed) {
      router.replace(homePath(permisos));
    }
  }, [isLoading, isAuthenticated, debeCambiarPassword, pathname, allowed, permisos, router]);

  if (
    isLoading ||
    !isAuthenticated ||
    (debeCambiarPassword && pathname !== "/cambiar-password") ||
    (!debeCambiarPassword && !allowed)
  ) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-60 bg-sidebar lg:block" />
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-col lg:pl-60">
          <MobileHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AppProvider>
  );
}
