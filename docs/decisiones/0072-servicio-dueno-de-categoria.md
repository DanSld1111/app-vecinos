# 0072 — Cada servicio es dueño de sus categorías

## Contexto

Antes, `categorias` era una lista plana sin relación con `servicios_app` (las tarjetas de la
pantalla "Servicios"). Cada pantalla de servicio en la app móvil (Restaurantes, Supermarket,
Market Space) filtraba los negocios "a mano", con una categoría fija escrita en el código
(`categoriaIdFija="cat-restaurantes"`). Esto generaba dos problemas:

- Un negocio con categoría "Restaurantes" aparecía dos veces en la navegación: dentro de "Guía
  de negocios" (el catálogo general, sin filtro) y en la tarjeta dedicada "Restaurantes" — sin
  que nada en la pantalla explicara que eran la misma data vista desde dos puertas.
- Activar un servicio nuevo desde el panel, o cambiarle qué categorías muestra, requería tocar
  código y desplegar — no era autoservicio.
- Existían dos categorías casi idénticas ("Comida" y "Restaurantes"), sin criterio claro de
  cuándo usar una u otra al dar de alta un negocio.

## Decisión

- `categorias.servicio_slug` (FK a `servicios_app.slug`) — cada categoría pertenece a un
  servicio. Los servicios que no son directorios de negocio (Bolsa de empleo, Bolsa de puntos,
  Taxi) se quedan sin categorías.
- Se fusionó "Comida" en "Restaurantes" (migración 0021): mismos negocios, una sola categoría.
- "Guía de negocios" deja de ser un servicio con categoría propia — pasa a ser el buscador
  general, sin filtro fijo, que junta los negocios de todos los servicios.
- Alta y edición de negocio en el panel: se elige primero el Servicio, y la Categoría queda
  limitada a las suyas (`SelectorServicioYCategoria`) — ya no una lista plana de 13 categorías.
- App móvil: cada pantalla de servicio filtra por `servicioSlug` (`GET /negocios?servicioSlug=`)
  en vez de una categoría fija — activar un servicio nuevo o cambiar sus categorías ya no
  requiere tocar código, solo el campo "Servicio" en Categorías (admin).

## Categorías sin dueño claro

"Mascotas" quedó en "Otros servicios" por defecto — no hay hoy un servicio de tipo
tienda/veterinaria (el que existe, "Rescate animal", es específicamente sobre rescate). Es una
asignación movible desde el panel, no una decisión cerrada.
