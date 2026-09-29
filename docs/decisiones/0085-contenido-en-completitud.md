# 0085 — "Contenido de su ficha" como sexta parte de una ficha completa

## Contexto

La completitud de un negocio (decisión 0084) contaba 5 partes y dejaba fuera los productos a
propósito: no todos los negocios tienen carta. Con las Fichas (0080) cada categoría ya dice qué
contenido muestra, así que se puede pedir el contenido correcto a cada negocio.

## Decisión

- Sexta parte, según la ficha efectiva de su categoría: productos (Menú y Catálogo), servicios con
  tarifa (Servicios y tarifas), rubros (Rubros), ofertas o pasillos (Ofertas y pasillos), fotos de
  la galería (Galería). El chip y el botón llevan a la pestaña donde se carga.
- La API devuelve `totalProductos` (productos visibles, sin la papelera) en cada negocio.
- Si todavía no se sabe (categorías sin cargar, negocio sin categoría o servidor sin el dato), esa
  parte no se cuenta: se prefiere no avisar a avisar mal.
