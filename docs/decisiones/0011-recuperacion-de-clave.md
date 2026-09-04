# 0011 — Recuperación de contraseña ("olvidé mi clave")

## Contexto

Con `cuentas` (panel) y `usuarios_app` (vecinos) ya autenticando con correo + clave real
([0007](0007-modulo-cuentas-auth.md), [0010](0010-registro-vecinos-correo-clave.md)), faltaba la
salida obvia cuando alguien la olvida. El usuario pidió que exista tanto en la app del vecino como
en el panel administrador.

## Decisiones

**Código de 6 dígitos por correo, no un enlace mágico.** Un enlace de reseteo necesitaría una
página web dedicada para el panel y un deep link configurado para la app móvil — dos mecanismos de
entrega distintos para el mismo problema. Un código de 6 dígitos que se escribe a mano funciona
igual en ambos: se pide el correo, se recibe el código, se escribe el código junto con la clave
nueva. Mismo patrón mental que el login por SMS que existía antes (Etapa 1), pero ahora resuelto
con datos reales en vez de un `código de 6 dígitos, cualquiera funciona`.

**El código se guarda hasheado con bcrypt (`codigo_recuperacion_hash`), nunca en texto plano**,
igual criterio que la contraseña misma — si la base de datos se filtra, los códigos activos no
sirven de nada sin además romper bcrypt. Vence a los 15 minutos (`codigo_recuperacion_expira`) y se
borra (`NULL`) apenas se usa una vez, exista o no éxito en el intento siguiente de reutilizarlo.

**Sin envío real de correo todavía.** No hay proveedor de email contratado (sección 14.2 del doc
maestro, mismo estado que el envío de SMS). El código se imprime en el log del servidor
(`[DEV] Código de recuperación para X: 123456`) — nunca en la respuesta HTTP, ni siquiera en modo
desarrollo, porque devolverlo en la respuesta permitiría a cualquiera con solo el correo de otra
persona resetear su clave sin pasar por el correo real. Esto es un bloqueo real de lanzamiento:
antes de producción hace falta un proveedor (SES, SendGrid, Postmark) que reemplace
`logCodigoDesarrollo()` en `apps/api/src/comun/codigo-recuperacion.ts` por un envío real — el resto
del flujo no cambia.

**`POST /auth/olvide-clave` y `/auth/vecino/olvide-clave` responden siempre igual**, exista o no el
correo — evita que ese endpoint sirva para confirmar qué correos están registrados en el sistema.

**La contraseña nueva exige la regla de fuerza completa** (`RestablecerClaveConCodigoDto`,
compartido entre `cuentas` y `usuarios_app`), aunque una cuenta del panel creada por un super-admin
hoy solo exige `MinLength(8)`. Es una mejora de política aplicada en el momento del reseteo, sin
tocar retroactivamente cuentas ya existentes.

**DTOs compartidos** (`comun/dto/olvidar-clave.dto.ts`, `comun/dto/restablecer-clave-con-codigo.dto.ts`)
en vez de duplicarlos en `auth` y `usuarios` — misma forma exacta para ambos flujos, solo cambia la
tabla que consulta cada servicio.

## Gaps conocidos, documentados a propósito

- **Sin límite de intentos ni de solicitudes.** No existe todavía un módulo de rate-limiting en la
  API (`@nestjs/throttler` u otro) — alguien podría spamear `/olvide-clave` o probar códigos por
  fuerza bruta dentro de la ventana de 15 minutos. Antes de producción esto necesita throttling por
  IP/correo, además del proveedor de email real.
- El panel admin (`Login.tsx`) y la app (`FlujoLogin.tsx`) implementan la misma UX de recuperación
  por separado — no hay una librería de UI compartida entre `apps/admin` (React web) y
  `apps/movil` (React Native), así que cada uno tiene su propia pantalla con el mismo flujo lógico.

## Validado en vivo

Probado de punta a punta en ambas plataformas contra la base de datos real: pedir código,
verificar que el código incorrecto y la clave débil se rechazan, cambiar la clave con el código
correcto, e iniciar sesión con la clave nueva — tanto para una cuenta del panel (`super_admin`)
como para un vecino de la app. De paso se conectó `apps/admin` a la API real por primera vez:
`Login.tsx`/`useSesionAdmin.ts` (antes 100% mock) y `Usuarios.tsx`/`useUsuarios.ts` (antes leía
`datos/mock/usuarios.mock.ts`, ahora eliminado por no tener más uso) ya hablan con `apps/api`.

Se encontró y corrigió un bug real de layout en `Usuarios.tsx`: al agregar la línea de correo,
`.correo-cuenta` (un `<span>` inline) hacía que correo y teléfono se concatenaran sin separación
visual y, en viewports angostos, colapsaban la columna del nombre a ancho 0. Fix en
`apps/admin/src/index.css`: `.info-cuenta b` y `.info-cuenta .correo-cuenta` ahora son
`display:block` con `text-overflow:ellipsis` para truncar con elegancia en vez de desbordar.
