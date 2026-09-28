# 0078 — Panel admin con el diseño "Vitrina"

**Fecha:** 2026-09-28 · **Estado:** en producción

Bocetos de los 27 módulos: https://claude.ai/artifact/56D4NXtHLM1TyCE7GNvgVK

## Qué se hizo

- Misma dirección que la app de vecinos (ver 0077): Schibsted Grotesk como única fuente, neutros
  grises, verde de marca solo para la acción principal.
- `src/index.css`: tokens nuevos en `:root` y una "capa Vitrina" al final que ajusta las piezas
  más usadas (menú lateral, encabezados, botones, paneles y tarjetas sin sombra, tablas, campos,
  modales) sin reescribir las 3.300 líneas de reglas existentes.
- Menú lateral claro, agrupado por tema (General, Territorio, Catálogo, Negocios, Comunicación,
  Validación, Personas) con íconos de línea de `react-icons/lu`.
- Login con foto de la comunidad y **sin el bloque de cuentas de prueba**: mostraba en producción
  correos y contraseñas de prueba. "Todo tu barrio" pasa a "Todo lo de tu comunidad".
- Se quitaron los emojis que decoraban textos ("📦 Archivar", "✓ Aprobar"…).

## Pendiente

- Los emojis que hacen de ícono dentro de un círculo (alertas, pasos de estado, íconos de
  servicios) siguen; hay que reemplazarlos uno a uno por íconos de línea.
- Las vistas previas con el celular de la app nueva (avisos, novedades, anuncios, ficha) de los
  bocetos todavía no están en código.
- Las cuentas de prueba deben cambiar de contraseña o desactivarse en la base de datos.
