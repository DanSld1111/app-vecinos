# 0040 — "Mi cuenta" (autoservicio) + confirmación al resetear una clave

## Contexto

Dos pedidos del usuario:

1. Cualquier cuenta del panel (sin importar el rol) necesita una sección propia para cambiar su
   nombre, su contraseña y subir una foto de perfil — **nunca el correo**, porque es el
   identificador de login. Hasta ahora `CuentasController` estaba 100% restringido a
   `super_admin`; no existía ningún camino para que una cuenta editara sus propios datos.
2. En **Cuentas**, el botón "Restablecer" contraseña de otra persona actuaba directo, sin pedir
   confirmación — riesgo real de error humano (un clic de más invalida la contraseña de alguien
   sin querer).

## Decisión

### Backend: cuatro rutas de autoservicio bajo `/cuentas/yo`

`CuentasController` sigue con `@Roles("super_admin")` a nivel de clase (gestionar OTRAS cuentas
sigue siendo exclusivo de super-admin), pero las cuatro rutas nuevas llevan su propio
`@Roles(...TODOS_LOS_ROLES)` a nivel de método, que pisa el de la clase (confirmado leyendo
`RolesGuard`: usa `reflector.getAllAndOverride`, method gana sobre class):

- `PUT /cuentas/yo` — cambia `nombre` (nunca `correo`, ni `rol`, ni accesos).
- `POST /cuentas/yo/clave` — cambia la contraseña, pero a diferencia de "restablecer" (que hace
  un super_admin sobre otra cuenta sin conocer la anterior), acá se exige la contraseña
  **actual** — si no coincide, 401 con mensaje claro. Reutiliza `REGEX_CONTRASENA_SEGURA` (8+
  caracteres, mayúscula, número, especial — mismo criterio que el registro de vecino).
- `POST /cuentas/yo/foto` — sube una foto de perfil (JPG/PNG/WEBP, 5MB), mismo patrón multer que
  `foto-negocio.config.ts`. Se agregó la columna `cuentas.foto_url` (migración 0014) y el campo
  `fotoUrl` al contrato `Cuenta`.

Las tres rutas están declaradas antes de `PUT/DELETE ":id"` — si no, Nest capturaría `"yo"` como
un id literal.

### Frontend admin: página "Mi cuenta" + avatar clicable

`MiCuenta.tsx` (ruta `/mi-cuenta`, sin restricción de rol — cualquier cuenta logueada entra):
foto de perfil, nombre editable, correo deshabilitado con una nota explicando por qué, y cambio
de contraseña con el mismo checklist visual de reglas que ya usaba `Login.tsx`. El pie del
sidebar (`.pie-usuario`, hasta ahora solo decorativo) pasó a ser un link a `/mi-cuenta`, y ya
muestra la foto subida si existe.

### Confirmación antes de "Restablecer" en Cuentas

`Cuentas.tsx` ya no llama `restablecerClave` directo al hacer clic — abre
`ModalConfirmarResetear` (mismo patrón visual que el de eliminar cuenta), con el nombre y correo
de la persona a la vista y una advertencia de que su contraseña actual deja de funcionar de
inmediato. Solo tras confirmar se genera la contraseña temporal y se muestra en el modal de
siempre (`ModalContrasenaGenerada`).

## Validado en vivo

- `PUT /cuentas/yo`, `POST /cuentas/yo/clave` (con clave actual incorrecta → 401 legible; con la
  correcta → 204) probados por API directo.
- En el panel: cambié el nombre de la cuenta super-admin desde "Mi cuenta" y el sidebar se
  actualizó al instante, sin recargar; confirmé que el campo Correo está deshabilitado.
- En Cuentas: clic en "Restablecer" para una cuenta real abre el modal de confirmación con su
  nombre — cancelado sin ejecutar el reset, para no invalidar una contraseña real de prueba.
