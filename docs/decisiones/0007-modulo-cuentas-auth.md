# 0007 — Módulo `cuentas` (autenticación del panel)

## Contexto

El panel admin (`apps/admin`) inicia sesión hoy contra `credencialesDemo` en memoria
(`useSesionAdmin.ts` / `useCuentas.ts`) — contraseñas en texto plano, sin backend. Este módulo
reemplaza esa pieza con autenticación real, siguiendo el mecanismo que ya se había fijado en
[0006](0006-estructura-api-nestjs.md): JWT + guards de NestJS.

## Decisiones

**JWT sin estado (`@nestjs/jwt`), sin tabla de sesiones.** El token solo lleva `{ sub: cuentaId }`;
en cada request protegido, `JwtStrategy` vuelve a consultar la cuenta completa en la base
(`AuthService.obtenerCuentaVigente`). Es una consulta extra por request, pero significa que
desactivar una cuenta o cambiarle el rol tiene efecto inmediato en la siguiente llamada, sin
esperar a que el token expire ni mantener una lista de revocación aparte.

**Las contraseñas se hashean con bcrypt (`bcryptjs`), nunca se comparan ni se devuelven en texto
plano.** `cuentas.password_hash` nunca sale del backend: `aCuenta()` (en `cuentas.mapeo.ts`) no lo
incluye en el objeto que ve el cliente, ni siquiera en `/auth/perfil`.

**Rol y guards, no un sistema de permisos genérico.** `RolesGuard` + `@Roles(...)` restringen por
`RolCuenta` (el mismo enum que ya existe en `paquetes/tipos`). Hoy solo `cuentas` usa
`@Roles("super_admin")` — es el único módulo que ya tenía esa regla implícita en el panel
(`Cuentas.tsx` es una pantalla que en la práctica solo ve el super-admin). Los demás módulos
(negocios, avisos) definirán sus propias reglas de rol cuando se construyan — no se adivinan aquí.

**`PUT /cuentas/:id` reemplaza `negocioIds` y `distritosAsignados` completos**, en vez de exponer
endpoints separados para agregar/quitar un negocio o un distrito uno por uno (como hoy hacen
`agregarNegocio`/`quitarNegocio` en el store de Zustand). El store del admin ya arma el array
completo en memoria antes de llamar a estas funciones — cuando `apps/admin` se conecte a esta API,
esas funciones pasan a ser wrappers que llaman a `actualizar()` con el array modificado, sin que el
backend necesite un endpoint por operación.

**Transacciones explícitas** (`BaseDatosService.transaccion`) para crear/actualizar una cuenta:
la fila de `cuentas` y sus filas de `cuenta_negocios`/`cuenta_distritos` se escriben juntas o no se
escribe ninguna. Evita el caso donde una cuenta queda creada pero sin sus distritos asignados por
un error a mitad de camino.

**Login y refresco de `ultimo_acceso_en` en la misma operación**, no un endpoint aparte — es el
mismo comportamiento que ya tenía el campo en el tipo `Cuenta` original, solo que ahora se
persiste de verdad en vez de quedarse en `null` para siempre como en el mock.

## Qué no incluye

- Recuperación de contraseña por correo (no hay servicio de envío de correos todavía).
- Refresh tokens: el token dura `JWT_EXPIRES_IN` (12h por defecto) y punto; cuando expira, se
  vuelve a iniciar sesión. Es un panel interno de bajo tráfico — no justifica la complejidad de
  un flujo de refresh todavía.
- Auth para negocios administrando su propia ficha (mencionado en la sección 14.1 del doc
  maestro) — mismo mecanismo (`cuentas` con rol `dueno_negocio` ya existe), pero las pantallas
  del lado del dueño de negocio no están construidas.

## Cómo probarlo una vez haya base de datos

```bash
curl -X POST http://localhost:3000/auth/iniciar-sesion \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@elisur.app","contrasena":"admin123"}'
# -> { "token": "...", "cuenta": { ... } }

curl http://localhost:3000/cuentas -H "Authorization: Bearer <token>"
```
