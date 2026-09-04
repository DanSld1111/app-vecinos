# 0015 — Backend de gestión de negocios y `apps/admin` conectado

## Contexto

Tras [0014](0014-admin-cuentas-avisos-conectados.md), `Negocios.tsx` quedó como el bloque más grande
pendiente: a diferencia de `Cuentas`/`Avisos`, su backend admin (crear, editar, aprobar/rechazar,
autoservicio del dueño) no existía todavía — solo estaba el `GET /negocios` público construido en
[0006](0006-estructura-api-nestjs.md). Se construyó el módulo completo y se conectó todo lo que
dependía de él: `Negocios.tsx`, el lado de negocios en `ColaValidacion.tsx` y
`HistorialValidaciones.tsx`, y las páginas de autoservicio del dueño (`MiNegocio.tsx`,
`MiNegocioHorario.tsx`, `MiNegocioOfertas.tsx`).

## Decisiones

**Autorización por dos ejes distintos, no solo por rol.** Aprobar/rechazar/listar-pendientes usa
`dentroDelAlcance(cuenta, distritoUbigeo)` (igual que avisos, [0008](0008-modulos-avisos-vecinos.md)).
Pero editar un negocio (`info`, `horarios`, `ofertas`) no es cuestión de distrito sino de
propiedad: un `dueno_negocio` solo puede tocar los negocios en `cuenta.negocioIds`. Se agregó
`verificarPropiedad(cuenta, negocioId)` — `super_admin` pasa siempre, `dueno_negocio` pasa solo si
es suyo, cualquier otro caso es `403`. Verificado en vivo: María (dueña de `neg-restaurante-fogon`)
recibe `403` al intentar editar un negocio ajeno.

**Editar campos "sensibles" reabre validación; los demás se guardan directo.** Igual que se hizo
para avisos: cambiar `nombre`, `direccion` o categorías vuelve el negocio a `por_verificar` (debe
volver a pasar por la cola); cambiar `descripcion`, `telefono` o `whatsapp` se guarda sin tocar el
`estado`. Es la misma regla que ya estaba en el mock, ahora aplicada server-side.

**Rechazar respeta si el negocio ya estuvo verificado alguna vez.** Regla heredada tal cual del
mock: rechazar una edición de un negocio que ya tenía `verificadoEn` lo regresa a `activo` (la
versión visible sigue siendo la última aprobada); rechazar un alta nueva que nunca se verificó lo
deja `inactivo`. Verificado en vivo con ambos casos.

**Bug encontrado y corregido: `jsonb - $param` sin cast borra por clave, no por índice.**
`eliminarOferta` hacía `ofertas - $2` para borrar la oferta en la posición `$2` de un array jsonb.
Postgres tiene dos operadores `-` para jsonb: uno recibe `int` (borra por índice) y otro `text`
(borra una clave de objeto). `node-postgres` manda los parámetros sin tipar como texto, así que
Postgres resolvía siempre el operador de texto — sin arrojar ningún error, simplemente no pasaba
nada. Se detectó comparando directo en `psql` (`'[1,2,3]'::jsonb - 0` funciona, `- '0'::text` no
existe como índice). Arreglado con cast explícito: `ofertas - $2::int`.

**Se creó `useContadorPendientes`, un store aislado solo para el badge del sidebar**, en vez de
seguir leyendo `useNegocios().negocios`/`useAvisos().avisos`. Esos dos stores ahora tienen un único
array que cambia de contenido según qué `cargarX()` se llamó último (`admin`, `mios`, `pendientes`,
`historial` — patrón de [0014](0014-admin-cuentas-avisos-conectados.md)). El sidebar de
`LayoutAdmin` y la página `Dashboard` montan al mismo tiempo tras el login y cada uno necesita un
recorte distinto (`pendientes` vs. todos); si ambos escriben el mismo array, gana el que responda
último — se vio en vivo como `Dashboard` mostrando "0 negocios activos" en vez de 3. El sidebar
ahora tiene su propio cajón de estado que nadie más toca; `Dashboard` hace su propio `cargarAdmin`/
`cargarTodos` explícito.

## Validado en vivo

Contra la base real, con las tres cuentas de prueba:
- **super_admin**: creó un negocio nuevo desde `Negocios.tsx` (quedó `por_verificar`), lo aprobó
  desde la cola (pasó a `activo`, `verificadoEn` seteado).
- **validador_contenido** (Rocío, San Borja): `ColaValidacion` mostró el negocio nuevo junto a los
  avisos pendientes de su distrito; `HistorialValidaciones` reflejó la aprobación al instante.
- **dueño de negocio** (María, `El Fogón Sanborjino`): login real, `MiNegocio.tsx` cargó su
  información real; guardó un cambio de horario (cerrar el sábado) y se confirmó persistido;
  agregó una oferta nueva y la eliminó, confirmando en vivo (no solo por curl) el fix del bug de
  índice jsonb; intento de editar un negocio ajeno devolvió `403`.

Se limpiaron todos los datos de prueba (negocio de prueba eliminado, horario/ofertas de María
revertidos) recreando la base desde cero (migraciones + semilla) al terminar.
