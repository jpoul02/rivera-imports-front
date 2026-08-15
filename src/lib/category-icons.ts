import {
  CarFront,
  Cog,
  Disc,
  Droplet,
  Filter,
  type LucideIcon,
  Package,
  Settings2,
  Waves,
  Zap,
} from "lucide-react";

const ICONOS_POR_CATEGORIA: Record<string, LucideIcon> = {
  frenos: Disc,
  motor: Cog,
  "suspensión": Waves,
  suspension: Waves,
  "eléctrico": Zap,
  electrico: Zap,
  filtros: Filter,
  "transmisión": Settings2,
  transmision: Settings2,
  "carrocería": CarFront,
  carroceria: CarFront,
  lubricantes: Droplet,
};

/** Ícono representativo de una categoría de repuesto; genérico si no hay match. */
export function categoriaIcon(categoria: string): LucideIcon {
  return ICONOS_POR_CATEGORIA[categoria.trim().toLowerCase()] ?? Package;
}
