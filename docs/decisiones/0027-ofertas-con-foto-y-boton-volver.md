# 0027 — Fotos en las tarjetas de ofertas y botón de volver más confiable

## Contexto

El usuario reportó dos problemas puntuales con capturas de su celular:

1. Las tarjetas de "Ofertas de la semana" (en la ficha de un negocio) y "Ofertas de tus negocios
   de siempre" (en el buscador) mostraban un ícono de etiqueta genérico en vez de una foto.
2. Al entrar a "Guía de negocios" desde Servicios, el header no mostraba ninguna flecha para
   volver — solo el título, sin forma visible de regresar.

## Decisión

**1. Fotos en las tarjetas de oferta**: el modelo de datos no tiene una foto por oferta (serían
demasiadas fotos para mantener por poco valor) — la solución fue reusar la foto principal del
negocio dueño de la oferta, que ya existe. Se agregó `negocioFotoUrl` a `OfertaConNegocio`
(`apps/movil/src/utilidades/ofertas.ts`, tomado de `negocio.fotoPrincipalUrl`) y se usa en los dos
lugares que muestran ofertas: `OfertasPasillosNegocio.tsx` (ficha de negocio) y `buscar.tsx`
("Ofertas de tus negocios de siempre") — si el negocio no tiene foto, cae al mismo ícono de
etiqueta que ya existía, no se rompe nada.

**2. Botón de volver poco confiable**: el stack de navegación de `servicios/negocios` (y
`productos`/`restaurantes`/`supermarket`) dependía del botón "atrás" nativo por defecto de
React Navigation. La pantalla anterior en esa navegación (el índice de Servicios) tiene
`headerShown: false` — no tiene título del que el header nativo pueda heredar el texto del botón
de volver, y en algunos builds de iOS eso deja el header sin flecha visible aunque siga siendo
tocable en el lugar correcto (un bug conocido de React Navigation con native-stack en ese
escenario específico). Se reemplazó por un botón de volver explícito (`headerLeft` con
`Ionicons name="chevron-back"` + `router.back()`) en `servicios/_layout.tsx` — el mismo patrón que
ya usaban `buscar.tsx` y `cuenta/index.tsx` en otras partes de la app, solo que ahí sí estaba
aplicado.

Se aplicó el mismo refuerzo, por el mismo motivo, en la ficha de negocio
(`app/_layout.tsx`, pantalla `negocio/[id]`) — mismo escenario exacto (pantalla anterior sin
header). **Se revisó también** `notificaciones/_layout.tsx`, que ya tenía su propio header con
back button — ahí solo se agregó el mismo `headerLeft` explícito por consistencia y para
descartar el mismo riesgo, sin tocar nada más (al principio se agregó por error un segundo header
en `app/_layout.tsx` encima del que ya existía — se detectó al probar y se revirtió).

## Validado en vivo

Confirmado en el navegador: la tarjeta "Ofertas de la semana" de Supermercado San Borja y las
tarjetas de "Ofertas de tus negocios de siempre" en el buscador ahora muestran la foto real del
negocio. El botón de volver de "Guía de negocios" ahora es una flecha visible y consistente, y
lleva de vuelta a Servicios correctamente. Notificaciones se probó por separado — su header
quedó con una sola flecha (no doble) y sigue funcionando igual que antes.

## Pendiente relacionado, no resuelto ahora

`GaleriaNegocio.tsx` (la sección "Fotos del negocio" que aparece cuando un negocio no tiene menú
ni catálogo) sigue mostrando 4 recuadros de ícono genérico, con el texto "Fotos de ejemplo — el
negocio podrá subir las suyas propias" — a propósito, porque el modelo de datos solo guarda una
foto por negocio (`fotoPrincipalUrl`), no una galería de varias. Agregarle fotos reales requeriría
un campo nuevo (array de fotos) y su propia pantalla de carga en el panel admin — no se hizo en
esta ronda por ser una funcionalidad nueva, no un espacio "vacío" con solución directa.
