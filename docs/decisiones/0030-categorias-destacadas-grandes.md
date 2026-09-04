# 0030 — Dos categorías destacadas con tarjeta grande en Inicio

## Contexto

Después de la decisión 0029 (fotos en vez de ícono para todas las categorías), el usuario mostró
una captura de la app de delivery que inspiró todo esto y pidió reproducir su estructura: dos
categorías destacadas con foto grande arriba, y el resto en una fila chica debajo — no una sola
fila pareja de 14 tarjetas iguales.

## Decisión

Se agregó `TarjetaCategoriaDestacada.tsx` — una versión grande de `TarjetaCategoria` (foto de
fondo completa + degradado, igual patrón que las tarjetas de Servicios) con una insignia de
ícono flotante blanca arriba a la izquierda y el nombre abajo. `Comida` (`(tabs)/index.tsx`)
separa las categorías en dos grupos por slug: `SLUGS_DESTACADOS = ["restaurantes",
"supermercados"]` se renderizan en un `View` de 2 columnas arriba; el resto sigue en la misma
fila horizontal chica de siempre.

Se eligieron esas 2 por ser los rubros más usados de un directorio vecinal — mismo criterio que
la app de referencia usa "Restaurantes" y "Market" como sus 2 categorías fijas destacadas. Los
slugs quedan como una constante al inicio del archivo, fácil de cambiar el día que se decida
destacar otras 2 categorías (o una sola, o ninguna — el bloque no se renderiza si el filtro
devuelve una lista vacía).

## Validado en vivo

Confirmado en claro y oscuro: "Restaurantes" y "Supermercados" aparecen como las 2 tarjetas
grandes arriba con su foto, y tocarlas navega correctamente a la Guía de negocios ya filtrada por
esa categoría — mismo comportamiento que las tarjetas chicas de siempre.
