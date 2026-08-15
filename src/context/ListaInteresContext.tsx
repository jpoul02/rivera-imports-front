"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ItemInteres {
  articuloId: number;
  nombre: string;
  cantidad: number;
}

interface ListaInteresContextValue {
  items: ItemInteres[];
  total: number;
  agregar: (articuloId: number, nombre: string) => void;
  actualizarCantidad: (articuloId: number, cantidad: number) => void;
  quitar: (articuloId: number) => void;
  limpiar: () => void;
}

const STORAGE_KEY = "rivera-imports-lista-interes";

const ListaInteresContext = createContext<ListaInteresContextValue | null>(null);

function leerAlmacenamiento(): ItemInteres[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ItemInteres[]) : [];
  } catch {
    return [];
  }
}

export function ListaInteresProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemInteres[]>([]);

  useEffect(() => {
    // localStorage no existe en el servidor; se lee recién al montar en cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(leerAlmacenamiento());
  }, []);

  const persistir = useCallback((siguiente: ItemInteres[]) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(siguiente));
    }
  }, []);

  const agregar = useCallback(
    (articuloId: number, nombre: string) => {
      setItems((actuales) => {
        const existente = actuales.find((i) => i.articuloId === articuloId);
        const siguiente = existente
          ? actuales.map((i) =>
              i.articuloId === articuloId ? { ...i, cantidad: i.cantidad + 1 } : i
            )
          : [...actuales, { articuloId, nombre, cantidad: 1 }];
        persistir(siguiente);
        return siguiente;
      });
    },
    [persistir]
  );

  const actualizarCantidad = useCallback(
    (articuloId: number, cantidad: number) => {
      setItems((actuales) => {
        const siguiente =
          cantidad <= 0
            ? actuales.filter((i) => i.articuloId !== articuloId)
            : actuales.map((i) => (i.articuloId === articuloId ? { ...i, cantidad } : i));
        persistir(siguiente);
        return siguiente;
      });
    },
    [persistir]
  );

  const quitar = useCallback(
    (articuloId: number) => {
      setItems((actuales) => {
        const siguiente = actuales.filter((i) => i.articuloId !== articuloId);
        persistir(siguiente);
        return siguiente;
      });
    },
    [persistir]
  );

  const limpiar = useCallback(() => {
    persistir([]);
    setItems([]);
  }, [persistir]);

  const total = items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <ListaInteresContext.Provider
      value={{ items, total, agregar, actualizarCantidad, quitar, limpiar }}
    >
      {children}
    </ListaInteresContext.Provider>
  );
}

export function useListaInteres() {
  const ctx = useContext(ListaInteresContext);
  if (!ctx) throw new Error("useListaInteres debe usarse dentro de ListaInteresProvider");
  return ctx;
}
