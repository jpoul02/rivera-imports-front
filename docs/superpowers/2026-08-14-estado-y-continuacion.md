# Rivera Imports — estado y cómo retomar

**Última actualización:** 2026-08-14
**Último commit frontend:** `5140408` — feat: usa fotos reales del pickup para marca y hero público
**Último commit backend:** `4c4b0f1` — feat: agrega endpoints públicos GET /catalogo y /catalogo/articulos/{id}

Ninguno de los dos repos está pusheado a GitHub todavía — todo local en `main`.

## Qué es esto

Catálogo público sin login (`/catalogo`) para Rivera Imports (repuestos automotrices,
El Salvador). El admin elige qué productos se muestran; visitantes navegan, arman una
"lista de interés" y la mandan por WhatsApp (link `wa.me`, texto plano — **sin**
WhatsApp Business API, decisión explícita del usuario). Fase 1: sin carrito, sin pagos,
sin cuentas — eso es "la tienda", fase 2 aparte.

Spec: `docs/superpowers/specs/2026-08-14-catalogo-publico-design.md`
Plan original (10 tasks): `docs/superpowers/plans/2026-08-14-catalogo-publico.md`

## Hecho

**Base (antes del catálogo, esta misma sesión):**
- Migración npm → pnpm
- Backend: `.env` creado desde `.env.example`, CORS confirmado con `localhost:3000`
- Toggle claro/oscuro (`next-themes` + tokens `.dark` en `globals.css`)
- Login rediseñado: panel técnico carbón con plano del disco de freno (`BlueprintRotor`,
  `src/components/common/BlueprintRotor.tsx`), toggle mostrar/ocultar contraseña
- Paginación de Inventario extraída a `lib/pagination.ts` + `components/common/Paginacion.tsx`
- Iconos de fallback por categoría (`lib/category-icons.ts`) en `FotoArticulo`

**Catálogo público — Tasks 1-9 del plan, todas commiteadas:**
1. Backend: `Articulo.visible_publico` + migración inline en `database.py` (sin Alembic)
2. Backend: `GET /catalogo` y `GET /catalogo/articulos/{id}`, sin auth, sin exponer
   stock exacto (solo `disponible: bool`)
3. Tipos (`CatalogoArticulo`, `CatalogoPublico`) en `src/types/index.ts`
4. `api.getCatalogoPublico` / `api.getCatalogoArticulo` en `lib/api.ts`, `.env.example`
   documenta `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WHATSAPP_NUMBER`
5. Paginación compartida (reusada acá también)
6. Iconos por categoría (reusado acá también)
7. Admin togglea visibilidad pública — switch en tabla de Inventario + dialog de
   editar producto (`InventoryScreen.tsx`, `ProductDetailScreen.tsx`)
8. `/catalogo` — grilla con hero (foto real del pickup de fondo + capa oscura),
   búsqueda, pills de categoría
9. `/catalogo/[id]` — detalle de producto público

**Marca:** `pickup.svg` (silueta vectorial, 58KB, aspecto ~2.9:1, sin forzar a
cuadrado) en sidebar (`LogoRivera`), header del catálogo, y login. `pickup.png`
(foto real) de fondo en el hero de `/catalogo`.

## Falta — Task 10 (lista de interés + WhatsApp)

Ya existe `src/context/ListaInteresContext.tsx` — Context completo (`items`, `total`,
`agregar`, `actualizarCantidad`, `quitar`, `limpiar`), persistido en `localStorage`
(`rivera-imports-lista-interes`). **Nada lo consume todavía.** Falta:

1. Envolver `src/app/(catalogo)/layout.tsx` con `<ListaInteresProvider>`
2. Crear `src/components/catalogo/AgregarAListaButton.tsx` (botón reusable,
   `articuloId`/`nombre`/`className?`, feedback "Agregado" ~1.5s,
   `preventDefault`+`stopPropagation` porque vive junto a un `<Link>`)
3. `CatalogoHeader.tsx` — trigger (ícono + badge con `total`) que abre un `Sheet`
   con la lista, steppers de cantidad, quitar, "Vaciar lista", y "Consultar por
   WhatsApp" (deshabilitado con `title` si falta `NEXT_PUBLIC_WHATSAPP_NUMBER` o
   la lista está vacía)
4. `catalogo/page.tsx` — cada card: `<Link className="contents">` envolviendo solo
   foto+info, botón afuera del Link
5. `CatalogoDetalleScreen.tsx` — agregar el botón después de la descripción

Plan detallado de esto (por si se perdió contexto):
`C:\Users\Datasys2\.claude\plans\playful-sleeping-flame.md`

## Cómo retomar

**Backend** (si no está corriendo):
```
cd backend
./venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```
Confirmar rutas públicas: `curl http://localhost:8000/catalogo` (sin header, debe
responder sin 401/403).

**Frontend:** `cd frontend && pnpm dev` (puerto 3000).

**Verificación estándar** (usada toda la sesión, no hay test suite — no crear una):
```
pnpm exec tsc --noEmit
pnpm run lint   # baseline: 4 errores preexistentes en use-fetch.ts/AuthContext.tsx/AppContext.tsx, no tocar
pnpm run build
```

**Para ver el catálogo con datos:** marcar algún artículo `visible_publico=1` desde
`/inventory` (switch en la tabla) o directo en sqlite:
```
./venv/Scripts/python.exe -c "import sqlite3; c=sqlite3.connect('rivera_imports.db'); c.execute('UPDATE articulos SET visible_publico=1 WHERE id=1'); c.commit()"
```

## Parqueado (con razón, no implementar sin retomar la conversación)

- **Bot de WhatsApp con disponibilidad automática** — requiere WhatsApp Business API
  (webhook, verificación de negocio), matching de mensajes con catálogo, endpoint
  backend nuevo. Proyecto aparte, bastante más grande que el link `wa.me` actual.
- **Sistema de código/lookup para carritos enviados** — descartado en brainstorming:
  el mensaje de WhatsApp ya trae la lista completa en texto, construir tabla+endpoint+
  pantalla de búsqueda duplicaría esa info sin ganancia real.
- **Login oculto/ofuscado** — descartado: no aporta seguridad real, la protección
  real ya vive en el backend (auth en cada endpoint sensible).
- **Cloudinary** para subir fotos de producto (hoy es pegar URL a mano) — idea
  mencionada, no evaluada todavía.
- **Carrito de compra real / checkout** — fase 2 ("la tienda"), no esta fase.
- **Cambio de tipografía global** — se mencionó ("si podemos cambiar la font")
  pero nunca se concretó a qué fuente ni en qué alcance (¿toda la app o solo
  catálogo público?). Preguntar antes de tocar `Saira`/`Saira Condensed`.

## Assets sueltos, sin usar en código (no borrar, son reales)

- `public/logo.svg` (646KB, badge/escudo con camioneta) y `public/logo.jpeg` —
  reemplazados por `pickup.svg`/`pickup.png` en los 3 lugares de marca, pero
  quedaron en el repo por si se quieren retomar.
- `frontend/design/canvas/` — experimento con la skill `canvas-design` (filosofía
  de diseño + PNG generado), descartado por el usuario ("esa virgada"). No forma
  parte del producto, es solo scratch.
