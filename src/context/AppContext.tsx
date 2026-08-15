"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppConfig as ApiAppConfig, Articulo, Usuario, Venta, UserRole } from "@/types";

interface AppUsuario {
  id: number;
  nombre: string;
  usuario: string;
  rol: UserRole;
  activo: boolean;
}

interface AppVenta {
  id: number;
  articuloId: number;
  articuloNombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoVenta: "fisica" | "web";
  clienteNombre: string;
  clienteTelefono: string;
  departamento?: string | null;
  direccion?: string | null;
  notas: string;
  fecha: string;
  usuarioId?: number | null;
}

interface AppConfig {
  nombreNegocio: string;
  umbralStockBajo: number;
}

interface AppState {
  articulos: Articulo[];
  ventas: AppVenta[];
  usuarios: AppUsuario[];
  config: AppConfig;
}

interface AppContextValue extends AppState {
  addUsuario: (usuario: Omit<AppUsuario, "id">) => void;
  updateUsuario: (id: number, data: Partial<Omit<AppUsuario, "id">>) => void;
  updateConfig: (data: Partial<AppConfig>) => Promise<void>;
  resetDatos: () => Promise<void>;
}

const STORAGE_KEY = "rivera-imports-app-state";

const initialState: AppState = {
  articulos: [],
  ventas: [],
  usuarios: [],
  config: {
    nombreNegocio: "Rivera Imports",
    umbralStockBajo: 5,
  },
};

const AppContext = createContext<AppContextValue | null>(null);

function mapConfig(config: ApiAppConfig): AppConfig {
  return {
    nombreNegocio: config.nombre_negocio,
    umbralStockBajo: config.umbral_stock_bajo,
  };
}

function mapUsuario(usuario: Usuario): AppUsuario {
  const rol: UserRole = usuario.roles.includes("administrador")
    ? "administrador"
    : usuario.roles.includes("gestor")
      ? "gestor"
      : "vendedor";

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    usuario: usuario.usuario,
    rol,
    activo: usuario.activo,
  };
}

function mapVenta(venta: Venta): AppVenta {
  return {
    id: venta.id,
    articuloId: venta.articulo_id,
    articuloNombre: venta.articulo_nombre,
    cantidad: venta.cantidad,
    precioUnitario: venta.precio_unitario,
    total: venta.total,
    tipoVenta: venta.tipo_venta,
    clienteNombre: venta.cliente_nombre,
    clienteTelefono: venta.cliente_telefono,
    departamento: venta.departamento ?? null,
    direccion: venta.direccion ?? null,
    notas: venta.notas,
    fecha: venta.fecha,
    usuarioId: venta.usuario_id ?? null,
  };
}

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function readStoredState(): AppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      articulos: Array.isArray(parsed.articulos) ? parsed.articulos : [],
      ventas: Array.isArray(parsed.ventas) ? parsed.ventas : [],
      usuarios: Array.isArray(parsed.usuarios) ? parsed.usuarios : [],
      config: {
        ...initialState.config,
        ...(parsed.config ?? {}),
      },
    };
  } catch {
    return null;
  }
}

function persistState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadRemoteState(): Promise<AppState> {
  const [articulos, ventas, usuarios, config] = await Promise.all([
    api.getArticulos(),
    api.getVentas(),
    api.getUsuarios(),
    api.getConfiguracion(),
  ]);

  return {
    articulos,
    ventas: ventas.map(mapVenta),
    usuarios: usuarios.map(mapUsuario),
    config: mapConfig(config),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    let mounted = true;

    const stored = readStoredState();
    if (stored) {
      setState(stored);
      return () => {
        mounted = false;
      };
    }

    loadRemoteState()
      .then((nextState) => {
        if (!mounted) return;
        setState(nextState);
        persistState(nextState);
      })
      .catch(() => {
        // Keep the built-in defaults if the API is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addUsuario = useCallback((usuario: Omit<AppUsuario, "id">) => {
    setState((current) => {
      const nextState = {
        ...current,
        usuarios: [...current.usuarios, { ...usuario, id: nextId(current.usuarios) }],
      };
      persistState(nextState);
      return nextState;
    });
  }, []);

  const updateUsuario = useCallback((id: number, data: Partial<Omit<AppUsuario, "id">>) => {
    setState((current) => {
      const nextState = {
        ...current,
        usuarios: current.usuarios.map((usuario) =>
          usuario.id === id ? { ...usuario, ...data } : usuario
        ),
      };
      persistState(nextState);
      return nextState;
    });
  }, []);

  const updateConfig = useCallback(async (data: Partial<AppConfig>) => {
    setState((current) => {
      const nextState = { ...current, config: { ...current.config, ...data } };
      persistState(nextState);
      return nextState;
    });

    try {
      await api.guardarConfiguracion({
        ...(data.nombreNegocio !== undefined && { nombre_negocio: data.nombreNegocio }),
        ...(data.umbralStockBajo !== undefined && { umbral_stock_bajo: data.umbralStockBajo }),
      });
    } catch {
      // The local state already reflects the change.
    }
  }, []);

  const resetDatos = useCallback(async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    try {
      const nextState = await loadRemoteState();
      setState(nextState);
      persistState(nextState);
    } catch {
      setState(initialState);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        addUsuario,
        updateUsuario,
        updateConfig,
        resetDatos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}