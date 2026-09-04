# 0008 — Módulos `contenido` (avisos) y `usuarios` (vecinos de la app)

## Contexto

Con `cuentas`/auth ya construido ([0007](0007-modulo-cuentas-auth.md)), tocaba el resto de lo que
`docs/tecnica/10-fases-pendientes.pdf` marca como pendiente de Etapa 2: avisos, vecinos y
profesionales. De los tres, **profesionales queda fuera** de esta ronda — no existe ni un mock de
ejemplo ni una pantalla en `apps/admin` que lo use hoy (a diferencia de `Cuenta`, `Negocio`, `Aviso`
y `UsuarioApp`, que sí tienen ambas cosas). Construir su API sería inventar un contrato sin nada
real que lo respalde — mismo criterio ya aplicado en [0006](0006-estructura-api-nestjs.md).

## Decisiones

**El módulo `contenido` replica exactamente el flujo de tres pantallas ya construidas**, no un
CRUD genérico de avisos:

- `apps/admin/src/paginas/Avisos.tsx` (super-admin): publica directo, sin pasar por cola →
  `POST /avisos/directo`, `GET /avisos/todos`, `DELETE /avisos/:id`.
- `apps/admin/src/paginas/MisAvisos.tsx` (Junta Vecinal): redacta y envía a validación, corrige lo
  rechazado → `POST /avisos/enviar-a-validacion`, `GET /avisos/mios`, `PATCH /avisos/:id/reenviar`.
- `apps/admin/src/paginas/ColaValidacion.tsx` (Validador de contenido / super-admin): aprueba o
  rechaza, acotado a sus distritos asignados → `GET /avisos/pendientes`, `PATCH /avisos/:id/aprobar`,
  `PATCH /avisos/:id/rechazar`.
- `GET /avisos` (público, sin auth): lo que consume la app del vecino — solo `estado='publicado'`,
  paginado por keyset igual que `negocios`.

**La categoría "seguridad" queda bloqueada en los DTOs de Junta Vecinal** (`EnviarAValidacionDto`,
`ReenviarAvisoDto` solo aceptan `municipal | junta_vecinal | otro`), reproduciendo la regla que ya
existía en el frontend (`CATEGORIAS_JUNTA` en `MisAvisos.tsx`): esa categoría es solo para
Serenazgo/Municipalidad vía publicación directa del super-admin. Antes vivía como una restricción
de UI que cualquiera podía saltarse llamando directo a la función del store; ahora es una regla del
propio backend.

**El alcance por distrito se resuelve en el servidor, no se confía en el cliente.** `dentroDelAlcance`
(espejo de `apps/admin/src/utilidades/alcance.ts`) se aplica en `listarPendientes`, `aprobar` y
`rechazar` — un validador con `distritosAsignados` no vacío jamás puede aprobar/rechazar un aviso
fuera de su distrito, ni aunque conozca el id exacto y llame al endpoint directo.

**`usuarios` (vecinos de la app) es CRUD mínimo, reservado a `super_admin`**: listar, alternar
bloqueo, eliminar — exactamente las tres operaciones que ya existían en `useUsuarios.ts`. Sin
paginación (mismo criterio que `categorias`: es una lista de gestión interna, no un listado público
sin límite).

## Qué no incluye

- Edición de avisos ya publicados (el frontend tampoco lo permite — un aviso publicado es de solo
  lectura; corregirlo significa crear uno nuevo).
- Notificaciones push cuando un aviso pasa de pendiente a publicado/rechazado — no hay servicio de
  notificaciones todavía.
- El lado de negocios de la cola de validación (`ColaValidacion.tsx` también lista negocios
  `por_verificar`) — el módulo `negocios` de [0006](0006-estructura-api-nestjs.md) hoy solo expone
  lectura pública de negocios `activo`; agregar la vista admin de negocios pendientes queda para
  cuando se conecte `apps/admin` de verdad (Etapa 3), no antes.
