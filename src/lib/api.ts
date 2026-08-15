import axios, { AxiosError } from "axios";
import type {
  AnalyticsData,
  AppConfig,
  Articulo,
  CatalogoArticulo,
  CatalogoPublico,
  Catalogos,
  DashboardData,
  MovimientoStock,
  Permiso,
  Rol,
  Usuario,
  Venta,
} from "@/types";

export const TOKEN_KEY = "rivera-imports-token";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function mensajeDeError(error: unknown, fallback = "Ocurrió un error"): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown })?.detail;
    if (typeof detail === "string") return detail;
    if (error.code === "ERR_NETWORK") return "No se pudo conectar con el servidor";
  }
  return fallback;
}

export const api = {
  // Auth
  login: async (usuario: string, password: string) => {
    const body = new URLSearchParams({ username: usuario, password });
    const { data } = await apiClient.post<{ access_token: string; usuario: Usuario }>(
      "/auth/login",
      body
    );
    return data;
  },
  me: async () => (await apiClient.get<Usuario>("/auth/me")).data,

  // Artículos
  getArticulos: async () => (await apiClient.get<Articulo[]>("/articulos")).data,
  getArticulo: async (id: number) =>
    (await apiClient.get<Articulo>(`/articulos/${id}`)).data,
  crearArticulo: async (data: {
    nombre: string;
    categoria_id: number;
    marca_id: number;
    modelo_id: number;
    foto: string;
    precio: number;
    descripcion: string;
    stock: number;
  }) => (await apiClient.post<Articulo>("/articulos", data)).data,
  actualizarArticulo: async (id: number, data: Partial<Omit<Articulo, "id" | "stock">>) =>
    (await apiClient.patch<Articulo>(`/articulos/${id}`, data)).data,
  eliminarArticulo: async (id: number) => apiClient.delete(`/articulos/${id}`),
  getMovimientos: async (id: number) =>
    (await apiClient.get<MovimientoStock[]>(`/articulos/${id}/movimientos`)).data,
  ajustarStock: async (id: number, data: { tipo: "entrada" | "salida"; cantidad: number; nota: string }) =>
    (await apiClient.post<Articulo>(`/articulos/${id}/movimientos`, data)).data,

  // Catálogo público
  getCatalogoPublico: async () =>
    (await apiClient.get<CatalogoPublico>("/catalogo")).data,
  getCatalogoArticulo: async (id: number) =>
    (await apiClient.get<CatalogoArticulo>(`/catalogo/articulos/${id}`)).data,

  // Catálogos
  getCatalogos: async () => (await apiClient.get<Catalogos>("/catalogos")).data,
  crearCategoria: async (nombre: string) =>
    apiClient.post("/catalogos/categorias", { nombre }),
  eliminarCategoria: async (id: number) => apiClient.delete(`/catalogos/categorias/${id}`),
  crearMarca: async (nombre: string) => apiClient.post("/catalogos/marcas", { nombre }),
  eliminarMarca: async (id: number) => apiClient.delete(`/catalogos/marcas/${id}`),
  crearModelo: async (nombre: string, marca_id: number) =>
    apiClient.post("/catalogos/modelos", { nombre, marca_id }),
  eliminarModelo: async (id: number) => apiClient.delete(`/catalogos/modelos/${id}`),

  // Ventas
  getVentas: async () => (await apiClient.get<Venta[]>("/ventas")).data,
  registrarVenta: async (data: {
    articulo_id: number;
    cantidad: number;
    tipo_venta: "fisica" | "web";
    cliente_nombre: string;
    cliente_telefono: string;
    departamento?: string;
    direccion?: string;
    notas: string;
  }) => (await apiClient.post<Venta>("/ventas", data)).data,

  // Dashboard / Analytics
  getDashboard: async () => (await apiClient.get<DashboardData>("/dashboard")).data,
  getAnalytics: async () => (await apiClient.get<AnalyticsData>("/analytics")).data,

  // Usuarios
  getUsuarios: async () => (await apiClient.get<Usuario[]>("/usuarios")).data,
  crearUsuario: async (data: {
    nombre: string;
    usuario: string;
    password: string;
    email?: string;
    roles: string[];
  }) => (await apiClient.post<Usuario>("/usuarios", data)).data,
  actualizarUsuario: async (
    id: number,
    data: Partial<{ nombre: string; email: string; activo: boolean; password: string; roles: string[] }>
  ) => (await apiClient.patch<Usuario>(`/usuarios/${id}`, data)).data,
  actualizarMiPerfil: async (data: { email?: string; password?: string }) =>
    (await apiClient.patch<Usuario>("/usuarios/me", data)).data,
  actualizarNotificaciones: async (
    data: Partial<{
      notif_nueva_venta: boolean;
      notif_stock_bajo: boolean;
      notif_reporte_diario: boolean;
    }>
  ) => (await apiClient.patch<Usuario>("/usuarios/me/notificaciones", data)).data,
  enviarNotificacionesAhora: async () =>
    (await apiClient.post<{ enviados: number; email: string }>("/notificaciones/enviar-ahora")).data,

  // Roles
  getRoles: async () => (await apiClient.get<Rol[]>("/roles")).data,
  getPermisos: async () => (await apiClient.get<Permiso[]>("/permisos")).data,
  crearRol: async (data: { nombre: string; descripcion: string; permisos: string[] }) =>
    (await apiClient.post<Rol>("/roles", data)).data,
  actualizarRol: async (
    id: number,
    data: Partial<{ nombre: string; descripcion: string; permisos: string[] }>
  ) => (await apiClient.patch<Rol>(`/roles/${id}`, data)).data,
  eliminarRol: async (id: number) => apiClient.delete(`/roles/${id}`),

  // Configuración
  getConfiguracion: async () => (await apiClient.get<AppConfig>("/configuracion")).data,
  guardarConfiguracion: async (data: Partial<{ nombre_negocio: string; umbral_stock_bajo: number }>) =>
    (await apiClient.put<AppConfig>("/configuracion", data)).data,
};
