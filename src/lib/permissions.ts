import {
  LayoutDashboard,
  Package,
  PlusSquare,
  ShoppingCart,
  BookOpen,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react";

export interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  /** Permiso requerido. null = visible para cualquier usuario autenticado. */
  permiso: string | null;
}

export const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permiso: "dashboard" },
  { icon: Package, label: "Inventario", path: "/inventory", permiso: "inventario" },
  { icon: PlusSquare, label: "Agregar Artículo", path: "/products/add", permiso: "articulos_gestionar" },
  { icon: ShoppingCart, label: "Ventas", path: "/sales", permiso: "ventas" },
  { icon: BookOpen, label: "Catálogos", path: "/catalogs", permiso: "catalogos" },
  { icon: BarChart3, label: "Analíticas", path: "/analytics", permiso: "analiticas" },
  { icon: Users, label: "Usuarios", path: "/users", permiso: "usuarios" },
  { icon: ShieldCheck, label: "Roles", path: "/roles", permiso: "roles" },
  { icon: Settings, label: "Configuración", path: "/settings", permiso: null },
];

export function menuItemsFor(permisos: string[]): MenuItem[] {
  return allMenuItems.filter(
    (item) => item.permiso === null || permisos.includes(item.permiso)
  );
}

export function canAccessPath(pathname: string, permisos: string[]): boolean {
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true;
  // Detalle de artículo: lo ve quien ve inventario o registra ventas
  if (pathname.startsWith("/products/") && pathname !== "/products/add") {
    return permisos.includes("inventario") || permisos.includes("ventas");
  }
  const exact = allMenuItems.find((item) => item.path === pathname);
  if (exact) return exact.permiso === null || permisos.includes(exact.permiso);
  const sorted = [...allMenuItems].sort((a, b) => b.path.length - a.path.length);
  const match = sorted.find(
    (item) => item.path !== "/" && pathname.startsWith(item.path + "/")
  );
  if (match) return match.permiso === null || permisos.includes(match.permiso);
  return true;
}

export function homePath(permisos: string[]): string {
  if (permisos.includes("dashboard")) return "/";
  if (permisos.includes("inventario")) return "/inventory";
  if (permisos.includes("ventas")) return "/sales";
  return "/settings";
}
