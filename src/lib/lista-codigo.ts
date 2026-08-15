export interface ItemListaCodigo {
  articuloId: number;
  cantidad: number;
}

/** Codifica la lista de interés en un token corto y opaco (base64url) — sin backend, todo vive en la URL. */
export function codificarLista(items: ItemListaCodigo[]): string {
  const raw = items.map((i) => `${i.articuloId}:${i.cantidad}`).join(",");
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodificarLista(codigo?: string): ItemListaCodigo[] {
  if (!codigo) return [];
  try {
    const base64 = codigo.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob(padded);
    return raw
      .split(",")
      .map((par) => {
        const [id, cantidad] = par.split(":").map(Number);
        return { articuloId: id, cantidad };
      })
      .filter(
        (i) =>
          Number.isInteger(i.articuloId) &&
          i.articuloId > 0 &&
          Number.isInteger(i.cantidad) &&
          i.cantidad > 0
      );
  } catch {
    return [];
  }
}
