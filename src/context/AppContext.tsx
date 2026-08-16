"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppConfig as ApiAppConfig, Articulo, Venta } from "@/types";

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
  config: AppConfig;
}

interface AppContextValue extends AppState {
  updateConfig: (data: Partial<AppConfig>) => Promise<void>;
}

const STORAGE_KEY = "rivera-imports-app-state";

const initialState: AppState = {
  articulos: [],
  ventas: [],
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

function readStoredState(): AppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      articulos: Array.isArray(parsed.articulos) ? parsed.articulos : [],
      ventas: Array.isArray(parsed.ventas) ? parsed.ventas : [],
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
  const [articulos, ventas, config] = await Promise.all([
    api.getArticulos(),
    api.getVentas(),
    api.getConfiguracion(),
  ]);

  return {
    articulos,
    ventas: ventas.map(mapVenta),
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

  return (
    <AppContext.Provider
      value={{
        ...state,
        updateConfig,
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