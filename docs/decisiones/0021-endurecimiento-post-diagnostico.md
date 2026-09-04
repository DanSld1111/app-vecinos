# 0021 — Endurecimiento post-diagnóstico: fotos, borrado suave, auditoría, paginación, sesión y tests

## Contexto

Un repaso libre del código real (no un pendiente ya anotado en otro documento) encontró 7 huecos
concretos: sin subida de archivos, notificaciones push cosméticas (solo un interruptor local),
"aceptar términos" sin checkbox real, listados admin sin paginar, borrados físicos sin rastro,
sesiones sin manejo de expiración, y cero tests automatizados. Se abordaron todos **menos el
checkbox de términos**, deliberadamente diferido — ver
[docs/legal](../legal) para cuando se retome.

## Decisiones

### 1. Borrado suave + auditoría

`usuarios_app`, `cuentas` y `avisos` ganaron una columna `eliminado_en TIMESTAMPTZ` (migración
`0010_endurecimiento.sql`). Todo `DELETE FROM` se volvió `UPDATE ... SET eliminado_en = now()`, y
cada ruta de lectura que antes no distinguía sumó `AND eliminado_en IS NULL` — incluyendo las dos
rutas más sensibles: `obtenerCuentaVigente` (gatilla cada request autenticado del panel admin) y
`obtenerVigente` (lo mismo para el vecino). Sin este filtro en esas dos, desactivar/eliminar una
cuenta no tendría efecto inmediato — la garantía que ya establecía la
[decisión 0009](0009-cuentas-negocios-relacion.md).

Nueva tabla `auditoria` (acción, entidad, id de entidad, cuenta que actuó, detalle JSONB) +
`AuditoriaService.registrar(...)`, inyectable globalmente. **Nunca lanza** — un fallo al auditar
no puede tumbar la acción real que sí importa (aprobar un aviso, bloquear una cuenta, etc.), solo
queda un `warn` en el log. Se registran: alta/baja/bloqueo de cuentas y vecinos, aprobar/rechazar
avisos y negocios.

### 2. Paginación real en los 3 listados admin que no tenían

`negocios/admin`, `cuentas.listar` y `usuarios.listar` traían la tabla entera sin límite. Se
reutilizó el mismo cursor por keyset `(creadoEn, id)` que ya usaba el resto de la API (nunca
offset, ver [docs/tecnica](../tecnica)) vía un nuevo `PaginacionAdminDto` compartido
(`cursor?`, `limite = 100`, tope 200). El límite por defecto es deliberadamente generoso: con el
volumen real de datos del piloto, todo entra en la primera página y "cargar más" solo se activa
el día que un listado realmente crezca más allá de eso.

### 3. Sesión expirada, ya no un error genérico

Antes, un `401` a mitad de sesión (token vencido, o la cuenta desactivada/eliminada mientras el
usuario seguía navegando) se veía como "no se pudo completar la solicitud" — sin cerrar sesión,
sin explicar qué pasó. `apiFetch` en `apps/admin` y `apps/movil` ahora distingue: un `401` en una
petición que **sí llevaba token** dispara un manejador registrado por el store de sesión
correspondiente, que cierra la sesión con el mensaje "Tu sesión expiró — vuelve a ingresar."
(un `401` sin token, como un login con clave incorrecta, sigue siendo el error normal de
credenciales). En `apps/movil` conviven dos sistemas de sesión sobre el mismo `apiFetch` (vecino y
"modo gestión" de dueño de negocio/junta vecinal); el manejador de cada uno compara el token que
vino en la petición fallida contra el suyo propio antes de cerrar, para que el vencimiento de uno
nunca cierre por error la sesión del otro.

### 4. Subida real de fotos de negocio

`multer` (ya venía como dependencia transitiva de `@nestjs/platform-express`, 0 vulnerabilidades
nuevas) con `diskStorage` en `apps/api/uploads/negocios/` — **almacenamiento local de paso**,
explícitamente documentado como reemplazable por un CDN (Cloudflare Images, Etapa 4) sin que el
resto del código se entere: la columna `foto_principal_url` solo guarda una URL. Nombre de
archivo aleatorio (`randomUUID()` + extensión), `fileFilter` restringido a JPG/PNG/WEBP,
`5MB` máximo. `NegociosService.actualizarFoto` verifica que quien sube sea dueño del negocio
(mismo `verificarPropiedad` que ya usaban horarios/ofertas) y borra el archivo anterior del disco
al reemplazarlo, para no acumular huérfanos. Los archivos se sirven vía
`app.useStaticAssets()` de Nest, montados en `/uploads/` — deliberadamente fuera del prefijo
`/v1` (son archivos estáticos, no rutas de la API).

En `apps/admin`, `MiNegocioFotos.tsx` pasó de un botón deshabilitado a la subida real (input de
archivo oculto + `apiSubirArchivo`, un helper aparte de `apiFetch` porque el multipart no lleva
`Content-Type` manual — lo arma el navegador solo con el boundary correcto). De paso se completó
un hueco que ya existía en `MiNegocio.tsx`: la vista previa de "Así te ven los vecinos" nunca
había renderizado la foto ya subida (`fotoPrincipalUrl ? null : <IconoCategoria />` — el caso
`true` no dibujaba nada), ahora sí muestra la imagen real.

### 5. Notificaciones push reales (backend completo; celular real pendiente de un build EAS)

`usuarios_app.push_token` (columna nueva, migración `0010`). `POST /auth/vecino/push-token`
(autenticado con el JWT del vecino) guarda o borra ese token. `NotificacionesPushService` —
mismo patrón que `AuditoriaService`, nunca lanza — envía vía la API pública de Expo
(`https://exp.host/--/api/v2/push/send`, no requiere credenciales propias) a todos los vecinos con
token registrado de la comunidad de un aviso, disparado desde `AvisosService.aprobar` justo
después de publicarlo.

En `apps/movil` se instaló `expo-notifications` y `useNotificaciones.ts` pasó de un interruptor
cosmético a pedir el permiso real del sistema operativo (`requestPermissionsAsync`) y obtener el
token de Expo (`getExpoPushTokenAsync`) cuando el vecino activa notificaciones — con un camino
aparte para cuando corre en navegador (`Platform.OS === "web"`, el modo usado hoy para
previsualizar la app): ahí no existe el mismo flujo nativo, así que se guarda la preferencia sin
pedir permiso del SO ni token real. Al cerrar sesión, se borra el token guardado en el servidor
para que no le sigan llegando notificaciones a ese celular con una cuenta que ya cerró.

**Limitación real, no de este código**: un "Expo push token" utilizable solo existe en un build
nativo real (`eas build`) — no en Expo Go sin proyecto vinculado ni en el modo web usado para
desarrollar esta sesión. `getExpoPushTokenAsync()` sin un `projectId` de EAS configurado
(`app.json` no tiene todavía `extra.eas.projectId` — no se ha corrido `eas build` en este
proyecto) falla de forma esperada y se captura sin romper nada: el vecino queda con el permiso
activado, y el token real se registrará solo automáticamente en cuanto exista ese build. Por eso
la verificación de este punto cubrió el circuito completo por el lado del servidor (guardar
token, aprobar un aviso, ver la llamada a la API de Expo) pero no una notificación real llegando
a un celular — no hay forma de probar eso sin ese build, que es trabajo de otra etapa.

### 6. Primera suite de tests automatizados

Cero tests existían en todo el proyecto. Se instaló Jest + `ts-jest` en `apps/api` (`npm test`) y
se escribieron 21 tests sobre la lógica más aislable y crítica de decisiones de seguridad ya
tomadas, sin depender de una base de datos real:

- `dentroDelAlcance` (alcance.ts) — el filtro que acota qué distritos puede validar cada cuenta.
- `codificarCursor`/`decodificarCursor` (paginacion.ts) — incluye cursores corruptos o con forma
  ajena, que deben devolver `null` en vez de lanzar.
- `REGEX_CONTRASENA_SEGURA` (contrasena-segura.ts).
- `validarEntorno()` — que de verdad corte el arranque (`process.exit(1)`) ante cada variante de
  secreto de JWT mal configurado (hallazgo #1 de
  [docs/tecnica/11-plan-seguridad.md](../tecnica/11-plan-seguridad.md)).
- `BusquedaService` sin Meilisearch configurado — que el respaldo a ILIKE de Postgres sea
  automático (`null`, nunca lanza) y que ni siquiera intente tocar Postgres de más.

El único ajuste de infraestructura necesario: `meilisearch` se publica como ESM puro, incompatible
con el Jest en CommonJS del proyecto — se resolvió con un mock mínimo
(`apps/api/test/mocks/meilisearch.ts`) vía `moduleNameMapper`, ya que los tests de
`BusquedaService` nunca llegan a instanciarlo de verdad.

## Validado en vivo

- **Borrado suave + auditoría**: se eliminó y restauró una cuenta real (Rocío), confirmando en
  Postgres el `eliminado_en`, su ausencia del listado y la fila de auditoría — luego se limpió
  todo.
- **Paginación**: forzando `limite=2` en `/negocios/admin` y `/cuentas`, la segunda página
  (con el `cursorSiguiente` devuelto) trajo filas distintas y correctas.
- **Sesión expirada**: con Rocío logueada en el navegador, se desactivó su cuenta desde otra
  sesión como super-admin — al siguiente clic, el panel la redirigió sola al login con el mensaje
  exacto "Tu sesión expiró — vuelve a ingresar."
- **Subida de fotos**: como María (dueña de "El Fogón Sanborjino"), subida real vía `curl` y
  confirmada visualmente en el navegador (login real, pestaña Fotos, vista previa incluida);
  probado también el reemplazo (borra el archivo anterior), el rechazo por tipo de archivo
  inválido, y el rechazo por no ser dueña del negocio (403). Todo el estado de prueba —archivos en
  disco, `foto_principal_url`, contraseñas usadas temporalmente para la prueba— se limpió después.
- **Push notifications**: guardado de token vía `POST /auth/vecino/push-token` confirmado en
  Postgres; aprobar un aviso real disparó la llamada a la API de Expo sin errores ni bloquear la
  aprobación; probado también en el navegador que activar/desactivar notificaciones no rompe nada
  en el modo web. Datos de prueba (token, estado del aviso, fila de auditoría) revertidos después.
- **Tests**: `npm test` en `apps/api` — 21/21 verdes.

## Pendiente explícito

- Checkbox real de "aceptar términos" en el registro — deferido a propósito, no forma parte de
  este endurecimiento.
- Un build EAS real (`eas build`) para que `apps/movil` obtenga tokens de push utilizables en un
  celular de verdad — ver sección 5.
- Tests automatizados en `apps/admin` y `apps/movil` (hoy solo `apps/api` tiene suite) — quedó
  fuera por alcance, no por falta de valor.
