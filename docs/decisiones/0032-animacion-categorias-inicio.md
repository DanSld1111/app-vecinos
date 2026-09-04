# 0032 — Pulso animado en las fotos de categoría de Inicio

## Contexto

El usuario mostró de nuevo el boceto animado que se le presentó antes de construir todo esto
(0029/0030) y pidió aplicar ese mismo tipo de animación a la app real — en el boceto, los íconos
de categoría "parpadeaban" alternando contenido, dando sensación de vida a la pantalla.

## Decisión

Como las categorías ya muestran una foto real (no dos íconos entre los que alternar), se adaptó
la idea a un pulso de escala sutil (1 → 1.08 → 1) en bucle, con una pausa entre cada pulso —
`useAnimacionLatido.ts`, mismo patrón que ya usaba `usePulso` (esqueleto de carga): `Animated.loop`
+ `Animated.sequence` con `useNativeDriver: true`. Se aplicó solo a la fila chica de categorías
(`TarjetaCategoria.tsx`), no a las 2 tarjetas grandes destacadas — mantenerlas quietas evita que
la pantalla se sienta sobrecargada de movimiento.

Cada tarjeta arranca su pulso con un retraso distinto (`indice * 220ms`) para que no respiren
todas sincronizadas — se ve más orgánico. El carrusel de promociones ya rotaba solo desde antes
(decisión 0028), así que esa parte del boceto ya estaba cubierta.

## Validado en vivo

Confirmado por consola: el contenedor de la foto de "Comida" pasa por `scale(1.077)` →
`scale(1.039)` → `scale(1.003)` → `scale(1)` a lo largo de ~1.8 segundos, coincidiendo con la
animación programada.
