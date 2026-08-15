# Rivera Imports — estado y cómo retomar

**Última actualización:** 2026-08-15
**Último commit frontend:** `030ff1a` — docs: estado del proyecto y guía pa retomar
**Último commit backend:** `4c4b0f1` — feat: agrega endpoints públicos GET /catalogo y /catalogo/articulos/{id}

⚠️ **Todo lo de esta sesión (2026-08-15) está sin commitear.** `git status` en ambos
repos muestra los cambios como working tree sucio — no se hizo ningún commit todavía.
Revisar con `git status -s` antes de commitear en bloque o por partes.

Ninguno de los dos repos está pusheado a GitHub.

## Qué es esto

Catálogo público sin login (`/catalogo`) para Rivera Imports (repuestos automotrices,
El Salvador). El admin elige qué productos se muestran; visitantes navegan, arman una
"lista de interés" y la mandan por WhatsApp (link `wa.me`, texto plano — **sin**
WhatsApp Business API). Fase 1: sin carrito, sin pagos, sin cuentas — eso es "la
tienda", fase 2 aparte.

Spec: `docs/superpowers/specs/2026-08-14-catalogo-publico-design.md`
Plan original (10 tasks): `docs/superpowers/plans/2026-08-14-catalogo-publico.md`

## Hecho

**Sesión 2026-08-14 (commiteada):** catálogo público Tasks 1-9 (backend
`visible_publico` + endpoints públicos, tipos, servicio, paginación compartida,
iconos por categoría, toggle admin, grilla y detalle públicos), rediseño de login,
marca `pickup.svg`/`pickup.png`. Detalle completo: ver commits `5140408` y anteriores.

**Sesión 2026-08-15 (sin commitear, todo lo de abajo):**

### Task 10 — lista de interés + WhatsApp (completa)
- `ListaInteresProvider` envolviendo `(catalogo)/layout.tsx`
- `AgregarAListaButton.tsx` — botón reusable, feedback "Agregado" ~1.5s
- `CatalogoHeader.tsx` — Sheet con lista, steppers, "Vaciar lista", "Consultar por
  WhatsApp"
- `catalogo/page.tsx` y `CatalogoDetalleScreen.tsx` — botón agregado
- Mensaje de WhatsApp dice "me interesa comprar" (no "consultar disponibilidad") +
  incluye link a la lista compartida

### Rate limiting — protección del número de WhatsApp
- Backend: `POST /catalogo/consulta-whatsapp`, límite en memoria (sin dependencia
  nueva) de **5 peticiones / 10 min por IP**, 429 si se pasa. Constante en
  `main.py`: `LIMITE_WHATSAPP_PETICIONES` / `LIMITE_WHATSAPP_INTERVALO`.
- ⚠️ Límite en memoria por proceso — se resetea al reiniciar uvicorn, no se comparte
  entre workers. Si el backend pasa a multi-worker/multi-instancia, mover a Redis.
- Frontend llama el endpoint antes de abrir `wa.me`; si da 429, toast de error.

### Lista compartida — `/catalogo/lista`
- Ruta pública nueva, sin DB: el link de WhatsApp lleva un código opaco
  (`?c=<base64url>`) que codifica `articuloId:cantidad` por ítem —
  `src/lib/lista-codigo.ts` (`codificarLista`/`decodificarLista`).
- `CatalogoListaScreen.tsx` — fetchea cada artículo por id y muestra foto/precio/
  cantidad. Si un artículo ya no está visible, se omite silenciosamente.
- Descartado a propósito: código corto guardado en DB (reabría idea ya rechazada en
  brainstorming — "el mensaje ya trae todo, no aporta duplicar en tabla+endpoint").

### 404 con identidad de marca
- `src/app/not-found.tsx` — `BlueprintRotor` de fondo (girando, tenue), racing-stripe,
  botones a catálogo e inicio.

### Animaciones (`emil-design-eng`)
- `BlueprintRotor` gira despacio (24s, `linear`, solo `transform`, keyframe
  `rotor-spin` en `globals.css`), coordenadas de vents/holes redondeadas a 2
  decimales pa evitar hydration mismatch (`Math.cos`/`sin` difieren en el último bit
  entre server/cliente).
- Logo del header (`pickup.svg`) entra con slide+fade, **solo en `/catalogo` exacto**
  (gateado con `usePathname`, no en detalle ni en lista compartida).
- `priority` en los `<Image>` de logo (login + header) — eran LCP candidate.

### Splash / loader — Lottie generado desde `pickup.svg` real
- **No hay skill de Lottie en este entorno.** El JSON se armó en dos etapas:
  1. Yo parseé el `d` real de `pickup.svg` (bezier exacto, script Node, sin tipear a
     mano) → primera versión con "entra manejando + bambolea". Funcionaba pero el
     usuario la encontró plana.
  2. El usuario mismo re-hizo el import en el editor visual de **LottieFiles**
     (tienen preview real, yo no) y separó cada pieza del camión en layers propios,
     con animación de "drop-in" (cada pieza cae desde arriba, escalonada, `tr.p`
     animado dentro de cada shape group) — mucho mejor resultado. Yo le sumé encima:
     offsets radiales por pieza (según su propia posición respecto al centro, no
     todas caen derecho) + tumble (rotación ±25°) + escala 55-70%→100%, timing
     escalonado real (frames 5-69 de 90 @ 60fps).
- Archivo fuente: `public/pickup.json` (el que el usuario edita/re-genera).
  Archivo bundleado: `src/components/common/pickup-splash-data.json` — **son el
  mismo contenido, hay que copiar manual cada vez que uno cambia** (no hay build
  step que los sincronice). Componente: `PickupLoader.tsx`.
- `CatalogoSplash.tsx` — mobile-only (`sm:hidden`), una vez por sesión
  (`sessionStorage`), usa `PickupLoader` con `onComplete` pa disparar el fade-out.
- `src/app/loading.tsx` — loader global de Next (`loading.tsx` de App Router), usa
  el mismo `PickupLoader`, decisión explícita del usuario de meterlo en **todo el
  sitio incluido el panel admin** (se le avisó que a esa frecuencia de uso puede
  sentirse repetitivo, insistió, se implementó igual).
  - ⚠️ **Limitación real, sin resolver:** casi todas las pantallas de este proyecto
    son client components que fetchean con `useFetch` en un `useEffect` — el
    `loading.tsx` de Next solo se dispara en la transición de *ruta* (RSC/segment),
    no en ese fetch interno. En la práctica se ve al navegar entre secciones, NO
    reemplaza los `<Skeleton>` que ya existen en cada pantalla mientras carga su
    tabla. Si se quiere que también cubra eso, hay que tocar cada screen
    (`InventoryScreen`, `SalesScreen`, etc.) — no se hizo, no se confirmó si se
    quiere.

### Subida de fotos — a medias, PAUSADO acá
Se investigó el patrón real en el proyecto hermano `Documents/accesorios/` (no el
componente señuelo `ProductPhotoUpload.tsx`, sino el flujo real en
`AddProductScreen.tsx` + endpoint backend): sube por `FormData` al backend, backend
valida tipo/tamaño y sube a Cloudinary, guarda `secure_url`.

**Backend — hecho:**
- `cloudinary` instalado en el venv y en `requirements.txt`
- `POST /articulos/{articulo_id}/imagen` en `main.py` — valida tipo (jpg/png/webp) y
  tamaño (5MB), sube con `folder="rivera-imports"`, `public_id=f"articulo_{id}"`,
  transform a 1200px + auto format/quality, guarda `secure_url` en `articulo.foto`
- `.env` y `.env.example` tienen `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`
  **vacíos** — el usuario va a crear una cuenta Cloudinary nueva (no reutilizar la de
  accesorios-sv) y pegar las credenciales ahí

**Frontend — a medias:**
- `src/components/common/SubirFotoArticulo.tsx` creado (thumbnail clickeable, valida
  tipo/tamaño en cliente, preview con `URL.createObjectURL`, usa `<img>` plano para
  el preview porque `next/image` no puede optimizar `blob:` URLs)
- **Falta:** `api.subirImagenArticulo` en `lib/api.ts` (no existe todavía), wirear
  el componente en `AddProductScreen.tsx` (patrón: crear artículo primero pa tener
  `id`, subir la foto después) y en el dialog de edición de `ProductDetailScreen.tsx`
  (subir al guardar cambios si se seleccionó archivo nuevo)

## Errores cometidos esta sesión (pa no repetir)

1. **`AppProvider` en el layout raíz disparaba fetch a endpoints protegidos en
   `/catalogo`.** `loadRemoteState()` pegaba a `/articulos`, `/ventas`, `/usuarios`,
   `/configuracion` en cada mount, sin importar la ruta. Sin token (celular, browser
   limpio) esas llamadas dan 401 → el interceptor de axios fuerza
   `window.location.href = "/login"`, sacando al visitante del catálogo público sin
   avisar. Fix real: mover `AppProvider` del layout raíz a `(app)/layout.tsx`
   (solo lo usan pantallas admin, cero uso en `(catalogo)`/`(auth)`).
2. **`ListaInteresContext.persistir` llamaba `setItems` desde DENTRO del updater de
   otro `setItems`** (`agregar`/`actualizarCantidad`/`quitar` todos tenían este
   patrón). setState anidado en un updater causa doble aplicación bajo React Strict
   Mode — "Agregar" sumaba 2 en vez de 1. Fix: `persistir` solo escribe
   localStorage, no vuelve a llamar `setItems`.
3. **`window.open()` después de un `await` — bloqueado en Safari/iOS.** El flujo de
   WhatsApp hacía `await api.consultarWhatsapp()` y DESPUÉS `window.open(...)`; en
   Safari eso pierde el "user gesture" del click y el popup se bloquea en silencio
   (sin error visible). Fix estándar: abrir la pestaña en blanco *síncrono* dentro
   del handler del click, navegarla (`ventana.location.href = url`) después que
   resuelve el await.
4. **Coordenadas Lottie mal calculadas en el intento de rotar llantas.** Al
   "parentear" un layer hijo a un layer padre con anchor=posición coincidentes, la
   posición del hijo YA es directa en el mismo espacio de coordenadas del padre — le
   resté el centro (`CX`/`CY`) de más y las llantas terminaron fuera del canvas
   (x≈-90). Se detectó porque no giraban (invisibles), no por error de consola.
   Esto quedó revertido — se abandonó el intento de rotar llantas en favor del
   efecto de "armado" que el usuario prefirió.
5. **Doble URL-encoding en el link de la lista compartida.** `encodeURIComponent`
   sobre `:`/`,` (caracteres válidos sin escapar en un query value) hacía que el
   link se viera como `%3A`/`%2C` en el texto plano del mensaje de WhatsApp. Fix:
   no encodear esos caracteres (innecesario), y después se resolvió del todo con el
   código base64url.

## Cómo retomar

**Backend:**
```
cd backend
./venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```

**Frontend:** `cd frontend && pnpm dev` (puerto 3000). Ojo: `pnpm add lottie-react`
ya corrido, `node_modules` debería tenerlo — si es checkout limpio, `pnpm install`.

**Verificación estándar:**
```
pnpm exec tsc --noEmit
pnpm run lint   # baseline: 4 errores preexistentes en use-fetch.ts/AuthContext.tsx/AppContext.tsx, no tocar
pnpm run build
```

**Probar en el celular otra vez (se revirtió, hay que rehacerlo si hace falta):**
1. `ipconfig` → IP de la Wi-Fi (era `192.168.0.14`, puede cambiar)
2. Backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
3. Backend CORS en `main.py`: agregar `"http://<IP>:3000"` a `allow_origins`
4. `frontend/next.config.ts`: agregar `allowedDevOrigins: ["<IP>"]` (si no, Next
   bloquea el HMR cross-origin)
5. `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://<IP>:8000` (si no, el celular
   intenta pegarle a sí mismo)
6. Entrar directo a `http://<IP>:3000/catalogo` — la raíz (`/`) es el dashboard
   admin, protegido, rebota a `/login` si el celular no tiene sesión (normal, no es
   bug)
7. **Antes de deployar a prod:** revertir los 3 cambios de arriba (CORS, `.env.local`,
   `next.config.ts`) — son solo pa LAN local, `.env.local` no se commitea pero los
   otros dos sí, no dejarlos.

**Cloudinary** (cuando el usuario tenga las credenciales):
```
# backend/.env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
Después: agregar `api.subirImagenArticulo` en `lib/api.ts`, wirear
`SubirFotoArticulo.tsx` en `AddProductScreen.tsx` y `ProductDetailScreen.tsx`
(ver sección de arriba, patrón exacto en `Documents/accesorios/accesorios-sv-front`).

**Editar la animación del splash:** tocar `public/pickup.json` (source of truth,
editable en LottieFiles) y **copiar manualmente** a
`src/components/common/pickup-splash-data.json` (el que realmente se bundlea) —
no hay build step que los sincronice, hay que acordarse.

## Parqueado (con razón, no implementar sin retomar la conversación)

- **Bot de WhatsApp con disponibilidad automática** — requiere WhatsApp Business API,
  matching de mensajes con catálogo, endpoint backend nuevo. Descartado, el usuario
  aclaró que solo quiere que las alertas lleguen a un número fijo, no un bot.
- **Sistema de código/lookup para carritos guardado en DB** — descartado dos veces
  (brainstorming inicial + de nuevo cuando se armó la lista compartida). El código
  base64url en la URL (sin DB) cumple lo mismo.
- **Login oculto/ofuscado** — descartado: no aporta seguridad real.
- **Bot flotante de recomendaciones / generador de listas** — idea del usuario,
  él mismo la marcó como fase "tienda en línea" (fase 2), no ahora.
- **Carrito de compra real / checkout** — fase 2, no esta fase.
- **Cambio de tipografía global** — mencionado, nunca concretado a qué fuente ni
  alcance. Preguntar antes de tocar `Saira`/`Saira Condensed`.
- **`loading.tsx` cubriendo también el fetch interno de cada pantalla** (no solo
  transición de ruta) — mencionado, no confirmado, ver limitación arriba.

## Assets sueltos, sin usar en código (no borrar, son reales)

- `public/logo.svg` (646KB, badge/escudo con camioneta) y `public/logo.jpeg` —
  reemplazados por `pickup.svg`/`pickup.png`, quedaron por si se retoman.
- `frontend/design/canvas/` — experimento con la skill `canvas-design`, descartado
  por el usuario ("esa virgada"). Scratch, no es parte del producto.
- `public/pickup.json` — **sí se usa**, pero indirectamente (es la fuente que se
  copia a mano a `src/components/common/pickup-splash-data.json`, ver arriba). No es
  scratch, no borrar.
