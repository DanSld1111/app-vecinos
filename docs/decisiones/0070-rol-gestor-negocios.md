# 0070 — Rol "Gestor de negocios"

## Contexto

Hasta ahora, dar de alta un negocio, editar la ficha de cualquiera, o publicar/despublicar
requería la cuenta `super_admin` — que además ve distritos, categorías, cuentas, publicidad,
avisos y todo lo demás del panel. El pedido fue una cuenta que administre **todos los negocios**
(alta, edición, "etc etc") sin cargar con el resto del panel.

## Decisión: un rol nuevo, acotado solo a Negocios

`gestor_negocios` — mismo poder que `super_admin` tiene hoy sobre el módulo de negocios, y nada
más:

- Sidebar: un único link, "Negocios" ([LayoutAdmin.tsx](../../apps/admin/src/componentes/LayoutAdmin.tsx)).
- Puede: listar todos los negocios (cualquier estado/distrito), dar de alta, editar cualquier
  ficha (info, horario, fotos, productos, ofertas, galería, dueño), publicar, despublicar y
  rechazar.
- No puede: Cuentas, Distritos, Categorías, Plantillas, Arquetipos, Servicios, Publicidad,
  Novedades, Avisos, Usuarios, ni la cola de validación compartida (`/validacion`, que mezcla
  negocios y avisos — el gestor publica sus negocios directo desde la pestaña "Estado" de la
  ficha, sin pasar por esa cola).

Sin distritos asignados (a diferencia de `junta_vecinal`/`validador_contenido`, que sí pueden
acotarse): el pedido fue "todos los negocios", así que el rol no ofrece esa opción en el alta de
cuenta. La arquitectura de alcance (`dentroDelAlcance`) ya soporta distritos vacíos = todos, así
que si más adelante se quiere un "gestor de San Borja" acotado, es on/off, no una reconstrucción.

## Un solo punto de autorización para edición

`verificarPropiedad()` en
[negocios.service.ts](../../apps/api/src/modulos/negocios/negocios.service.ts) es el único guardia
que protegen las 18 rutas de edición (info, horarios, fotos, productos completos, ofertas,
galería). Antes solo dejaba pasar a `super_admin` o al dueño asignado; ahora también a
`gestor_negocios`. Un cambio, cubre todo — no hay 18 chequeos duplicados que mantener en
sincronía.

El resto (`listarAdmin`, `crear`, `aprobar`, `despublicar`, `rechazar`) usa `@Roles(...)` a nivel
de endpoint, así que ahí se agregó `"gestor_negocios"` a cada decorador correspondiente.

## El ENUM de Postgres

`rol` en la tabla `cuentas` es `ENUM rol_cuenta`, no texto libre — un valor nuevo necesita
`ALTER TYPE ... ADD VALUE` antes de que la API pueda grabar una cuenta con ese rol (si no, sale
`invalid input value for enum rol_cuenta`). Ver
[migración 0017](../../infraestructura/migraciones/0017_rol_gestor_negocios.sql), aplicada a
producción.

## Verificado en vivo (contra producción, con limpieza)

Cuenta de prueba `gestor_negocios` → login → aterriza en `/negocios` con el sidebar reducido a un
solo link → creó un negocio de prueba → **403 al intentar entrar a `/cuentas`** (confirma el
límite) → publicó el negocio recién creado (`aprobar`) → lo editó sin que perdiera el estado
"activo" (sin re-validación, según [0066](0066-edicion-sin-validacion.md)) → cuenta y negocio de
prueba eliminados al terminar, sin dejar rastro en producción.
