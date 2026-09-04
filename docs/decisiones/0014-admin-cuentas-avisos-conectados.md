# 0014 — `apps/admin`: Cuentas y Avisos conectados a la API real

## Contexto

Con `Login`/`useSesionAdmin` y `Usuarios`/`useUsuarios` ya reales ([0011](0011-recuperacion-de-clave.md)),
seguían pendientes las páginas más grandes del panel. Se priorizó `Cuentas` y todo el árbol de
`Avisos` (`Avisos.tsx`, `MisAvisos.tsx`, la mitad de avisos en `ColaValidacion.tsx`,
`HistorialValidaciones.tsx`) porque sus backends ya existían completos desde
[0007](0007-modulo-cuentas-auth.md) y [0008](0008-modulos-avisos-vecinos.md) — esto era wiring de
frontend, no diseño de contrato nuevo. `Negocios.tsx` queda para una próxima ronda: su backend
admin (crear/editar/aprobar negocio) todavía no existe.

## Decisiones

**`agregarNegocio`/`quitarNegocio` en `useCuentas` arman el array completo y llaman a
`actualizar`**, exactamente como se documentó de antemano en 0007 — no fue necesario inventar
nada nuevo al llegar a este punto, la decisión ya estaba tomada.

**Se agregó un endpoint que no existía: `GET /avisos/historial`.** `HistorialValidaciones.tsx`
necesitaba avisos ya resueltos (`publicado` o `rechazado`) acotados al alcance de distritos de la
cuenta — ninguno de los endpoints existentes (`/todos`, que es solo `super_admin`; `/pendientes`,
que es solo `pendiente`) cubría ese caso para un `validador_contenido`. Se construyó siguiendo
exactamente el mismo patrón que `/avisos/pendientes` (mismo `dentroDelAlcance`), solo cambia el
filtro de estado.

**El store `useAvisos` pasó de tener un único array poblado por mock a tener uno poblado por la
última llamada `cargarX()` que se haya hecho** (`cargarTodos`, `cargarPropios`, `cargarPendientes`,
`cargarHistorial`). Cada pantalla llama a la suya en un `useEffect` al montar. Es un cambio de
comportamiento respecto al mock (que exponía siempre la colección completa) pero es el diseño
correcto: cada pantalla ve solo lo que el backend decide que puede ver, no una copia local
filtrada de todo.

**`ColaValidacion.tsx` ya no filtra avisos por `estado === "pendiente"` ni por alcance en el
cliente** — el servidor ya se lo entrega filtrado (`GET /avisos/pendientes`). El lado de negocios
de esa misma pantalla conserva su filtro en el cliente porque `negocios` sigue siendo mock.

**Se corrigió un efecto colateral real**: `Negocios.tsx` lee `useCuentas().cuentas` para mostrar
quién administra cada negocio, pero nunca llamaba a `cargar()` — con el store ahora vacío por
defecto (en vez de precargado con mock), esa pantalla habría mostrado "sin dueño" para todo hasta
que alguien visitara `Cuentas.tsx` primero. Se agregó su propio `useEffect` con `cargar(token)`.

## Validado en vivo

Sesión completa con las tres cuentas de prueba reales:
- **super_admin**: `Cuentas` cargó las 10 cuentas reales; "Restablecer clave" generó un hash
  nuevo confirmado en la base; `Avisos` cargó los 7 avisos reales, publicar uno directo lo
  guardó de verdad (`estado='publicado'`, `validado_por_cuenta_id` = esta cuenta) y eliminarlo
  lo borró de la base.
- **validador_contenido** (Rocío, San Borja): `ColaValidacion` mostró exactamente 1 aviso
  pendiente (el de San Borja, no los de otros distritos); aprobarlo lo cambió a `publicado` en la
  base; `HistorialValidaciones` lo mostró de inmediato junto con el resto de su historial real
  acotado a San Borja.
- **junta_vecinal** (San Borja): `MisAvisos` reflejó en vivo el cambio de estado del aviso que
  Rocío acababa de aprobar; enviar un aviso nuevo a validación lo persistió como `pendiente` real.

Se limpiaron los datos de prueba y se recreó la base desde cero al terminar.
