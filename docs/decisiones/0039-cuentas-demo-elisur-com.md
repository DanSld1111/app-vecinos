# 0039 — Cuentas de prueba del login con dominio @elisur.com

## Contexto

El usuario pidió que la caja de "Cuentas de prueba" del login muestre cuentas reales de la base
de datos, con el super-admin en `admin@elisur.com` y el resto de roles con correos inventados
pero terminados en `@elisur.com` — hasta ahora mezclaban `@elisur.app`, `@elfogon.pe` y
`@sanborja.pe`, dominios de ejemplo poco consistentes entre sí.

## Decisión

Se renombraron las 4 cuentas que se muestran en esa caja (las mismas 4 de siempre, no se crearon
cuentas nuevas — conservan su `id`, nombre, rol, negocios y distritos asignados):

| Rol | Correo anterior | Correo nuevo |
|---|---|---|
| Super-admin | admin@elisur.app | admin@elisur.com |
| Dueño de negocio | maria@elfogon.pe | dueno@elisur.com |
| Junta vecinal | juntavecinal@sanborja.pe | junta@elisur.com |
| Validador | rocio@elisur.app | validador@elisur.com |

Las contraseñas no cambiaron (`admin123`/`negocio123`/`junta123`/`validar123`) — solo se pidió
cambiar el correo. Las demás cuentas de prueba (juntas/validadores de Miraflores, Surco y
Surquillo) no se tocaron — no aparecen en esa caja, quedan fuera del pedido.

Se actualizó en las tres fuentes para que quede consistente si algún día se regenera todo desde
cero:
- La base de datos real (`UPDATE cuentas SET correo = ...`).
- `apps/admin/src/datos/mock/cuentas.mock.ts` (la fuente que usa el generador de semilla).
- `infraestructura/datos-semilla/generar-semilla.js` y su `0001_piloto.sql` regenerado.
- La caja de "Cuentas de prueba" en `Login.tsx`, y el placeholder del campo Correo
  (`tucorreo@elisur.app` → `tucorreo@elisur.com`).

## Validado en vivo

Login real con `admin@elisur.com` / `admin123` contra la base de datos — entra al Dashboard
normalmente, con la cuenta "Equipo ELISUR" en el pie del panel.
