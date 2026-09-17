# 0062 — Fix real del "difuminado" arriba: era el modo translúcido del status bar

## Contexto

Después de [0061](0061-safe-area-top-pantallas.md) (safe-area) y un primer intento fallido
(subir el contraste del texto "BUENAS TARDES"), el usuario seguía reportando que la parte de
arriba se veía "difuminada". El ajuste de contraste no era la causa real.

## Causa real

`apple-mobile-web-app-status-bar-style: black-translucent` (puesto en
[decisión 0055](0055-pwa-instalable-y-animaciones.md) para lograr una sensación más "a pantalla
completa") hace que iOS dibuje la barra de estado (hora, señal, batería) como un **vidrio
esmerilado semitransparente** sobre el contenido de la página — es un efecto de difuminado real,
intencional de Apple, para que la hora/batería sigan siendo legibles sin importar qué haya
debajo. Eso es exactamente lo que el usuario venía describiendo como "difuminado": no era el
contraste del texto, era el propio tratamiento visual de la barra de estado transparente
bleeding sobre el saludo, que quedaba justo debajo.

## Solución

Cambiado a `apple-mobile-web-app-status-bar-style: default` — barra de estado sólida (blanca,
con íconos oscuros), sin efecto de translucidez. Se pierde el look "todo el mismo color de
fondo" que se buscaba en 0055, a cambio de una zona de arriba predecible y sin artefactos.

## Trade-off conocido, sin resolver

Con `default`, la barra de estado siempre es blanca sólida — en la pantalla de login (fondo
verde a pantalla completa, ver `FlujoLogin.tsx`), eso crea un borde blanco visible en vez de
fundirse con el verde. No hay forma de cambiar el estilo de la barra de estado dinámicamente
por pantalla en un PWA (a diferencia de una app nativa real) — es una limitación conocida de
esta tecnología, no un bug. Se prioriza que Inicio (la pantalla que más se usa) se vea bien.
