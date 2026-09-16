# Diagnóstico general y plan de ciberseguridad

Basado en una revisión real del código al 2 de septiembre de 2026 (no en suposiciones
genéricas): se leyó `main.ts`, las estrategias JWT, los servicios de auth, las consultas SQL,
y se corrió `npm audit` en las tres apps. Cada hallazgo de la Parte 2 apunta al archivo exacto.

---

## Parte 1 — Diagnóstico funcional (qué falta construir)

Ya cubierto en detalle en [10-fases-pendientes.pdf](10-fases-pendientes.pdf) (desactualizado,
fechado 27 de agosto) — el resumen vigente al día de hoy:

- **Etapa 1 y 2**: completas.
- **Etapa 3 (Integración)**: casi completa. Falta: catálogo UBIGEO completo (1874 distritos),
  directorio real de negocios de San Borja, índice de búsqueda dedicado (Meilisearch/Typesense
  — hoy es consulta directa a Postgres, funciona pero no escala), y cambiar el interruptor
  `EXPO_PUBLIC_DATA_SOURCE` de `mock` a `api` para el lanzamiento.
- **Etapa 4 (Endurecimiento y lanzamiento)**: no iniciada — CDN de imágenes, Sentry, PostHog,
  textos legales, compilación de producción (EAS Build) y publicación en tiendas.
- **Después del lanzamiento**: fichas 100% autogestionadas con fotos/reseñas, los 8 servicios
  "Próximamente", módulo de pagos, expansión a nuevos distritos.
- **Decisiones de negocio/legales pendientes** (no técnicas): nombre de marca definitivo, modelo
  de ingresos, revisión legal de datos personales, figura del coordinador local, y los 4
  servicios bloqueados por decisión (Técnicos a domicilio, Taxi Vecino Seguro, Bolsa de puntos,
  Biblioteca virtual).

## Parte 2 — Diagnóstico de seguridad actual

### Lo que ya está bien hecho
- **Contraseñas**: nunca en texto plano — `bcrypt` con 10 rondas en los 4 lugares donde se
  hashean (`cuentas.service.ts`, `vecinos-auth.service.ts`, `auth.service.ts`,
  `codigo-recuperacion.ts`).
- **Inyección SQL**: revisadas todas las consultas con interpolación de texto — el patrón es
  consistente: solo se interpolan constantes fijas del propio código (listas de columnas,
  fragmentos `WHERE`), nunca valores de usuario; esos siempre van como parámetro `$n`
  (`negocios.service.ts:46`, búsqueda `ILIKE` incluida). No se encontró ningún caso de
  concatenación insegura.
- **XSS**: no hay un solo `dangerouslySetInnerHTML` en `apps/admin` ni `apps/movil` — todo el
  render pasa por el escapado automático de React.
- **Autorización re-verificada en cada request, no solo al hacer login**: `JwtStrategy.validate()`
  y `JwtVecinoStrategy.validate()` consultan la cuenta/usuario vigente en la base en cada
  petición — desactivar una cuenta la deja sin acceso al instante, sin esperar a que expire el
  token (confirmado en vivo, [decisión 0009](0009-validacion-en-vivo.md)).
- **Dos sistemas de JWT separados a propósito** (`JWT_SECRET` para cuentas del panel,
  `JWT_SECRET_VECINO` para vecinos) — un token robado de un sistema no sirve en el otro.
- **`ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true`** (`main.ts`) —
  cualquier campo no declarado en un DTO se rechaza automáticamente.
- **Secretos fuera del código**: `.env` está en `.gitignore`; los valores reales ya se cambiaron
  del placeholder de ejemplo.

### Hallazgos que hay que corregir

| # | Severidad | Hallazgo | Dónde | Estado |
|---|-----------|----------|-------|--------|
| 1 | 🔴 Alta | Si `JWT_SECRET`/`JWT_SECRET_VECINO` no está definido, el servidor **arranca igual** usando un secreto de repuesto escrito en el propio código (`"cambiar-en-produccion"`). Cualquiera que lea el código puede forjar tokens válidos de super-admin si esto llega a pasar en un entorno mal configurado. | `jwt.strategy.ts:17`, `jwt-vecino.strategy.ts:22` | ✅ **Corregido** — `validar-entorno.ts`, llamado al inicio de `main.ts`. Si falta cualquiera de los dos secretos, mide menos de 32 caracteres, o sigue con el valor de repuesto, el servidor imprime el error y corta el arranque (`process.exit(1)`). Probado en vivo simulando un arranque sin `JWT_SECRET`. |
| 2 | 🔴 Alta | **Cero límite de intentos** en login, código de recuperación o cualquier otra ruta — nada impide un ataque de fuerza bruta o adivinar el código de 6 dígitos por prueba y error. | Todo `apps/api` | ✅ **Corregido** — `@nestjs/throttler`: límite general de 100 req/min por IP en toda la API (`app.module.ts`), y 5 req/min por IP en las rutas de login/registro/recuperación de clave (`auth.controller.ts`, `vecinos-auth.controller.ts`). Probado en vivo: 5 intentos de login devuelven `401`, el 6º devuelve `429 Too Many Requests`. |
| 3 | 🟠 Media | **CORS abierto a cualquier origen** (`app.enableCors()` sin restricciones) — cualquier sitio web puede hacer peticiones a la API desde el navegador de un usuario. | `main.ts` | ✅ **Corregido** — `app.enableCors({ origin: [...] })` con lista real, configurable por `CORS_ORIGENES_PERMITIDOS`. Probado en vivo: un origen permitido recibe la cabecera correcta, uno no permitido no recibe ninguna. Ver [decisión 0020](../decisiones/0020-dependencias-cors-cache.md). |
| 4 | 🟠 Media | **Sin cabeceras de seguridad HTTP** (no hay `helmet`) — faltan protecciones estándar contra clickjacking, sniffing de MIME, etc. | `apps/api` | ✅ **Corregido** — `app.use(helmet())` agregado en `main.ts`. |
| 5 | 🟠 Media | **8 vulnerabilidades conocidas** en dependencias del backend (`multer`: denegación de servicio; `qs`/`express`: DoS). | `apps/api` | ✅ **Corregido** — NestJS v10→v11 (no v12, ver decisión 0020 para por qué). **0 vulnerabilidades** en `apps/api` tras el upgrade, probado en vivo. |
| 6 | 🟡 Media-baja | El código de recuperación de contraseña se imprime en la consola del servidor (`console.log`) — es la decisión conocida "modo local" mientras no hay proveedor de correo, pero **si esos logs se envían a algún sistema externo sin cuidado, cualquiera con acceso a logs puede resetear cualquier contraseña**. | `codigo-recuperacion.ts:32` | ⏳ Pendiente — depende de contratar un proveedor de correo (Horizonte 2). |
| 7 | 🟡 Baja | El endpoint de crear cuenta (`POST /cuentas`, solo accesible a super-admin) valida la contraseña con `@MinLength(8)` nada más, no con la regla completa (mayúscula+número+símbolo) que sí se exige al vecino y al reestablecer clave — inconsistencia menor, bajo riesgo porque ya requiere rol super-admin. | `crear-cuenta.dto.ts:25` | ⏳ Pendiente — bajo riesgo, no priorizado todavía. |
| 8 | 🟡 Baja | Vulnerabilidades moderadas en `react-router` (`apps/admin`) y ~20 en dependencias de Expo (`apps/movil`, mayormente en tooling de build, no en runtime de producción). | `npm audit` en cada app | 🟡 **Parcial** — `react-router-dom` actualizado a v7, probado en vivo. `vite`/`esbuild` (solo expone el servidor de desarrollo local, no producción) deliberadamente diferido — ver decisión 0020. Expo/movil sin revisar todavía. |
| 9 | ⚪ A definir | Sin `Sentry`/logging estructurado — si algo falla en producción, hoy no hay forma de enterarse salvo que un usuario lo reporte. | Ya está en la hoja de ruta (Etapa 4) |
| 10 | 🔴 Alta | **El rate-limiting no distinguía usuarios en Render** — sin `trust proxy`, Express veía la misma IP (la del proxy de Render) para todas las peticiones. El límite de 5/min en login era, en la práctica, un único cupo compartido por todos los usuarios a la vez: cualquiera podía agotarlo con 5 intentos fallidos y bloquear el login de todo el mundo por un minuto. | `main.ts` | ✅ **Corregido** — `app.set("trust proxy", 1)`. Confirmado en vivo antes y después: antes, 3 pedidos con IP falsa distinta consumían el mismo contador; el fix hace que Express lea la IP real reenviada por el proxy de Render. Ver [decisión 0051](../decisiones/0051-fix-rate-limit-sin-trust-proxy.md). |
| 11 | 🟠 Media | Vulnerabilidad conocida en `multer` (DoS vía nombres de campo manipulados, bypass del límite de tamaño por condición de carrera) que arrastra `@nestjs/platform-express`. Mitigado en parte porque todos los endpoints de subida de archivos exigen `JwtAuthGuard` (un atacante sin cuenta no llega a activar el parseo de multipart), pero cualquier cuenta autenticada de menor privilegio sí podría explotarlo. | `apps/api` (`npm audit`) | ⏳ Pendiente — el fix (`npm audit fix --force`) sube `@nestjs/platform-express` a v12, cambio con breaking changes; no se aplicó sin evaluar (mismo criterio que la decisión 0020 sobre no saltar de más versiones a la vez). |

---

## Plan de ciberseguridad

Organizado en 3 horizontes: **antes de tocar producción** (bloqueante), **antes del
lanzamiento público** (importante) y **mantenimiento continuo** (para siempre).

### Horizonte 1 — Bloqueante antes de cualquier entorno real con datos de verdad

1. ✅ **Que el servidor rehúse arrancar sin secretos reales** — `comun/validar-entorno.ts`.
2. ✅ **Límite de intentos (rate limiting)** — `@nestjs/throttler`, 5/min en rutas de auth.
3. ✅ **CORS restringido** — `app.enableCors({ origin: [...] })`, configurable por
   `CORS_ORIGENES_PERMITIDOS` (poner ahí los dominios reales antes de publicar).
4. ✅ **`helmet`** — agregado en `main.ts`.
5. ✅ **Dependencias vulnerables actualizadas** — NestJS v10→v11 en `apps/api` (0 vulnerabilidades)
   y `react-router-dom` v6→v7 en `apps/admin`, ambas probadas en vivo. Ver
   [decisión 0020](../decisiones/0020-dependencias-cors-cache.md) para el detalle (incluye por qué
   no se saltó a NestJS v12, y por qué `vite`/`esbuild` en `apps/admin` se deja pendiente a
   propósito).

### Horizonte 2 — Antes de publicar la app al público (Etapa 4)

6. **Servicio de correo real** para el código de recuperación, y quitar el `console.log` de
   desarrollo (o dejarlo detrás de `if (process.env.NODE_ENV !== "production")`).
7. **HTTPS obligatorio.** El backend debe correr detrás de un proxy (Nginx, Cloudflare, o el load
   balancer del hosting elegido) que termine TLS — nunca exponer el puerto 3000 de Node
   directamente a internet.
8. **Variables de entorno por entorno**, gestionadas por el proveedor de hosting (no archivos
   `.env` subidos a ningún lado) — Railway, Render, Fly.io y similares ya lo resuelven con su
   propio panel de secretos.
9. **Backups automáticos de la base de datos** — snapshot diario de Postgres con al menos 7 días
   de retención antes de tener usuarios reales con datos reales.
10. **Sentry** (errores) y un logging estructurado mínimo — sin esto, un fallo en producción es
    invisible hasta que un usuario se queja.
11. **Revisión legal de datos personales** (ya anotado como pendiente de negocio, no técnico) —
    define qué datos personales se guardan (nombre, correo, teléfono, ubicación aproximada) y con
    qué base legal, según la Ley de Protección de Datos Personales del Perú (Ley N.° 29733).
12. **Content-Security-Policy** para `apps/admin` (servido como sitio estático) — reduce el
    impacto de un XSS aunque hoy no se haya encontrado ninguno.

### Horizonte 3 — Mantenimiento continuo (para siempre, ya en producción)

13. **`npm audit` en cada despliegue** (o automatizado con Dependabot/Renovate) — las
    dependencias acumulan vulnerabilidades nuevas con el tiempo, no es un chequeo de una sola vez.
14. **Rotación de secretos** — plan simple para cambiar `JWT_SECRET`/`JWT_SECRET_VECINO`
    periódicamente o ante sospecha de filtración (invalida todas las sesiones activas, es
    esperado).
15. **Monitoreo de intentos de login fallidos** — una vez con Sentry/logging, alertar si una
    misma IP o cuenta acumula muchos fallos (más allá del rate-limit básico del punto 2).
16. **Revisión de permisos por rol cada vez que se agregue un endpoint nuevo** — el patrón ya
    establecido (`@Roles()` + `RolesGuard` + verificación de propiedad como
    `verificarPropiedad()` en negocios) debe aplicarse a todo endpoint nuevo desde el día uno,
    no agregarse después.
17. **Pentest o auditoría externa** antes de manejar pagos reales (cuando se active el módulo de
    pagos) — un vistazo de terceros antes de que haya dinero real de por medio.

---

## Qué NO es una preocupación de seguridad hoy (para no perder tiempo ahí)

- El **almacenamiento del token en memoria** (Zustand, sin `localStorage`) en `apps/admin` y
  `apps/movil` — se pierde la sesión al recargar, lo cual es una molestia de UX, pero es
  justamente lo que hace que un XSS (si alguna vez existiera uno) no pueda robarse un token
  persistente del navegador. No cambiar esto a `localStorage` sin evaluar el trade-off.
- El proyecto **no es todavía un repositorio git** (`git rev-parse` confirma que no lo es), así
  que no hay riesgo de secretos filtrados en historial de commits — pero en cuanto se inicialice
  git, `.env` ya está correctamente en `.gitignore`.
