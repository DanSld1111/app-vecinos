# 0020 — Dependencias vulnerables, CORS restringido, y caché/reintentos reales

## Contexto

Últimos 3 pendientes técnicos "sin bloqueo" del [plan de seguridad](../tecnica/11-plan-seguridad.md)
y de [10-fases-pendientes.pdf](../tecnica/10-fases-pendientes.pdf): actualizar dependencias con
vulnerabilidades conocidas, restringir CORS antes de publicar, y revisar la decisión de
`networkMode` de TanStack Query en `apps/movil` ahora que los repositorios reales ya dependen de
la red (pendiente explícito desde la propia Etapa 1, nunca revisado).

## Decisiones

### Dependencias

**`apps/api`: NestJS v10 → v11 (no v12).** `npm audit fix --force` sugería saltar directo a
`@nestjs/core@12`, pero eso resultó ser una sobre-corrección: la vulnerabilidad real
(`multer`/`qs`/`body-parser`, vía `@nestjs/platform-express`) ya está resuelta desde
`@nestjs/core@11.1.18` — un solo salto de versión mayor, no dos. Se verificó además que
`@nestjs/throttler@6.5.0` (ya instalado) solo declara soporte hasta Nest v11, no v12 — saltar
directo a v12 habría forzado también una actualización del throttler sin garantía de
compatibilidad. Se actualizaron junto con el core: `@nestjs/common`, `@nestjs/platform-express`,
`@nestjs/passport` y `@nestjs/jwt` (los dos últimos, sus versiones más nuevas ya solo declaran
soporte para Nest v11+). Resultado: **0 vulnerabilidades** en `apps/api`.

**Bug real encontrado durante el upgrade**: instalar con `cd apps/api && npm install ...` (en
vez de `npm install --workspace=apps/api` desde la raíz) dejó `@nestjs/platform-express` y
`@nestjs/passport` en un `node_modules` anidado dentro de `apps/api/` en vez de en el
`node_modules` raíz del monorepo — mientras el resto (`core`, `common`, `jwt`, `throttler`)
sí quedó en la raíz. Este layout mixto hizo que `NestFactory.create(AppModule)` fallara al
autodetectar el adaptador HTTP (`"No driver (HTTP) has been selected"`) aunque el paquete
estuviera instalado y en la versión correcta. Se corrigió en dos partes: (1) borrar
`apps/api/node_modules` y reinstalar con `npm install --workspace=apps/api` desde la raíz, y
(2) pasar el adaptador explícito (`new ExpressAdapter()`) a `NestFactory.create()` en `main.ts`
en vez de depender de la autodetección — más robusto de cara a este tipo de particularidad de
monorepos con npm workspaces, independientemente de dónde termine cada paquete.

**Cambio de tipos menor**: `@nestjs/jwt` v11+ tipa `expiresIn` contra el formato de duración de
la librería `ms` (`"12h"`, `"30d"`) en vez de aceptar cualquier `string` — una variable de
entorno siempre es `string` a secas para TypeScript, así que hizo falta un cast explícito en
`auth.module.ts` y `usuarios.module.ts`.

**`apps/admin`: `react-router-dom` v6 → v7.** Repasados los 14 archivos que lo importan: todos
usan la API "declarativa" clásica (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`,
`Navigate`, `Outlet`, `useNavigate`, `useLocation`, `useSearchParams`) — ninguna de las APIs que
cambiaron entre v6 y v7. Upgrade de bajo riesgo, confirmado en vivo (ver más abajo).

**Deliberadamente NO actualizado esta vez: `vite`/`esbuild` en `apps/admin`.** La vulnerabilidad
(`esbuild` permite que cualquier sitio web le pida cosas al servidor de desarrollo y lea la
respuesta) solo es explotable mientras el propio desarrollador tiene `vite dev` corriendo
localmente Y visita un sitio malicioso al mismo tiempo — no existe en producción (`vite build`
no usa el servidor de desarrollo). Arreglarlo de verdad exige saltar de Vite 5 a Vite 6+ (no hay
un parche dentro de la propia v5: `vite@5.4.21`, la última de esa serie, todavía trae el
`esbuild` vulnerable) — una actualización mayor con su propio riesgo de regresión que no se
justifica para un riesgo que solo existe en la máquina del propio desarrollador. Queda anotado
para cuando se aborde como su propia tarea, no de paso.

### CORS restringido

`app.enableCors()` (sin argumentos = abierto a cualquier origen) pasó a
`app.enableCors({ origin: [...] })` con la lista real de orígenes, configurable por
`CORS_ORIGENES_PERMITIDOS` (separado por coma) — sin definir esa variable, usa una lista de
puertos locales típicos de desarrollo (`5183`, `8081`, `8082`, `19006`, cubriendo el `autoPort`
de Vite/Expo). En producción, esa variable debe apuntar a los dominios reales de `apps/admin` y
`apps/movil` — nunca dejarse sin definir ahí.

### `networkMode` de TanStack Query en `apps/movil` — el pendiente que llevaba desde Etapa 1

El comentario original en `queryClient.ts` decía textualmente: *"Los datos de Etapa 1 son
locales (mock), no HTTP real... Revisar en Etapa 2, cuando los repositorios reales sí dependan
de la red."* Nunca se había revisado a pesar de que Etapa 3 ya conecta `apps/movil` a la API
real ([decisión 0013](0013-movil-conectado-a-api.md)).

**Encontrado en el camino: dos sistemas de detección de conectividad que no se hablaban entre
sí.** Ya existía `useConectividad.ts` (con `@react-native-community/netinfo` real) alimentando
el banner "Sin conexión" — pero TanStack Query nunca se enteraba de esa señal. En React Native
(a diferencia del navegador), el `onlineManager` de TanStack Query no tiene de dónde escuchar
"online"/"offline" por su cuenta (no existen los eventos de `window` que usa por defecto) — sin
conectarlo a mano, la librería asume que siempre hay conexión, sin importar lo que diga el
dispositivo real. Se conectó `onlineManager.setEventListener` al mismo NetInfo que ya usaba el
banner.

**El fix no podía ser un cambio global de `networkMode`.** La razón original de `"always"`
seguía siendo válida para el modo `mock` (datos locales y síncronos, nunca deben pausarse por
conectividad) — cambiar todo a `"online"` habría reparado el caso real pero roto el caso mock
(el que usa cualquiera que corra la app sin instalar un servidor, el default del proyecto). Se
dejó condicional a `entorno.fuenteDeDatos`: `"online"` (el default de la librería) cuando es
`"api"`, `"always"` cuando es `"mock"` — cada modo se comporta como siempre debió.

## Validado en vivo

- **NestJS v11 + Express 5**: backend reiniciado y probado — todas las rutas se registran
  igual, login exitoso, rate limiting sigue cortando en el 6.º intento, endpoint de búsqueda con
  Meilisearch responde igual que antes del upgrade.
- **react-router-dom v7**: login, listado de Negocios, drawer de detalle y navegación entre
  Negocios ↔ Cola de validación probados en el navegador real — sin errores de consola, sin
  comportamiento distinto al de antes.
- **CORS restringido**: `curl` con `Origin: http://localhost:5183` recibe la cabecera
  `Access-Control-Allow-Origin` correcta; con `Origin: http://malicioso.com`, la cabecera no
  aparece en absoluto (el navegador bloquearía esa respuesta). El panel admin real siguió
  funcionando sin ningún error de CORS en consola.
- **`networkMode` condicional**: `apps/movil` en modo `mock` (el default) sigue funcionando
  exactamente igual, sin errores de consola. Cambiando a modo `api` (`.env.local` temporal,
  revertido al terminar), la app cargó datos reales de San Borja (avisos, negocios, ofertas)
  contra el backend real con CORS restringido y NestJS v11 — todo el conjunto de cambios de esta
  sesión funcionando junto, sin errores.

Estado final de dependencias: **`apps/api` en 0 vulnerabilidades**; `apps/admin` bajó de 4 a 2
(las 2 restantes son el `vite`/`esbuild` deliberadamente diferido, documentado arriba).
