# 0034 — La app y las últimas 3 secciones del panel se conectan de verdad

## Contexto

El usuario pidió una auditoría general de la app y del panel. Se encontraron dos problemas:

1. **La app móvil corría con datos de ejemplo (mock) por defecto**, no contra `apps/api`. No
   existía `apps/movil/.env.local`, y `entorno.ts` cae a `EXPO_PUBLIC_DATA_SOURCE=mock` cuando esa
   variable no está definida. Todo lo verificado en vivo hasta ahora coincidía visualmente porque
   el mock se mantiene sincronizado a mano con los datos semilla — pero eran dos copias
   independientes, no la misma fuente.
2. **Tres secciones del panel admin nunca llegaron a conectarse a un backend real**, pese a que
   las tablas ya existían desde las migraciones 0002 y 0004 (`distritos`, `comunidades`,
   `arquetipos`, `plantillas_visuales`) y los datos semilla ya las poblaban:
   - **Distritos y comunidades** (`useGeografia.ts` / `Distritos.tsx`): todo en memoria del
     navegador (zustand sin persistencia), se perdía al recargar.
   - **Novedades** (`useNovedades.ts` / `Novedades.tsx`): mismo caso — la propia pantalla ya
     tenía una nota admitiéndolo ("Pendiente técnico real").
   - **Arquetipos** (`useArquetipos.ts` / `Arquetipos.tsx`): mismo caso, sin backend en absoluto.

## Decisión

### 1. App móvil → API real

Se creó `apps/movil/.env.local` con `EXPO_PUBLIC_DATA_SOURCE=api`. El código para hablar con la
API ya existía (`RepositorioXApi` para cada entidad, seleccionado en `fabricaRepositorios.ts`
según esta variable) — solo faltaba el archivo. Expo necesita reiniciar el servidor para releer
`.env.local` (no es hot-reloadable), así que se reinició `npm run web --workspace=apps/movil`.

### 2. Backend nuevo: Novedades y Arquetipos

Dos módulos Nest nuevos, mismo patrón que `categorias`/`publicidad` (DTOs con class-validator,
service con SQL directo, controller con `JwtAuthGuard`+`RolesGuard`+`@Roles("super_admin")`):

- `apps/api/src/modulos/novedades/` — `GET /novedades` (público, solo `activo`), `GET
  /novedades/admin`, `POST`, `PATCH /:id`, `DELETE /:id`.
- `apps/api/src/modulos/arquetipos/` — todo bajo `super_admin` (la app móvil no lo consume
  directamente, solo el panel — ver comentario en `arquetipos.service.ts`). `campos` se guarda
  como `JSONB`. Eliminar respeta la FK real de `categorias.arquetipo_id` (día que una categoría
  lo use, la propia base de datos lo impide — se traduce a un 409 legible).

### 3. Geografia: "crear distrito" pasa a ser "activar un distrito del catálogo"

Se descubrió que la base ya tiene el catálogo UBIGEO completo (1892 distritos, la mayoría
`activo=false` — ver `infraestructura/datos-semilla/0002_catalogo-ubigeo-nacional.sql`), pero el
panel simulaba "crear distrito" como un alta libre con cualquier ubigeo inventado. Se corrigió
para que coincida con la regla ya escrita en el doc maestro ("expandir a una zona nueva es
activar un registro, nunca una migración de esquema"):

- `GET /distritos` (activos, admin) y `GET /distritos/buscar?q=` (busca en el catálogo completo,
  activos e inactivos — nuevo `DistritosController`).
- `PATCH /distritos/:ubigeo/activar` — enciende un distrito ya existente.
- `POST /comunidades` — crea la primera comunidad de un distrito activo (mismo punto de
  coordenadas que su distrito; la fecha de lanzamiento queda en `CURRENT_DATE`).
- `GET /comunidades/todas` (admin, incluye inactivas — antes solo existía la pública, que filtra
  `activo=true` para la app).

El modal "Nuevo distrito" de `Distritos.tsx` pasó de un formulario libre a un buscador sobre el
catálogo real, con un botón "Activar" por resultado; al activar, se abre automáticamente el
formulario inline para cargar la primera comunidad — mismo flujo de antes, ahora sobre datos
reales.

### 4. App móvil: Novedades deja de ser un array fijo en código

`apps/movil/app/notificaciones/index.tsx` importaba `novedadesMock` directamente, sin pasar por
el patrón repositorio/hook que usa el resto de la app. Se agregó `RepositorioNovedades`
(contrato + mock + api) y `useNovedades()` siguiendo el mismo patrón que `useServicios`/
`useComunidades`, y la pantalla ahora usa ese hook — "Ocultar" desde el panel ahora sí oculta la
novedad en la app.

## Bug encontrado durante la verificación en vivo

Los tres `cargar()` nuevos (`useGeografia`, `useNovedades`, `useArquetipos`) originalmente no
mandaban el token de sesión, aunque sus rutas están protegidas con `@Roles("super_admin")` — a
diferencia de `useCategorias.cargar()`, que sí funciona sin token porque `GET /categorias` es
pública. El síntoma en vivo: el Dashboard mostraba "0 distritos activos" y la pantalla de
Novedades mostraba "Unauthorized". Se corrigió pasando `token` en las tres. Buena lección: no
asumir que todos los `cargar()` sin argumentos son intercambiables — depende de si la ruta es
pública o no.

## Validado en vivo (end-to-end panel → app)

1. Se activó "Chorrillos" desde el buscador del modal, se creó su primera comunidad
   ("Chorrillos Centro") desde el panel.
2. Sin tocar código ni reiniciar nada, la app móvil (en modo prueba) abrió directamente en
   "Chorrillos Centro hoy", y el selector de comunidad la listó junto a las 4 del piloto.
3. Se revirtieron ambos cambios por SQL directo (`DELETE` de la comunidad, `activo=false` del
   distrito) para no dejar datos de prueba en el piloto real.
4. Confirmado por `performance.getEntriesByType('resource')` en el navegador: la app hace
   peticiones reales a `localhost:3000/v1/...` con `comunidadId` — antes del fix no había ninguna.
5. Novedades y Arquetipos cargan sus filas reales de Postgres en el panel (2 y 6 respectivamente).
