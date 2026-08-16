"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types";
import { api } from "@/lib/api";
import { homePath } from "@/lib/permissions";

interface AuthContextType {
  user: Usuario | null;
  permisos: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermiso: (permiso: string) => boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (usuario: string, password: string) => {
      const usuarioData = await api.login(usuario, password);
      setUser(usuarioData);
      router.push(
        usuarioData.debe_cambiar_password ? "/cambiar-password" : homePath(usuarioData.permisos)
      );
    },
    [router]
  );

  const logout = useCallback(() => {
    api.logout().finally(() => {
      setUser(null);
      router.push("/login");
    });
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.me());
    } catch {
      // token inválido: el interceptor redirige
    }
  }, []);

  const permisos = user?.permisos ?? [];

  return (
    <AuthContext.Provider
      value={{
        user,
        permisos,
        isAuthenticated: !!user,
        isLoading,
        hasPermiso: (p) => permisos.includes(p),
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
