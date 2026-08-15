/** Ventana de páginas visibles con elipsis pa listas largas. */
export function paginasVisibles(actual: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const paginas: (number | "...")[] = [1];
  if (actual > 3) paginas.push("...");
  for (let p = Math.max(2, actual - 1); p <= Math.min(total - 1, actual + 1); p++) {
    paginas.push(p);
  }
  if (actual < total - 2) paginas.push("...");
  paginas.push(total);
  return paginas;
}
