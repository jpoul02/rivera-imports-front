# Catálogo público — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, unauthenticated catalog route where visitors browse products the
admin has chosen to make visible, build a local "lista de interés," and send it as a
WhatsApp inquiry — no cart, no checkout, no backend persistence of the list.

**Architecture:** `Articulo` gains a `visible_publico` boolean. Two new unauthenticated
FastAPI endpoints serve a filtered, stock-obscured view of visible articles. A new Next.js
route group `(catalogo)` (sibling to `(app)` and `(auth)`) renders the public UI, reusing
the existing brand system (carbón/blanco/rojo, Saira). The "lista de interés" is a React
Context backed by `localStorage` — zero backend involvement — with a WhatsApp deep link
as the only "checkout."

**Tech Stack:** FastAPI + SQLModel + SQLite (backend), Next.js 16 App Router + React 19 +
Tailwind v4 + shadcn/ui (frontend). No test framework exists in either repo (confirmed:
no pytest, no jest/vitest, no test files) — this plan does **not** introduce one for a
single feature. Verification uses the tools the project already relies on throughout this
codebase's history: `tsc --noEmit`, `pnpm lint`, manual `curl`, and manual browser checks.

**Spec:** `frontend/docs/superpowers/specs/2026-08-14-catalogo-publico-design.md`

## Global Constraints

- Stock is never exposed publicly as a number — only `disponible: bool` (`stock > 0`).
- Fase 1 has no cart, no checkout, no customer accounts, no backend-persisted "carrito" /
  código-lookup system — explicitly out of scope per spec.
- Primary action buttons use `h-10` (established convention throughout this codebase).
- Spanish UI copy, `es-SV` locale/currency formatting (`lib/format.ts`), matches existing screens.
- Brand system is reused as-is: carbón `neutral-950` surfaces, `--primary` racing red,
  `display-title` utility, Saira / Saira Condensed fonts — no new palette.
- Two separate git repos: `rivera-imports/backend` and `rivera-imports/frontend`. Commit
  each repo's changes separately, in its own repo.

---

## Task 1: Backend — campo `visible_publico` + migración

**Repo:** `backend`

**Files:**
- Modify: `backend/models.py:82-93` (`Articulo`), `backend/models.py:166-174` (`ArticuloUpdate`), `backend/models.py:176-189` (`ArticuloRead`)
- Modify: `backend/database.py:97-105` (`init_db`)

**Interfaces:**
- Produces: `Articulo.visible_publico: bool` (default `False`) on the ORM model;
  `ArticuloRead.visible_publico: bool` and `ArticuloUpdate.visible_publico: Optional[bool]`
  on the API schemas that `main.py`'s existing `/articulos` endpoints already return/accept.

- [ ] **Step 1: Baseline check — confirm the column doesn't exist yet**

Run (from `backend/`, using the project venv):

```bash
./venv/Scripts/python.exe -c "import sqlite3; c=sqlite3.connect('rivera_imports.db'); print([r[1] for r in c.execute('PRAGMA table_info(articulos)')])"
```

Expected: a list of column names that does **not** include `visible_publico`.

- [ ] **Step 2: Add the field to the `Articulo` model**

In `backend/models.py`, `Articulo` class — add the field after `stock`:

```python
class Articulo(SQLModel, table=True):
    __tablename__ = "articulos"
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    categoria_id: int = Field(foreign_key="categorias.id")
    marca_id: int = Field(foreign_key="marcas.id")
    modelo_id: int = Field(foreign_key="modelos.id")
    foto: str = ""
    precio: float
    descripcion: str = ""
    stock: int = 0
    visible_publico: bool = Field(default=False)
    fecha_ingreso: date = Field(default_factory=date.today)
```

- [ ] **Step 3: Expose the field on `ArticuloRead` and `ArticuloUpdate`**

`ArticuloRead` (so the admin UI can read current state):

```python
class ArticuloRead(SQLModel):
    id: int
    nombre: str
    categoria_id: int
    categoria: str
    marca_id: int
    marca: str
    modelo_id: int
    modelo: str
    foto: str
    precio: float
    descripcion: str
    stock: int
    visible_publico: bool
    fecha_ingreso: date
```

`ArticuloUpdate` (so the existing `PATCH /articulos/{id}` can toggle it):

```python
class ArticuloUpdate(SQLModel):
    nombre: Optional[str] = None
    categoria_id: Optional[int] = None
    marca_id: Optional[int] = None
    modelo_id: Optional[int] = None
    foto: Optional[str] = None
    precio: Optional[float] = None
    descripcion: Optional[str] = None
    visible_publico: Optional[bool] = None
```

No changes needed to `PATCH /articulos/{id}` itself (`backend/main.py:322-347`) — it
already applies every key in `data.model_dump(exclude_unset=True)` generically via
`setattr`.

- [ ] **Step 4: Add the migration for the existing database**

`SQLModel.metadata.create_all(engine)` (`backend/database.py:104`) only creates missing
*tables*, not missing *columns* on tables that already exist — and `rivera_imports.db`
already has real data. Add a small cross-dialect migration helper in
`backend/database.py`, placed directly above `def init_db():`:

```python
def _migrar_columnas_nuevas():
    """Agrega columnas nuevas a tablas ya existentes (create_all no las agrega)."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    columnas = [c["name"] for c in inspector.get_columns("articulos")]
    if "visible_publico" not in columnas:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE articulos ADD COLUMN visible_publico BOOLEAN NOT NULL DEFAULT FALSE"
            ))
```

Then call it right after `create_all` inside `init_db()`:

```python
    SQLModel.metadata.create_all(engine)
    _migrar_columnas_nuevas()
```

No Alembic — one column doesn't justify the dependency (per spec).

- [ ] **Step 5: Trigger the migration and verify**

The dev server runs with `--reload`, so saving `database.py`/`models.py` restarts it and
re-runs `init_db()`. If it's not running, start it:

```bash
./venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```

Then re-run the same check from Step 1:

```bash
./venv/Scripts/python.exe -c "import sqlite3; c=sqlite3.connect('rivera_imports.db'); print([r[1] for r in c.execute('PRAGMA table_info(articulos)')]); print('filas:', c.execute('SELECT COUNT(*) FROM articulos').fetchone()[0])"
```

Expected: `visible_publico` now appears in the column list, and the row count matches
what it was before Step 1 (no data lost).

- [ ] **Step 6: Commit**

```bash
git add models.py database.py
git commit -m "feat: agrega visible_publico a Articulo con migración para BD existente"
```

---

## Task 2: Backend — endpoints públicos del catálogo

**Repo:** `backend`

**Files:**
- Modify: `backend/models.py` (add `CatalogoArticuloRead`, right after `ArticuloRead`)
- Modify: `backend/main.py:22-29` (imports), `backend/main.py` (add helper near
  `articulo_a_read` at line 85, add two endpoints before the `# ─── Catálogos ───`
  section at line 415)

**Interfaces:**
- Consumes: `Articulo`, `Categoria`, `Marca`, `Modelo` models from Task 1.
- Produces: `GET /catalogo` → `{ articulos: CatalogoArticuloRead[], categorias: {id,nombre}[], marcas: {id,nombre}[] }`;
  `GET /catalogo/articulos/{id}` → `CatalogoArticuloRead` or 404. Both public (no
  `Depends(get_usuario_actual)`). Frontend Task 4 consumes these exact shapes.

- [ ] **Step 1: Add the public read schema**

In `backend/models.py`, right after the `ArticuloRead` class (after line 189):

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
    disponible: bool
```

- [ ] **Step 2: Import it in `main.py`**

In `backend/main.py`, extend the existing `models` import block (lines 22-29):

```python
from models import (
    PERMISOS, Role, UsuarioRol, Usuario, Categoria, Marca, Modelo,
    Articulo, MovimientoInventario, Venta, ConfiguracionApp,
    RolRead, RolCreate, RolUpdate,
    ArticuloCreate, ArticuloUpdate, ArticuloRead, CatalogoArticuloRead,
    MovimientoInput, VentaInput,
    UsuarioCreate, UsuarioUpdate, UsuarioPublico, PerfilUpdate, NotificacionesUpdate,
    CatalogoItemInput, ModeloInput, AppConfigInput,
)
```

- [ ] **Step 3: Add the conversion helper**

In `backend/main.py`, right after `articulo_a_read` (after line 85, before
`validar_referencias`):

```python
def articulo_a_catalogo_read(session: Session, articulo: Articulo) -> CatalogoArticuloRead:
    categoria = session.get(Categoria, articulo.categoria_id)
    marca = session.get(Marca, articulo.marca_id)
    modelo = session.get(Modelo, articulo.modelo_id)
    return CatalogoArticuloRead(
        id=articulo.id,
        nombre=articulo.nombre,
        categoria=categoria.nombre if categoria else "",
        marca=marca.nombre if marca else "",
        modelo=modelo.nombre if modelo else "",
        foto=articulo.foto,
        precio=articulo.precio,
        descripcion=articulo.descripcion,
        disponible=articulo.stock > 0,
    )
```

- [ ] **Step 4: Add the two public endpoints**

In `backend/main.py`, right before the `# ─── Catálogos ───` comment (line 415):

```python
# ─── Catálogo público (sin auth) ───────────────────────────────────────────────

@app.get("/catalogo")
def obtener_catalogo_publico(session: Session = Depends(get_session)):
    articulos = session.exec(
        select(Articulo).where(Articulo.visible_publico.is_(True)).order_by(Articulo.nombre)
    ).all()
    resultado = [articulo_a_catalogo_read(session, a) for a in articulos]
    categoria_ids = {a.categoria_id for a in articulos}
    marca_ids = {a.marca_id for a in articulos}
    categorias = (
        session.exec(select(Categoria).where(Categoria.id.in_(categoria_ids)).order_by(Categoria.nombre)).all()
        if categoria_ids else []
    )
    marcas = (
        session.exec(select(Marca).where(Marca.id.in_(marca_ids)).order_by(Marca.nombre)).all()
        if marca_ids else []
    )
    return {"articulos": resultado, "categorias": categorias, "marcas": marcas}


@app.get("/catalogo/articulos/{articulo_id}", response_model=CatalogoArticuloRead)
def obtener_catalogo_articulo(articulo_id: int, session: Session = Depends(get_session)):
    articulo = session.get(Articulo, articulo_id)
    if not articulo or not articulo.visible_publico:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return articulo_a_catalogo_read(session, articulo)
```

- [ ] **Step 5: Verify — empty catalog first**

With the reloaded server running:

```bash
curl -s http://localhost:8000/catalogo
```

Expected: `{"articulos":[],"categorias":[],"marcas":[]}` (no article is `visible_publico`
yet — all default to `False`).

- [ ] **Step 6: Verify — mark one article visible and re-check**

```bash
./venv/Scripts/python.exe -c "import sqlite3; c=sqlite3.connect('rivera_imports.db'); c.execute('UPDATE articulos SET visible_publico=1 WHERE id=1'); c.commit()"
curl -s http://localhost:8000/catalogo
curl -s http://localhost:8000/catalogo/articulos/1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/catalogo/articulos/999
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/catalogo/articulos/2
```

Expected: first `curl` now lists article 1 with a `disponible` boolean and no `stock`
field; second `curl` returns the same article by id; `999` (nonexistent) → `404`; `2`
(exists but `visible_publico=False`) → also `404`. None of these calls sent an
`Authorization` header — confirms the routes are truly public.

- [ ] **Step 7: Commit**

```bash
git add models.py main.py
git commit -m "feat: agrega endpoints públicos GET /catalogo y /catalogo/articulos/{id}"
```

---

## Task 3: Frontend — tipos

**Repo:** `frontend`

**Files:**
- Modify: `frontend/src/types/index.ts:18-32` (`Articulo`), add `CatalogoArticulo` /
  `CatalogoPublico` after it.

**Interfaces:**
- Consumes: response shapes from Task 2.
- Produces: `Articulo.visible_publico: boolean`; `CatalogoArticulo`; `CatalogoPublico`
  (`{ articulos: CatalogoArticulo[]; categorias: CatalogoItem[]; marcas: CatalogoItem[] }`)
  — consumed by Task 4 (`lib/api.ts`) and every catalog UI task after it.

- [ ] **Step 1: Add `visible_publico` to `Articulo`**

```ts
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
```

- [ ] **Step 2: Add the public catalog types**

Right after the `Articulo` interface:

```ts
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
```

- [ ] **Step 3: Verify**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors (adding fields to an interface and two new unused exports doesn't
break existing callers).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: tipos para visible_publico y catálogo público"
```

---

## Task 4: Frontend — servicio API + variables de entorno

**Repo:** `frontend`

**Files:**
- Modify: `frontend/src/lib/api.ts` (imports, add service functions after `ajustarStock`)
- Create: `frontend/.env.example`

**Interfaces:**
- Consumes: `CatalogoArticulo`, `CatalogoPublico` from Task 3; `GET /catalogo`,
  `GET /catalogo/articulos/{id}` from Task 2.
- Produces: `api.getCatalogoPublico(): Promise<CatalogoPublico>`,
  `api.getCatalogoArticulo(id: number): Promise<CatalogoArticulo>` — consumed by Task 8
  and Task 9. `NEXT_PUBLIC_WHATSAPP_NUMBER` env var — consumed by Task 10.

- [ ] **Step 1: Import the new types**

In `frontend/src/lib/api.ts`, extend the existing `import type {...} from "@/types"` block
(lines 2-13) to include `CatalogoArticulo` and `CatalogoPublico`:

```ts
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
```

- [ ] **Step 2: Add the service functions**

In `frontend/src/lib/api.ts`, right after `ajustarStock` (after line 85, before the
`// Catálogos` comment):

```ts
  // Catálogo público
  getCatalogoPublico: async () =>
    (await apiClient.get<CatalogoPublico>("/catalogo")).data,
  getCatalogoArticulo: async (id: number) =>
    (await apiClient.get<CatalogoArticulo>(`/catalogo/articulos/${id}`)).data,
```

- [ ] **Step 3: Document the env vars**

Create `frontend/.env.example` (none exists today — `NEXT_PUBLIC_API_URL` is used in
`lib/api.ts:18` but was undocumented until now):

```
# URL del backend (FastAPI). Si no se define, usa http://localhost:8000.
NEXT_PUBLIC_API_URL=http://localhost:8000

# Número de WhatsApp del negocio para "Consultar por WhatsApp" en el catálogo
# público. Formato internacional, sin '+' ni espacios (El Salvador: 503XXXXXXXX).
NEXT_PUBLIC_WHATSAPP_NUMBER=50370000000
```

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts .env.example
git commit -m "feat: servicio de catálogo público y documenta variables de entorno"
```

---

## Task 5: Frontend — extraer paginación a componente compartido

**Repo:** `frontend`

**Files:**
- Create: `frontend/src/lib/pagination.ts`
- Create: `frontend/src/components/common/Paginacion.tsx`
- Modify: `frontend/src/components/screens/InventoryScreen.tsx` (remove local
  `paginasVisibles` function and inline pagination JSX, replace with the shared
  component; drop now-unused `ChevronLeft`/`ChevronRight`/`cn` imports)

**Interfaces:**
- Produces: `paginasVisibles(actual: number, total: number): (number | "...")[]`;
  `<Paginacion pagina={number} totalPaginas={number} onCambiar={(p: number) => void} className?={string} />`
  — consumed by Task 8 (public catalog grid) in addition to `InventoryScreen`.

- [ ] **Step 1: Extract the pure windowing function**

Create `frontend/src/lib/pagination.ts`:

```ts
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
```

- [ ] **Step 2: Create the shared presentational component**

Create `frontend/src/components/common/Paginacion.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginasVisibles } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  className?: string;
}

export function Paginacion({ pagina, totalPaginas, onCambiar, className }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onCambiar(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {paginasVisibles(pagina, totalPaginas).map((p, i) =>
        p === "..." ? (
          <span
            key={i === 1 ? "ellipsis-start" : "ellipsis-end"}
            className="px-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === pagina ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onCambiar(p)}
            aria-label={`Página ${p}`}
            aria-current={p === pagina ? "page" : undefined}
            className={cn("font-mono", p === pagina && "pointer-events-none")}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Adopt it in `InventoryScreen`**

In `frontend/src/components/screens/InventoryScreen.tsx`:

Remove the local `function paginasVisibles(...)` block (defined above
`export function InventoryScreen()`).

Remove the `ChevronLeft, ChevronRight` names from the `lucide-react` import, and remove
the `import { cn } from "@/lib/utils";` line (both become unused after this change).

Add:

```ts
import { Paginacion } from "@/components/common/Paginacion";
```

Replace the whole pagination block (the `{filtrados.length > 0 && (...)}` section with
the prev/next/number buttons) with:

```tsx
      {filtrados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">
              {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, filtrados.length)}
            </span>{" "}
            de {filtrados.length} artículos
          </p>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </div>
      )}
```

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm run lint
```

Expected: both clean (the 5 pre-existing lint errors in `use-fetch.ts` /
`AuthContext.tsx` are unrelated and were already present — don't fix them here).

Manually: open `/inventory` with 20+ articles, confirm pagination still renders and
prev/next/page-number buttons still work exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pagination.ts src/components/common/Paginacion.tsx src/components/screens/InventoryScreen.tsx
git commit -m "refactor: extrae paginación a lib/pagination.ts y componente Paginacion compartido"
```

---

## Task 6: Frontend — iconos por categoría en `FotoArticulo`

**Repo:** `frontend`

**Files:**
- Create: `frontend/src/lib/category-icons.ts`
- Modify: `frontend/src/components/common/FotoArticulo.tsx`
- Modify: `frontend/src/components/screens/DashboardScreen.tsx` (stock bajo list,
  around line 186), `frontend/src/components/screens/InventoryScreen.tsx` (desktop
  table cell + mobile card), `frontend/src/components/screens/ProductDetailScreen.tsx`
  (main photo, around line 203) — each adds a `categoria={a.categoria}` /
  `categoria={articulo.categoria}` prop to their existing `<FotoArticulo>` call.

**Interfaces:**
- Produces: `categoriaIcon(categoria: string): LucideIcon`; `FotoArticulo` gains an
  optional `categoria?: string` prop (default `""`, falls back to the generic `Package`
  icon) — consumed by Task 8 and Task 9's product cards/detail.

- [ ] **Step 1: Create the category → icon map**

Create `frontend/src/lib/category-icons.ts`. Categories from the seed data
(`backend/database.py:43-44`) are: Frenos, Suspensión, Motor, Eléctrico, Filtros,
Transmisión, Carrocería, Lubricantes — plus whatever custom categories an admin adds
later via `CatalogosScreen`, which fall back to a generic icon:

```ts
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
```

- [ ] **Step 2: Wire it into `FotoArticulo`**

Replace `frontend/src/components/common/FotoArticulo.tsx` entirely:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { categoriaIcon } from "@/lib/category-icons";

interface FotoArticuloProps {
  src: string;
  alt: string;
  categoria?: string;
  className?: string;
  iconClassName?: string;
  sizes?: string;
}

/** Foto de artículo con fallback por categoría (ícono representativo) cuando no hay imagen o falla la carga. */
export function FotoArticulo({
  src,
  alt,
  categoria = "",
  className,
  iconClassName,
  sizes = "200px",
}: FotoArticuloProps) {
  const [error, setError] = useState(false);
  const showFallback = !src || error;
  const Icono = categoriaIcon(categoria);

  return (
    <div className={cn("relative overflow-hidden bg-neutral-900", className)}>
      {showFallback ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-x-0 top-0 h-1 racing-stripe opacity-80" />
          <Icono
            className={cn("text-neutral-700", iconClassName ?? "w-8 h-8")}
            strokeWidth={1.5}
          />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Pass `categoria` at every existing call site**

`frontend/src/components/screens/DashboardScreen.tsx` — in the "STOCK BAJO" list, the
`<FotoArticulo src={a.foto} alt={a.nombre} ...>` call gains `categoria={a.categoria}`.

`frontend/src/components/screens/InventoryScreen.tsx` — both the desktop table cell's
`<FotoArticulo>` and the mobile card's `<FotoArticulo>` gain `categoria={a.categoria}`.

`frontend/src/components/screens/ProductDetailScreen.tsx` — the main photo's
`<FotoArticulo>` gains `categoria={articulo.categoria}`.

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
```

Manually: with your dev server on 3000, open `/inventory`, find (or temporarily blank
the `foto` field on) an article in "Frenos" and one in "Motor" — confirm the fallback
icon differs (disc vs. cog) instead of the previous single generic gear for everything.
Confirm a custom/unmapped category still shows a sensible fallback (`Package`), not a
blank tile.

- [ ] **Step 5: Commit**

```bash
git add src/lib/category-icons.ts src/components/common/FotoArticulo.tsx src/components/screens/DashboardScreen.tsx src/components/screens/InventoryScreen.tsx src/components/screens/ProductDetailScreen.tsx
git commit -m "feat: iconos de fallback por categoría en FotoArticulo"
```

---

## Task 7: Frontend — control admin de visibilidad pública

**Repo:** `frontend`

**Files:**
- Modify: `frontend/src/components/screens/InventoryScreen.tsx` (new "Público" column,
  desktop table only)
- Modify: `frontend/src/components/screens/ProductDetailScreen.tsx` (new `Switch` in the
  edit dialog)

**Interfaces:**
- Consumes: `api.actualizarArticulo(id, { visible_publico })` (already generic via
  `Partial<Omit<Articulo, "id" | "stock">>` in `lib/api.ts`, works once `Articulo` has
  the field from Task 3 — no signature change needed).

- [ ] **Step 1: Add the toggle to `InventoryScreen`'s desktop table**

In `frontend/src/components/screens/InventoryScreen.tsx`:

Add imports:

```ts
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { mensajeDeError } from "@/lib/api";
```

Destructure `refetch` from the articulos fetch:

```ts
const { data: articulos, loading, refetch: refetchArticulos } = useFetch(api.getArticulos);
```

Add a handler above the `stockBadge` function:

```ts
const togglePublico = async (a: Articulo) => {
  try {
    await api.actualizarArticulo(a.id, { visible_publico: !a.visible_publico });
    refetchArticulos();
  } catch (error) {
    toast.error(mensajeDeError(error, "No se pudo actualizar"));
  }
};
```

(`Articulo` type must be imported — add `import type { Articulo } from "@/types";` if
not already present.)

In the desktop `<Table>`'s `<TableHeader>`, add a column gated by permission, after
"Stock":

```tsx
{hasPermiso("articulos_gestionar") && <TableHead className="text-center">Público</TableHead>}
```

In the matching `<TableRow>` body, add the cell after the stock cell:

```tsx
{hasPermiso("articulos_gestionar") && (
  <TableCell className="text-center">
    <Switch
      checked={a.visible_publico}
      onCheckedChange={() => togglePublico(a)}
      aria-label={
        a.visible_publico ? "Ocultar del catálogo público" : "Mostrar en catálogo público"
      }
    />
  </TableCell>
)}
```

Mobile cards are left as-is — they're wrapped end-to-end in a `<Link>`, and nesting a
`<Switch>` inside an `<a>` is invalid (interactive-in-interactive); admins managing
visibility from a phone use the edit dialog on the product detail screen instead (Step 2).

- [ ] **Step 2: Add the toggle to `ProductDetailScreen`'s edit dialog**

In `frontend/src/components/screens/ProductDetailScreen.tsx`:

Add import:

```ts
import { Switch } from "@/components/ui/switch";
```

Extend the `edit` state shape and its initial value:

```ts
const [edit, setEdit] = useState({
  nombre: "",
  categoriaId: "",
  marcaId: "",
  modeloId: "",
  foto: "",
  precio: "",
  descripcion: "",
  visiblePublico: false,
});
```

In `abrirEdicion`, include the current value:

```ts
const abrirEdicion = () => {
  setEdit({
    nombre: articulo.nombre,
    categoriaId: String(articulo.categoria_id),
    marcaId: String(articulo.marca_id),
    modeloId: String(articulo.modelo_id),
    foto: articulo.foto,
    precio: String(articulo.precio),
    descripcion: articulo.descripcion,
    visiblePublico: articulo.visible_publico,
  });
  setEditOpen(true);
};
```

In `guardarEdicion`, include it in the PATCH payload:

```ts
await api.actualizarArticulo(articulo.id, {
  nombre: edit.nombre.trim(),
  categoria_id: Number(edit.categoriaId),
  marca_id: Number(edit.marcaId),
  modelo_id: Number(edit.modeloId),
  foto: edit.foto.trim(),
  precio,
  descripcion: edit.descripcion.trim(),
  visible_publico: edit.visiblePublico,
});
```

In the edit `<Dialog>`'s form body, add after the descripción field:

```tsx
<div className="flex items-center justify-between rounded-md border p-3">
  <div>
    <p className="text-sm font-medium">Mostrar en catálogo público</p>
    <p className="text-xs text-muted-foreground">
      Visible para cualquier visitante en /catalogo
    </p>
  </div>
  <Switch
    checked={edit.visiblePublico}
    onCheckedChange={(v) => setEdit((f) => ({ ...f, visiblePublico: v }))}
  />
</div>
```

- [ ] **Step 3: Verify**

```bash
pnpm exec tsc --noEmit
```

Manually: in `/inventory`, toggle the "Público" switch for an article — confirm it
flips and stays flipped after a page reload (persisted via the PATCH). Open that
article's detail page, open "Editar", confirm the switch there reflects the same state;
toggle it there, save, confirm it's reflected back in the inventory table.

- [ ] **Step 4: Commit**

```bash
git add src/components/screens/InventoryScreen.tsx src/components/screens/ProductDetailScreen.tsx
git commit -m "feat: admin puede alternar visibilidad pública de un artículo"
```

---

## Task 8: Frontend — layout público + grilla del catálogo

**Repo:** `frontend`

**Files:**
- Create: `frontend/src/components/catalogo/CatalogoHeader.tsx`
- Create: `frontend/src/app/(catalogo)/layout.tsx`
- Create: `frontend/src/app/(catalogo)/catalogo/page.tsx`

**Interfaces:**
- Consumes: `api.getCatalogoPublico()` (Task 4), `FotoArticulo` with `categoria` prop
  (Task 6), `<Paginacion>` (Task 5).
- Produces: the `/catalogo` route; `<CatalogoHeader>` — extended by Task 10 to add the
  lista-de-interés trigger.

- [ ] **Step 1: Create the public header**

Create `frontend/src/components/catalogo/CatalogoHeader.tsx`:

```tsx
"use client";

import Link from "next/link";

export function CatalogoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/catalogo" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary">
            <span className="display-title text-lg leading-none text-primary-foreground">
              RI
            </span>
          </div>
          <span className="display-title text-sm tracking-[0.3em] text-white">
            RIVERA IMPORTS
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Personal
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create the public route group layout**

Create `frontend/src/app/(catalogo)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { CatalogoHeader } from "@/components/catalogo/CatalogoHeader";

export const metadata: Metadata = {
  title: "Catálogo — Rivera Imports",
  description: "Catálogo de repuestos y partes de automóviles",
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <CatalogoHeader />
      <main>{children}</main>
    </div>
  );
}
```

This route group has no auth guard — it never calls `useAuth()`. `apiClient` (Task 4)
only attaches an `Authorization` header when a token exists in `localStorage`; the
public endpoints don't require one either way.

- [ ] **Step 3: Create the catalog grid page**

Create `frontend/src/app/(catalogo)/catalogo/page.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Paginacion } from "@/components/common/Paginacion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const POR_PAGINA = 12;

export default function CatalogoPage() {
  const { data, loading } = useFetch(api.getCatalogoPublico);

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(1);

  const articulos = data?.articulos ?? [];

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return articulos.filter((a) => {
      if (categoria && a.categoria !== categoria) return false;
      if (
        q &&
        ![a.nombre, a.marca, a.modelo, a.categoria].some((v) => v.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [articulos, busqueda, categoria]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground">
          CATÁLOGO
        </p>
        <h1 className="display-title mt-1 text-4xl sm:text-5xl">REPUESTOS Y PARTES</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Navegá el catálogo de Rivera Imports. Agregá lo que te interesa a tu lista y
          consultá disponibilidad por WhatsApp.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre, marca o modelo..."
            className="h-10 pl-9"
          />
        </div>
      </div>

      {!loading && data && data.categorias.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoria === "" ? "default" : "outline"}
            className="h-8 rounded-full"
            onClick={() => {
              setCategoria("");
              setPagina(1);
            }}
          >
            Todas
          </Button>
          {data.categorias.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={categoria === c.nombre ? "default" : "outline"}
              className="h-8 rounded-full"
              onClick={() => {
                setCategoria(c.nombre);
                setPagina(1);
              }}
            >
              {c.nombre}
            </Button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginados.map((a) => (
              <Link key={a.id} href={`/catalogo/${a.id}`}>
                <Card className="h-full gap-3 overflow-hidden py-0 transition-colors duration-150 hover:border-primary/40">
                  <FotoArticulo
                    src={a.foto}
                    alt={a.nombre}
                    categoria={a.categoria}
                    className="aspect-square w-full"
                    iconClassName="w-10 h-10"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <CardContent className="space-y-1.5 pb-4">
                    <Badge variant="outline" className="text-xs">
                      {a.categoria}
                    </Badge>
                    <p className="truncate text-sm font-medium">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.marca} · {a.modelo}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-sm font-semibold">
                        {formatMoney(a.precio)}
                      </span>
                      <Badge variant={a.disponible ? "secondary" : "destructive"}>
                        {a.disponible ? "Disponible" : "Agotado"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filtrados.length === 0 && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No hay artículos que coincidan con tu búsqueda.
            </p>
          )}

          {filtrados.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
```

Manually, with the backend running and at least one article marked `visible_publico`
(Task 2's Step 6 already flipped article id 1 — toggle a couple more from `/inventory`
using Task 7's switch so there's enough to page through): visit `http://localhost:3000/catalogo`
directly in the browser (no login). Confirm: the grid renders, search filters live,
category pills filter and reset to page 1, pagination works past 12 items, and an
article with no photo shows the category-matched icon from Task 6 — not a broken image.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalogo/CatalogoHeader.tsx "src/app/(catalogo)"
git commit -m "feat: layout público y grilla del catálogo en /catalogo"
```

---

## Task 9: Frontend — detalle de producto en el catálogo público

**Repo:** `frontend`

**Files:**
- Create: `frontend/src/components/catalogo/CatalogoDetalleScreen.tsx`
- Create: `frontend/src/app/(catalogo)/catalogo/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.getCatalogoArticulo(id)` (Task 4), `FotoArticulo` (Task 6).
- Produces: the `/catalogo/[id]` route — extended by Task 10 to add the "agregar a la
  lista" button.

- [ ] **Step 1: Create the detail screen component**

Create `frontend/src/components/catalogo/CatalogoDetalleScreen.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { formatMoney } from "@/lib/format";
import { FotoArticulo } from "@/components/common/FotoArticulo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogoDetalleScreen({ id }: { id: string }) {
  const articuloId = Number(id);
  const { data: articulo, loading } = useFetch(() => api.getCatalogoArticulo(articuloId));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="aspect-square lg:col-span-2" />
          <div className="space-y-4 lg:col-span-3">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="py-24 text-center">
        <p className="display-title text-2xl text-muted-foreground">
          ARTÍCULO NO ENCONTRADO
        </p>
        <Button asChild className="mt-6 h-10">
          <Link href="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" className="-ml-2 h-10 text-muted-foreground">
        <Link href="/catalogo">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden py-0 lg:col-span-2">
          <FotoArticulo
            src={articulo.foto}
            alt={articulo.nombre}
            categoria={articulo.categoria}
            className="aspect-square w-full"
            iconClassName="w-16 h-16"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <div>
            <Badge variant="outline">{articulo.categoria}</Badge>
            <h1 className="display-title mt-2 text-3xl sm:text-4xl">{articulo.nombre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {articulo.marca} · {articulo.modelo}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Precio
              </p>
              <p className="font-mono text-3xl font-bold">{formatMoney(articulo.precio)}</p>
            </div>
            <Badge variant={articulo.disponible ? "secondary" : "destructive"}>
              {articulo.disponible ? "Disponible" : "Agotado"}
            </Badge>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">
            {articulo.descripcion}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the route**

Create `frontend/src/app/(catalogo)/catalogo/[id]/page.tsx` (same async-params pattern
already used by `src/app/(app)/products/[id]/page.tsx`):

```tsx
import { CatalogoDetalleScreen } from "@/components/catalogo/CatalogoDetalleScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogoDetalleScreen id={id} />;
}
```

- [ ] **Step 3: Verify**

```bash
pnpm exec tsc --noEmit
```

Manually: from `/catalogo`, click a product card — confirm it navigates to
`/catalogo/<id>` and shows the full detail. Manually visit `/catalogo/999999` (no such
id) — confirm it shows "ARTÍCULO NO ENCONTRADO" with a working "Volver al catálogo" link
instead of crashing.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalogo/CatalogoDetalleScreen.tsx "src/app/(catalogo)/catalogo/[id]"
git commit -m "feat: página de detalle de producto en el catálogo público"
```

---

## Task 10: Frontend — lista de interés (WhatsApp)

**Repo:** `frontend`

**Files:**
- Create: `frontend/src/context/ListaInteresContext.tsx`
- Create: `frontend/src/components/catalogo/AgregarAListaButton.tsx`
- Modify: `frontend/src/app/(catalogo)/layout.tsx` (wrap with the provider)
- Modify: `frontend/src/components/catalogo/CatalogoHeader.tsx` (add the trigger, badge,
  and `Sheet` with the list + WhatsApp button)
- Modify: `frontend/src/app/(catalogo)/catalogo/page.tsx` (restructure each card so the
  "agregar" button isn't nested inside the card's `<Link>`)
- Modify: `frontend/src/components/catalogo/CatalogoDetalleScreen.tsx` (add the button)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_WHATSAPP_NUMBER` (Task 4).
- Produces: `useListaInteres()` (`items`, `total`, `agregar`, `actualizarCantidad`,
  `quitar`, `limpiar`) via `ListaInteresProvider` — same context pattern as the existing
  `AppContext`/`AuthContext` in this codebase.

- [ ] **Step 1: Create the context**

Create `frontend/src/context/ListaInteresContext.tsx`:

```tsx
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
    setItems(leerAlmacenamiento());
  }, []);

  const persistir = useCallback((siguiente: ItemInteres[]) => {
    setItems(siguiente);
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

  const limpiar = useCallback(() => persistir([]), [persistir]);

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
```

A Context (not a bare hook) is required here, not optional convenience: the header
badge and every product card/detail button must share one `items` array. A plain hook
called independently in each component would read its own disconnected copy of
`localStorage` and go stale the moment another instance writes to it.

- [ ] **Step 2: Wrap the public layout with the provider**

In `frontend/src/app/(catalogo)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ListaInteresProvider } from "@/context/ListaInteresContext";
import { CatalogoHeader } from "@/components/catalogo/CatalogoHeader";

export const metadata: Metadata = {
  title: "Catálogo — Rivera Imports",
  description: "Catálogo de repuestos y partes de automóviles",
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ListaInteresProvider>
      <div className="min-h-screen bg-background">
        <CatalogoHeader />
        <main>{children}</main>
      </div>
    </ListaInteresProvider>
  );
}
```

- [ ] **Step 3: Create the reusable "agregar" button**

Create `frontend/src/components/catalogo/AgregarAListaButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Check, ListPlus } from "lucide-react";
import { useListaInteres } from "@/context/ListaInteresContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgregarAListaButtonProps {
  articuloId: number;
  nombre: string;
  className?: string;
}

export function AgregarAListaButton({
  articuloId,
  nombre,
  className,
}: AgregarAListaButtonProps) {
  const { agregar } = useListaInteres();
  const [agregado, setAgregado] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    agregar(articuloId, nombre);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn("h-9 w-full", className)}
    >
      {agregado ? <Check className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}
      {agregado ? "Agregado" : "Agregar a la lista"}
    </Button>
  );
}
```

`e.preventDefault()` / `e.stopPropagation()` matter on the grid page: the button sits
next to a `<Link>`, and without them a click would also trigger navigation.

- [ ] **Step 4: Add the trigger, badge, and sheet to the header**

Replace `frontend/src/components/catalogo/CatalogoHeader.tsx` entirely:

```tsx
"use client";

import Link from "next/link";
import { ListChecks, Minus, Plus, Trash2 } from "lucide-react";
import { useListaInteres } from "@/context/ListaInteresContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function CatalogoHeader() {
  const { items, total, actualizarCantidad, quitar, limpiar } = useListaInteres();

  const mensajeWhatsapp = () => {
    const lineas = items.map((i) => `• ${i.nombre} (x${i.cantidad})`);
    return encodeURIComponent(`Hola, quiero consultar disponibilidad de:\n${lineas.join("\n")}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/catalogo" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary">
            <span className="display-title text-lg leading-none text-primary-foreground">
              RI
            </span>
          </div>
          <span className="display-title text-sm tracking-[0.3em] text-white">
            RIVERA IMPORTS
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative text-neutral-400 hover:bg-neutral-900 hover:text-white"
                aria-label="Ver lista de interés"
              >
                <ListChecks className="h-5 w-5" />
                {total > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]">
                    {total}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="display-title text-xl">TU LISTA</SheetTitle>
              </SheetHeader>
              <div className="flex-1 space-y-3 overflow-y-auto px-4">
                {items.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Todavía no agregaste artículos.
                  </p>
                )}
                {items.map((item) => (
                  <div
                    key={item.articuloId}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.nombre}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => actualizarCantidad(item.articuloId, item.cantidad - 1)}
                        aria-label="Quitar uno"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-mono text-sm">{item.cantidad}</span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => actualizarCantidad(item.articuloId, item.cantidad + 1)}
                        aria-label="Agregar uno"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => quitar(item.articuloId)}
                      aria-label="Quitar de la lista"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <SheetFooter>
                {items.length > 0 && (
                  <Button variant="ghost" className="h-10 text-muted-foreground" onClick={limpiar}>
                    Vaciar lista
                  </Button>
                )}
                {NUMERO_WHATSAPP && items.length > 0 ? (
                  <Button asChild className="h-10 w-full">
                    <a
                      href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeWhatsapp()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consultar por WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="h-10 w-full"
                    title={
                      !NUMERO_WHATSAPP
                        ? "Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER"
                        : "Agregá artículos a tu lista primero"
                    }
                  >
                    Consultar por WhatsApp
                  </Button>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Link
            href="/login"
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Personal
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Add the button to each grid card without nesting it in the card's `<Link>`**

In `frontend/src/app/(catalogo)/catalogo/page.tsx`, add the import:

```ts
import { AgregarAListaButton } from "@/components/catalogo/AgregarAListaButton";
```

Replace the card's `<Link>` wrapping — the photo and text stay inside a `className="contents"`
link (so it doesn't affect layout but keeps that whole area clickable-to-navigate), and
the button becomes a sibling inside the `<Card>`, outside the anchor:

```tsx
<Card
  key={a.id}
  className="h-full gap-3 overflow-hidden py-0 transition-colors duration-150 hover:border-primary/40"
>
  <Link href={`/catalogo/${a.id}`} className="contents">
    <FotoArticulo
      src={a.foto}
      alt={a.nombre}
      categoria={a.categoria}
      className="aspect-square w-full"
      iconClassName="w-10 h-10"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
    <CardContent className="space-y-1.5 pb-0">
      <Badge variant="outline" className="text-xs">
        {a.categoria}
      </Badge>
      <p className="truncate text-sm font-medium">{a.nombre}</p>
      <p className="text-xs text-muted-foreground">
        {a.marca} · {a.modelo}
      </p>
      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-sm font-semibold">{formatMoney(a.precio)}</span>
        <Badge variant={a.disponible ? "secondary" : "destructive"}>
          {a.disponible ? "Disponible" : "Agotado"}
        </Badge>
      </div>
    </CardContent>
  </Link>
  <div className="px-4 pb-4">
    <AgregarAListaButton articuloId={a.id} nombre={a.nombre} />
  </div>
</Card>
```

(Note this card is no longer wrapped in an outer `<Link key={a.id}>` — the `key` moves to
`<Card key={a.id}>`, and the `<Link>` becomes an inner element with `className="contents"`.)

- [ ] **Step 6: Add the button to the detail screen**

In `frontend/src/components/catalogo/CatalogoDetalleScreen.tsx`, add the import:

```ts
import { AgregarAListaButton } from "@/components/catalogo/AgregarAListaButton";
```

Add it right after the `<p>{articulo.descripcion}</p>` line:

```tsx
<AgregarAListaButton
  articuloId={articulo.id}
  nombre={articulo.nombre}
  className="w-full sm:w-auto"
/>
```

- [ ] **Step 7: Verify**

```bash
pnpm exec tsc --noEmit
pnpm run lint
```

Manually, with `NEXT_PUBLIC_WHATSAPP_NUMBER` set in `frontend/.env.local` (copy from
`.env.example` and put a real test number in): visit `/catalogo`, click "Agregar a la
lista" on two different cards — confirm the header badge count updates immediately
(proves the Context is shared, not per-component state), confirm clicking the button
does **not** navigate to the detail page. Open the lista sheet, adjust a quantity with
+/-, remove one with the trash icon, click "Consultar por WhatsApp" — confirm it opens
`wa.me` in a new tab with a prefilled message listing every remaining item and quantity.
Reload the page — confirm the list survives (persisted in `localStorage`). Temporarily
unset `NEXT_PUBLIC_WHATSAPP_NUMBER` and confirm the button is disabled with an
explanatory `title` instead of silently doing nothing.

- [ ] **Step 8: Commit**

```bash
git add src/context/ListaInteresContext.tsx src/components/catalogo/AgregarAListaButton.tsx "src/app/(catalogo)/layout.tsx" src/components/catalogo/CatalogoHeader.tsx "src/app/(catalogo)/catalogo/page.tsx" src/components/catalogo/CatalogoDetalleScreen.tsx
git commit -m "feat: lista de interés local con consulta por WhatsApp"
```

---

## Self-Review

**Spec coverage:**
- Navegar/filtrar/buscar/paginar catálogo público → Task 8.
- Stock público como estado, no cantidad → Task 2 (`disponible: bool`, no `stock` field
  on `CatalogoArticuloRead`).
- Detalle de producto en ruta propia → Task 9.
- Lista de interés + WhatsApp, sin backend → Task 10.
- Admin controla visibilidad por artículo → Task 1 (dato) + Task 7 (UI).
- Link discreto a `/login`, sin ofuscación → Task 8/10 (`CatalogoHeader`, "Personal" link).
- Explícitamente fuera de alcance (código-lookup, login oculto, carrito real) → no task
  implements them, confirmed absent from every task above.
- Reuso de `paginasVisibles` → Task 5, consumed by both `InventoryScreen` (existing) and
  the new catalog grid (Task 8).
- Iconos por categoría pendientes de la conversación de diseño → Task 6.

**Placeholder scan:** no TBD/TODO; every step has real, complete code; no
"similar to Task N" shortcuts — each task's code is written out in full.

**Type consistency:** `CatalogoArticulo`/`CatalogoPublico` (Task 3) match
`CatalogoArticuloRead` (Task 2) and are used identically by `lib/api.ts` (Task 4),
`catalogo/page.tsx` (Task 8), and `CatalogoDetalleScreen.tsx` (Task 9).
`useListaInteres()`'s return shape (`items`, `total`, `agregar`, `actualizarCantidad`,
`quitar`, `limpiar`) is defined once in Task 10 Step 1 and consumed with those exact
names everywhere else in Task 10.
