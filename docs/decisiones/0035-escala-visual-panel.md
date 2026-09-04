# 0035 — El panel admin se ve chico en pantallas grandes

## Contexto

El usuario probó el panel en su propio monitor (una ventana de ~1900px) y reportó que "se ve muy
pequeño, muy chico" — el Dashboard entero (números, íconos, tarjetas) usa una tipografía muy
compacta (11-13px, pensada originalmente para caber cómodo en pantallas chicas) que, en un
monitor grande, deja mucho espacio en blanco sin aprovechar y se ve poco profesional.

## Intento descartado: `zoom` en CSS

El primer intento fue el más simple: `body { zoom: 1.15 }`, para escalar todo el documento de
una sola vez, como el zoom nativo del navegador. Se descartó porque **no convive bien con un
layout de altura fija** — `.app-shell`/`.sidebar` usan `height: 100vh` para fijar el panel a la
altura de la pantalla con scroll interno en el contenido. `100vh` sigue midiendo el viewport
real (sin escalar) mientras el resto del documento sí se agranda, así que la caja termina más
alta que la pantalla — apareció un scroll doblado y el layout se veía roto (confirmado en vivo:
el sidebar y el contenido dejaban de coincidir en alto, con una franja oscura de más).

## Decisión: escalar los valores reales del CSS, no el render

En vez de un truco de render, se escalaron ×1.15 los propios valores de `apps/admin/src/index.css`
— `font-size`, `padding`, `margin`, `gap`, `width`/`height` (y sus `min-`/`max-`), `top/left/
right/bottom` y `border-radius` — con un script puntual (no forma parte del repo, se corrió una
vez). Deliberadamente **no** se tocó:

- `border`/`border-width` (los hairlines de 1-1.5px se quedan nítidos, no se agrandan a medio
  píxel).
- `box-shadow` (el desenfoque/offset de las sombras se queda igual).
- Los breakpoints de `@media` (`760px`, `1024px`, `640px`) — son sobre el ancho real del
  dispositivo, no densidad visual.
- `letter-spacing` en `em` (ya es relativo, no hacía falta).

El resultado escala genuinamente el layout (cada caja mide un 15% más en su propio cálculo),
así que no depende de ningún truco de render y no tiene el problema de `100vh` de arriba.

Las pantallas de "Olvidé mi contraseña" / "Restablecer contraseña" en `Login.tsx` usan estilos
inline (no clases CSS) para varios `fontSize`/`marginBottom` — se ajustaron a mano con el mismo
factor para que no quedaran chicas al lado del resto del panel, ya escalado vía CSS.

## Validado en vivo

Dashboard, Avisos, Arquetipos y el login, probados a 1280px de ancho — texto, íconos, tarjetas y
badges notablemente más grandes que antes, sin overflow ni recortes, con las sombras y bordes
finos intactos.
