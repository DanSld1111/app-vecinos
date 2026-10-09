# 0089 — Activar Turismo, Inmobiliaria y Rescate animal

## Contexto

Los tres servicios estaban "próximamente". La app solo tenía pantalla para Guía de negocios,
Restaurantes, Market Space y Supermarket (`RUTA_POR_SLUG`): un servicio activado sin pantalla no
llevaba a ningún lado. El usuario aprobó la vista previa (2026-10-09) y pidió "/mes" en alquileres.

## Decisión

- **Pantalla genérica de servicio** (`app/(tabs)/servicios/[slug].tsx`): el mismo listado
  (`GuiaListado`) acotado al servicio, con bajada y buscador por servicio. Activar otro servicio en
  el futuro ya no necesita una pantalla nueva.
- **Datos**: los tres pasan a `disponible`, con foto de portada (Unsplash, licencia libre).
  - Turismo (ficha Catálogo): campos Duración y Salida.
  - Inmobiliaria (ficha Catálogo): Operación (Alquiler/Venta, filtro, "/mes" en Alquiler),
    Dormitorios y Área.
  - Rescate animal (ficha Servicios y tarifas): sin campos.
- **Texto detrás del precio** (`AtributoProductoDef.sufijoPrecio`): un campo de opciones puede decir
  "si el producto es X, el precio lleva este texto" (Alquiler → "$ 950 /mes"). Se configura en
  Categorías; el celular de vista previa lo muestra.
- **Precios**: separador de miles en toda la app y el panel ("S/ 1,290", "$ 189,000"). Un servicio
  con precio 0 se muestra "Gratis".
- **Listado**: "1 negocio" en singular, y sin el filtro de categorías cuando el servicio tiene una
  sola (era "Todos | Turismo").
