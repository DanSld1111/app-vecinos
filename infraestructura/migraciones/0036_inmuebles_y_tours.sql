-- 0036 — Fichas «Inmuebles» y «Tours» (decisión 0096).
--
-- * productos.fotos: fotos extra del producto (la portada sigue siendo foto_url). Hasta 9.
-- * productos.detalle: datos con estructura que no caben en un campo de la categoría. Hoy solo lo
--   usa la ficha Tours: { salidas: [{fecha, hora, cupos}], itinerario: [{hora, titulo, detalle}],
--   incluye: [], noIncluye: [], puntoEncuentro, cancelacion }.
-- * Las fichas nuevas se agregan a las restricciones de servicios_app y categorias.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fotos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS detalle JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE servicios_app DROP CONSTRAINT IF EXISTS servicios_app_ficha_check;
ALTER TABLE servicios_app ADD CONSTRAINT servicios_app_ficha_check
  CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria', 'inmuebles', 'tours'));
ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_ficha_check;
ALTER TABLE categorias ADD CONSTRAINT categorias_ficha_check
  CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria', 'inmuebles', 'tours'));
