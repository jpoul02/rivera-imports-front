export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface ModeloItem {
  id: number;
  nombre: string;
  marca_id: number;
}

export interface Catalogos {
  categorias: CatalogoItem[];
  marcas: CatalogoItem[];
  modelos: ModeloItem[];
}

export interface Articulo {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria: string;
  marca_id: number;
  marca: string;
  modelo_id: number;
  modelo: string;
  foto: string;
  precio: number;
  descripcion: string;
  stock: number;
  visible_publico: boolean;
  fecha_ingreso: string;
}

export interface CatalogoArticulo {
  id: number;
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  foto: string;
  precio: number;
  descripcion: string;
  disponible: boolean;
}

export interface CatalogoPublico {
  articulos: CatalogoArticulo[];
  categorias: CatalogoItem[];
  marcas: CatalogoItem[];
}

export type TipoMovimiento = "entrada" | "salida" | "ajuste";

export interface MovimientoStock {
  id: number;
  articulo_id: number;
  fecha: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  nota: string;
}

export type TipoVenta = "fisica" | "web";

export interface Venta {
  id: number;
  articulo_id: number;
  articulo_nombre: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  tipo_venta: TipoVenta;
  cliente_nombre: string;
  cliente_telefono: string;
  departamento?: string | null;
  direccion?: string | null;
  notas: string;
  fecha: string;
  usuario_id?: number | null;
}

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  email: string | null;
  activo: boolean;
  roles: string[];
  permisos: string[];
  notif_nueva_venta: boolean;
  notif_stock_bajo: boolean;
  notif_reporte_diario: boolean;
}

export type UserRole = "administrador" | "gestor" | "vendedor";

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: string[];
  es_sistema: boolean;
  usuarios_count: number;
}

export interface Permiso {
  clave: string;
  etiqueta: string;
}

export interface AppConfig {
  nombre_negocio: string;
  umbral_stock_bajo: number;
  email_configurado: boolean;
  email_from: string | null;
}

export interface DashboardData {
  ingresos_totales: number;
  unidades_vendidas: number;
  total_articulos: number;
  umbral_stock_bajo: number;
  stock_bajo: Articulo[];
  ventas_recientes: Venta[];
  top_articulos: { articulo_id: number; nombre: string; unidades: number; ingresos: number }[];
}

export interface AnalyticsData {
  ingresos_por_dia: { fecha: string; ingresos: number }[];
  por_categoria: { categoria: string; ingresos: number; unidades: number }[];
  resumen: {
    ingresos_acumulados: number;
    ticket_promedio: number;
    valor_inventario: number;
    ventas_fisicas: number;
    ventas_web: number;
  };
}
