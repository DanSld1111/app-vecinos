# 0031 — Espacio entre tarjetas en los carruseles de Inicio

## Contexto

El usuario reportó (con captura) que las tarjetas de "Aviso de la comunidad" se ven pegadas una
con otra al pasar de una a la siguiente — sin ningún espacio de por medio.

## Decisión

`CarruselAvisos.tsx` y `CarruselPublicidad.tsx` (mismo patrón en los dos: `FlashList` horizontal
con `pagingEnabled`, cada tarjeta del ancho completo de la pantalla) no dejaban ningún margen
entre una tarjeta y la siguiente — al desplazarse, la tarjeta que entra queda pegada al borde de
la que sale.

Se angostó cada tarjeta en 8px (`espaciado.sm`) y se le agregó `marginRight: 8` — el espacio
"robado" al ancho de la tarjeta es el que separa una de la siguiente. Como `pagingEnabled` snapea
al ancho exacto de la vista y ya no coincide con el nuevo ancho (tarjeta + margen), se reemplazó
por `snapToInterval={ancho de tarjeta + espacio}` y `decelerationRate="fast"` — mismo efecto de
"trabar" en cada tarjeta al soltar el dedo, pero respetando el espacio agregado. El cálculo de
qué tarjeta está activa (`onScroll`) se ajustó para dividir por ese mismo intervalo en vez del
ancho de tarjeta solo.

## Validado en vivo

Confirmado por consola (no visualmente, dado que reproducir un swipe a medio camino requiere un
gesto táctil real): la tarjeta verde de "Aviso de la comunidad" y la tarjeta de anuncios de
Inicio tienen `margin-right: 8px` aplicado en el navegador — el mismo patrón para ambos
carruseles.
