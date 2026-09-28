-- Fichas: una sola capa en vez de Plantillas + Arquetipos (ver docs/decisiones/0080-fichas.md).
-- Cada servicio tiene una ficha por defecto; cada categoría la hereda (ficha NULL) o elige otra.
-- Solo agrega columnas: arquetipo_ficha, arquetipo_id y la tabla arquetipos quedan sin uso,
-- se pueden borrar en una migración posterior cuando nada las lea.

ALTER TABLE servicios_app
  ADD COLUMN IF NOT EXISTS ficha text
    CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria'));

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS ficha text
    CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria')),
  ADD COLUMN IF NOT EXISTS titulo_seccion text;

-- Ficha por defecto de cada servicio que es un directorio de negocios.
UPDATE servicios_app SET ficha = 'menu'      WHERE slug = 'restaurantes'   AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'ofertas'   WHERE slug = 'supermarket'    AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'catalogo'  WHERE slug = 'market-space'   AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'servicios' WHERE slug = 'consultorias'   AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'servicios' WHERE slug = 'otros'          AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'servicios' WHERE slug = 'rescate-animal' AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'catalogo'  WHERE slug = 'turismo'        AND ficha IS NULL;
UPDATE servicios_app SET ficha = 'catalogo'  WHERE slug = 'inmobiliaria'   AND ficha IS NULL;

-- Cada categoría conserva la ficha que ve hoy el vecino (arquetipo_ficha; sin valor = galería).
-- Solo se guarda como propia cuando no coincide con la de su servicio; si coincide, hereda.
UPDATE categorias c
SET ficha = actual.ficha
FROM (
  SELECT cat.id,
         CASE cat.arquetipo_ficha::text WHEN 'categorias' THEN 'rubros' ELSE COALESCE(cat.arquetipo_ficha::text, 'galeria') END AS ficha,
         s.ficha AS ficha_servicio
  FROM categorias cat
  LEFT JOIN servicios_app s ON s.slug = cat.servicio_slug
) actual
WHERE c.id = actual.id
  AND c.ficha IS NULL
  AND actual.ficha IS DISTINCT FROM actual.ficha_servicio;
