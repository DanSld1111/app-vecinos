# 0016 — Panel de administración responsive (móvil, tablet, escritorio)

## Contexto

`apps/admin` (el panel que usan las cuatro cuentas: super-admin, dueño de negocio,
junta vecinal y validador de contenido) se construyó pensando solo en escritorio: la
barra lateral era fija de 220px y ninguna regla de CSS tenía media queries. En un
teléfono o tablet la barra lateral se comía media pantalla y varias grillas de
columnas fijas (resúmenes, filas de listas, tablas) se aplastaban o se cortaban.
El usuario pidió resolver esto antes de seguir con cualquier otra funcionalidad.

## Decisiones

**Un solo breakpoint para "compacto" (≤1024px), no uno separado por dispositivo.**
Tablet en vertical y teléfonos comparten el mismo patrón de barra lateral deslizable
(drawer) con botón de menú — es el patrón estándar de paneles admin (Gmail, la
mayoría de dashboards). Por encima de 1024px la barra lateral vuelve a estar
siempre visible, fija, como antes. Dentro de ese breakpoint compacto, un segundo
umbral en 640px ajusta detalles que solo importan en pantallas muy angostas (filas
de lista que se apilan en dos líneas, grillas de tarjetas a una columna).

**`LayoutAdmin.tsx` gana una topbar móvil con botón de menú** (`useState` local
`menuAbierto`), un overlay semitransparente que cierra el panel al tocar fuera, y
un `useEffect` sobre `useLocation().pathname` que cierra el menú automáticamente
al navegar — sin esto, el panel se quedaba abierto tapando la pantalla después de
elegir una opción.

**Bug encontrado en el primer intento**: la topbar móvil se agregó como hijo
directo de `.app-shell`, que seguía en `display: flex` (fila) incluso en modo
compacto — el resultado era una barra vertical angosta de toda la altura de la
pantalla en vez de una franja horizontal arriba, porque un elemento flex sin ancho
explícito, dentro de un contenedor con `align-items: stretch` por defecto, se
estira a la altura completa de sus hermanos. Se corrigió agregando
`.app-shell { display: block; }` dentro del breakpoint ≤1024px — la barra lateral
ya no participa del layout de todos modos porque pasa a `position: fixed`.

**Grillas de columnas fijas → `repeat(auto-fit, minmax(...))`.** En vez de agregar
una media query por cada grilla (resumen de métricas, tarjetas de plantillas,
tarjetas de arquetipos, selector de arquetipo en el modal), se cambió la regla base
de `repeat(N, 1fr)` a `repeat(auto-fit, minmax(Xpx, 1fr))` — el navegador decide
cuántas columnas caben en cualquier ancho, sin código adicional ni breakpoints que
mantener. Se dejaron intactas las grillas que son maquetas fijas de la app móvil
dentro de una vista previa (`.mr-tabla-planes`, `.mr-grid2` en `Plantillas`) porque
esas simulan una pantalla de teléfono a tamaño fijo — no son parte del layout
propio del panel.

**Paneles de "contenido + columna lateral fija"** (`.cuerpo-grid` del Dashboard,
`.layout-cola` de la cola de validación, `.layout-publicidad`, `.layout-novedades`,
`.layout-editor` de los editores) no admiten el truco de `auto-fit` porque una de
las dos columnas es una referencia visual de ancho fijo (260–340px) — se apilan
explícitamente a una columna dentro del breakpoint ≤1024px.

**Modales, drawer y tarjeta de login usan `width: min(Xpx, Yvw)`** en vez de un
ancho fijo en píxeles, para no desbordar en un teléfono angosto (a 375px de ancho,
380px fijos ya desbordaban). El drawer de detalle usa `min(380px, 100vw)`, así en
un teléfono se convierte en una hoja de pantalla completa — un patrón de UX más
natural en móvil que un panel lateral angosto.

**Filas de lista** (negocios, cuentas, avisos, historial, cola de validación) se
dejan envolver (`flex-wrap: wrap`) solo en el breakpoint ≤640px, con la columna de
información pasando a `flex-basis: 100%` para que quede en su propia línea y los
chips/acciones en la siguiente — así nada se corta a la mitad ni fuerza scroll
lateral en toda la página.

**Tablas HTML reales** (el ranking de distritos en el Dashboard) no se convierten
en tarjetas — eso hubiera exigido rehacer el componente. En su lugar, el panel que
las contiene gana `overflow-x: auto` y la tabla un `min-width` para conservar sus
columnas legibles; en un teléfono se lee completa deslizando el dedo, con
suficiente contexto (el borde del panel deja ver que hay más contenido) para que no
parezca simplemente cortada.

## Validado en vivo

Contra la app real corriendo (`apps/api` + `apps/admin`), con las cuatro cuentas de
prueba y tres tamaños de viewport (375px móvil, 820px tablet, 1280px escritorio):

- **Verificación por medición, no solo visual**: se recorrieron programáticamente
  las 13 rutas de super-admin, las 6 de dueño de negocio, la de junta vecinal y las
  2 de validador — las 22 combinaciones dieron `document.documentElement.scrollWidth
  === clientWidth` (cero desborde horizontal) a 375px.
- Confirmado con capturas de pantalla: Dashboard, Negocios y el drawer de detalle
  de un negocio se ven completos y legibles a 375px, sin recortes.
- El botón de menú y el panel deslizable funcionan a 375px y 820px (clase
  `.sidebar.abierto` se activa/desactiva correctamente) y desaparecen a partir de
  1024px, donde la barra lateral vuelve a estar siempre visible y fija
  (`position: static`).
- El modal "Nuevo negocio" y el drawer de detalle de un negocio se ajustan al
  ancho del teléfono (`min()` en acción) sin desbordar la página.

No se generó ningún dato de prueba durante esta verificación (solo lecturas y
navegación); no hizo falta limpiar ni resetear la base de datos al terminar.
