# 0022 — Revisión de diseño: modo oscuro real, avatares consistentes, pills unificados

## Contexto

Revisión visual libre de `apps/movil` (recorriendo cada pantalla en el navegador) y de
`apps/admin`, pedida explícitamente para encontrar oportunidades de pulido de diseño más allá
de lo ya reportado. Salieron 6 puntos concretos; se implementaron los 6.

## Decisiones

### 1 y 4. Un solo patrón para "este negocio no tiene foto todavía" en espacios pequeños

Antes convivían tres soluciones distintas al mismo problema: un cuadro verde pálido vacío
(Inicio, fichas), un ícono genérico en el panel admin, y ya existía un buen patrón —avatares
con iniciales y color— pero solo en el buscador. Se extrajo ese patrón a un componente
compartido, `AvatarNegocio` (`apps/movil/src/componentes/AvatarNegocio.tsx`), y se aplicó en
`TarjetaNegocio`, `RielMiniNegocios` y el propio buscador. De paso se corrigió un bug real en el
buscador: el color del avatar dependía de la posición en la lista (`i % COLORES_AVATAR.length`),
así que el mismo negocio podía verse con un color distinto según en qué lista apareciera. Ahora
el color sale de un hash del nombre — estable, siempre el mismo negocio, mismo color, en
cualquier pantalla.

### 3. Espacios grandes sin foto: un ícono, no un bloque vacío

Para las fotos principales grandes (la ficha completa de un negocio, "El más visitado esta
semana"), un avatar de iniciales gigante se vería raro — se creó `SinFoto`
(`apps/movil/src/componentes/SinFoto.tsx`): un ícono pequeño centrado sobre una superficie
hundida, replicando el patrón que ya existía (y funcionaba bien) en `GaleriaNegocio`. Se aplicó
también a los ítems del menú y a las tarjetas de oferta.

**Bug real encontrado en el camino**: la foto principal de la ficha de un negocio
(`app/negocio/[id].tsx`) nunca se había conectado — cuando `fotoPrincipalUrl` sí existía, el
código dibujaba un `<View>` vacío sin ninguna imagen dentro. La función de subida de fotos
(decisión 0021) quedaba huérfana: la foto se subía, pero la ficha nunca la mostraba. Corregido
con un `<Image>` real.

### 2. Etiquetas de categoría cortadas en Inicio

`TarjetaCategoria` limitaba el nombre a `numberOfLines={1}` — nombres largos como
"Emprendimientos" o "Rescate animal" se cortaban con "...". Se cambió a 2 líneas con
`lineHeight` ajustado.

### 5. Modo oscuro real (antes: interruptor decorativo marcado "Próximamente")

Se construyó una base de theming completa para `apps/movil`:
- `PaletaColores` (interfaz) + `paletaClara`/`paletaOscura` en `src/disenio/colores.ts` — la
  paleta oscura no es "invertir" la clara: cada tono se ajustó a mano para mantener contraste
  legible (ej. `primarioFuerte`, usado como color de texto/ícono sobre fondo claro, pasa a un
  verde menta claro en vez de un verde oscuro que sería ilegible sobre un fondo casi negro).
- `useTema` (`src/estado/useTema.ts`) — store con el modo activo (`claro`/`oscuro`), en memoria
  de esta sesión, igual que el resto del estado de `apps/movil` (no existe todavía una capa de
  almacenamiento persistente).
- `useColores()` (`src/disenio/useColores.ts`) — hook que devuelve la paleta activa.

Se convirtieron las ~50 pantallas y componentes de `apps/movil` que pintan color: cada uno pasó
de `StyleSheet.create({...})` a nivel de módulo (estático, fijado para siempre en el momento en
que el archivo se carga) a una función `crearEstilos(colores)` invocada dentro del componente
con la paleta activa — el único cambio real y necesario para que el modo oscuro pudiera
funcionar de verdad (no hay atajo: un estilo fijado al cargar el módulo nunca puede reaccionar a
un cambio de tema después). El interruptor "Modo oscuro" en Mi perfil pasó de estar deshabilitado
y marcado "Próximamente" a estar conectado de verdad a `useTema`.

De paso, dos detalles que solo se notan en modo oscuro y que antes no existían: la barra de
estado del sistema operativo cambia de `dark` a `light` según el tema (para que sus íconos
sigan siendo visibles), y se corrigió un error de tipos preexistente y no relacionado en
`HojaInferior.tsx` (`StyleSheet.absoluteFillObject` no existe en las definiciones de tipos de
este proyecto) aprovechando que ya se estaba reescribiendo ese archivo.

### 6. Pills de estado con formato inconsistente en `apps/admin`

Existían cuatro clases CSS distintas para "pill de estado con color" (`.pill` + modificadores,
`.pill-pendiente`, `.badge-estado-mini`, `.estado-negocio-pill`), cada una con su propia
combinación de tamaño de fuente, relleno y mayúsculas — por eso el Dashboard mostraba "Por
verificar" y la lista de Negocios mostraba "POR VERIFICAR" para el mismo estado. Se unificaron
las cuatro al mismo modelo de caja (`padding: 3px 9px`, `font-size: 10px`, mayúsculas con
`letter-spacing`), con cuidado de NO aplicar mayúsculas a los pills que muestran nombres propios
(`.pill-azul`, `.pill-distrito`, usados para chips de distrito/comunidad) — esos no son pills de
estado, uppercasearlos habría sido un error nuevo, no una corrección.

## Validado en vivo

- **Backend**: `npx tsc --noEmit` en `apps/movil` — limpio, 0 errores (incluyendo el error
  preexistente que se corrigió de paso).
- **Modo oscuro**: activado desde Mi perfil y recorridas Inicio, Servicios, Comunidad, la ficha
  de un negocio y el buscador — paleta oscura aplicada de punta a punta, colores de marca
  (verde/coral) siguen siendo reconocibles, avatares de iniciales siguen siendo legibles sobre
  fondo oscuro, mapa/horario/menú se leen bien.
- **Avatares consistentes**: confirmado visualmente que "Negocios más visitados" (Inicio),
  "Negocios cerca de ti" y el buscador muestran el mismo negocio con el mismo color en las tres
  pantallas.
- **Ficha de negocio**: confirmado que el ícono de "sin foto" reemplaza al bloque vacío, y que
  (una vez subida una foto real, ver decisión 0021) esta si se muestra.
- **Panel admin**: confirmado en el navegador que el Dashboard y la lista de Negocios ya
  muestran el mismo formato de pill ("POR VERIFICAR" / "ACTIVO" en ambos), y que los chips de
  distrito/comunidad (nombres propios) no quedaron mayusculizados por error.

Un hallazgo aparte, no un bug de este trabajo: durante la verificación aparecieron brevemente
errores de consola (`crearEstilos is not defined`, etc.) que resultaron ser artefactos
transitorios del Fast Refresh de Metro mientras se editaban decenas de archivos con el servidor
corriendo en vivo — un reinicio limpio del servidor y una recarga real del navegador (probado
dos veces, en claro y en oscuro) confirmaron que no eran un bug del código final.
