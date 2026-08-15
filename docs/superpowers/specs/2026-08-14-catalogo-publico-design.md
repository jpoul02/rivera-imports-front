# Catálogo público — diseño

**Fecha:** 2026-08-14
**Estado:** aprobado para plan de implementación

## Contexto y propósito

Rivera Imports es hoy una app interna (auth-gated) de gestión de inventario de repuestos
automotrices. Se necesita una vista pública, sin autenticación, donde cualquier persona
pueda navegar el catálogo de productos. El admin decide qué artículos son visibles
públicamente (no todo el inventario interno se expone).

Esta es la fase 1 de un roadmap más largo hacia una tienda con checkout. Fase 1 se
limita deliberadamente a: navegar, filtrar, armar una lista de interés, y consultar esa
lista por WhatsApp. No hay carrito de compra real, no hay pagos, no hay cuentas de
cliente.

## Alcance de la fase 1 (decidido en brainstorming)

- Navegar catálogo público: grid de productos con foto, nombre, marca/modelo, categoría, precio.
- Stock público muestra solo estado (`Disponible` / `Agotado`), nunca la cantidad exacta.
- Filtro por categoría y búsqueda por texto.
- Detalle de producto en ruta propia (compartible por URL).
- "Lista de interés" — el visitante agrega productos a una lista local (sin cuenta,
  sin backend), y puede enviarla por WhatsApp como un solo mensaje con todos los ítems.
- Admin controla, por artículo, si aparece en el catálogo público (toggle).
- Acceso a `/login` para personal, discreto pero no oculto — sin sistema de códigos
  ni "carritos" persistidos en el backend.

**Explícitamente fuera de alcance** (se descartó en brainstorming, ver razones):
- Sistema de código/lookup para que el admin busque un "carrito" enviado — descartado:
  el mensaje de WhatsApp ya contiene la lista completa en texto legible; construir tabla +
  endpoint + pantalla de búsqueda duplicaría esa información sin ganancia real. Se
  reconsidera si más adelante se pide un historial formal de cotizaciones.
- Ocultar criptográficamente el login de admin — descartado: no aporta seguridad real
  (la protección real ya vive en el backend, que exige auth en cada endpoint sensible).
  Se resuelve con un link discreto, no con ofuscación.
- Carrito de compra real, pagos, cuentas de cliente — es la fase 2 ("la tienda"), no esta.

## Arquitectura

### Backend (FastAPI + SQLModel + SQLite)

**Modelo:** `Articulo` (`backend/models.py`) gana un campo:

```python
visible_publico: bool = Field(default=False)
```

**Migración:** `SQLModel.metadata.create_all(engine)` (usado hoy en `init_db()`,
`backend/database.py:104`) no agrega columnas a tablas ya existentes en SQLite. El
archivo `rivera_imports.db` ya tiene datos reales. Se agrega una migración inline en
`init_db()`, antes o después de `create_all`:

```python
with engine.connect() as conn:
    columnas = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(articulos)")]
    if "visible_publico" not in columnas:
        conn.exec_driver_sql(
            "ALTER TABLE articulos ADD COLUMN visible_publico BOOLEAN NOT NULL DEFAULT 0"
        )
        conn.commit()
```

Sin Alembic — una sola columna, no justifica la dependencia (YAGNI).

**Endpoints nuevos, sin auth** (`backend/main.py`):

- `GET /catalogo` → `{ articulos: CatalogoArticuloRead[], categorias: CategoriaRead[], marcas: MarcaRead[] }`.
  Filtra `Articulo.visible_publico == True`. `categorias`/`marcas` se derivan solo de
  los artículos visibles (no se reusa `/catalogos`, que requiere auth y expone el
  catálogo interno completo).
- `GET /catalogo/articulos/{id}` → mismo filtro (`visible_publico == True`, si no,
  404 — igual que si no existiera, no revela que el artículo existe pero está oculto).

**Schema de salida pública** (nuevo `CatalogoArticuloRead` en `models.py`, no reusa
`ArticuloRead`):

```python
class CatalogoArticuloRead(SQLModel):
    id: int
    nombre: str
    categoria: str
    marca: str
    modelo: str
    foto: str
    precio: float
    descripcion: str
    disponible: bool  # computado: stock > 0. Nunca se expone el número exacto.
```

**Endpoint existente reusado:** `PATCH /articulos/{id}` (`ArticuloUpdate`) gana el
campo opcional `visible_publico: Optional[bool]`. Mismo permiso que ya exige
(`articulos_gestionar`) — no se crea un endpoint nuevo para el toggle.

### Frontend — rutas

Nuevo route group público, hermano de `(app)` y `(auth)`, fuera del árbol autenticado:

```
src/app/(catalogo)/
  layout.tsx          — header propio (logo + link discreto "Personal" → /login), sin sidebar
  catalogo/page.tsx    — grid + filtros + búsqueda + paginación
  catalogo/[id]/page.tsx — detalle de producto
```

No requiere `AuthProvider` guard — el layout raíz (`app/layout.tsx`) ya envuelve todo en
`AuthProvider`/`AppProvider`, pero esas rutas simplemente no llaman `useAuth()` para
gatear nada; el `apiClient` (`lib/api.ts`) solo agrega el header `Authorization` si hay
token en `localStorage`, así que las llamadas públicas funcionan igual con o sin sesión
de personal activa en el mismo navegador.

**Servicios nuevos** en `lib/api.ts`:

```ts
getCatalogoPublico: async () => (await apiClient.get<CatalogoPublico>("/catalogo")).data,
getCatalogoArticulo: async (id: number) =>
  (await apiClient.get<CatalogoArticulo>(`/catalogo/articulos/${id}`)).data,
```

### Frontend — lista de interés (carrito, 100% cliente)

- Estado en `localStorage` (clave `rivera-imports-lista-interes`), forma
  `{ articuloId: number, nombre: string, cantidad: number }[]`.
- Hook `useListaInteres()` en `hooks/` — lee/escribe localStorage, expone
  `agregar`, `quitar`, `actualizarCantidad`, `limpiar`, `items`, `total` (conteo).
- UI: botón "Agregar a la lista" en card/detalle de producto. Ícono de lista con
  badge de conteo en el header público, abre un `Sheet` (ya existe el componente)
  con los ítems, cantidades editables, y botón "Consultar por WhatsApp".
- El botón de WhatsApp arma un mensaje de texto plano con todos los ítems
  (nombre + cantidad) y abre `https://wa.me/<numero-negocio>?text=<mensaje-encoded>`.
  El número del negocio sale de `NEXT_PUBLIC_WHATSAPP_NUMBER` (env var nueva). El
  frontend no tiene `.env.example` hoy (solo usa `NEXT_PUBLIC_API_URL` sin documentar,
  `lib/api.ts:18`) — se crea `frontend/.env.example` con ambas variables.

### Frontend — admin, control de visibilidad

- `InventoryScreen`: columna nueva en la tabla desktop, `Switch` (`ui/switch.tsx`,
  ya existe) por fila, PATCH inmediato al togglear (igual patrón que otros ajustes
  in-place de la pantalla).
- `ProductDetailScreen`: mismo `Switch` dentro del dialog de edición, etiqueta
  "Mostrar en catálogo público".

### Diseño visual

Reusa el sistema ya construido (paleta carbón/blanco/rojo racing, Saira/Saira
Condensed, `racing-stripe`, `display-title`) — no se clona ninguna plantilla de
referencia 1:1. De las referencias se toma el *patrón*, no el look:

- Hero con fotografía real de producto (no ilustración), headline corto,
  categorías destacadas como accesos rápidos.
- Pills de categoría para filtrar (solo categorías con al menos un artículo visible).
- Grid de cards: foto (`FotoArticulo`), nombre, marca/modelo, precio, badge
  Disponible/Agotado.
- Se retoma el pendiente de iconos por categoría en el fallback de `FotoArticulo`
  (freno/batería/filtro/etc. en vez del `Cog` genérico) — encaja naturalmente acá
  porque el catálogo público es la vista con más volumen de fotos vacías/fallback.

### Reuso — paginación

`paginasVisibles` (creada en `InventoryScreen.tsx` para el inventario interno) se
extrae a `src/lib/pagination.ts` — segundo uso real justifica la extracción (regla
de la escalera: ya está en el codebase, se reusa en vez de reescribir).

## Manejo de errores

- `GET /catalogo/articulos/{id}` con artículo no visible o inexistente → 404 igual
  en ambos casos (no distinguir "oculto" de "no existe").
- Lista de interés con `localStorage` no disponible (SSR / navegación privada
  restrictiva) → hook devuelve lista vacía, no rompe la página.
- WhatsApp: si `NEXT_PUBLIC_WHATSAPP_NUMBER` no está configurado, el botón se
  deshabilita con tooltip explicando que falta configurar el número (no falla en
  silencio).

## Testing / verificación

- Backend: `curl` sin header `Authorization` a `/catalogo` y `/catalogo/articulos/{id}`
  confirmando 200 sin auth, y que artículos con `visible_publico=False` no aparecen.
- Confirmar migración: correr contra la `rivera_imports.db` existente (con data real)
  y verificar que no se pierde ninguna fila ni falla el arranque.
- Frontend: `tsc --noEmit` y `pnpm lint` limpios.
- Manual: togglear visibilidad de un artículo en Inventario, confirmar que
  aparece/desaparece en `/catalogo` sin recargar sesión de admin. Armar lista de
  interés con 2+ productos, confirmar mensaje de WhatsApp trae todos los ítems.
