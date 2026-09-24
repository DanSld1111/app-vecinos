-- Cada categoría pasa a pertenecer a un servicio (servicios_app.slug) — antes las categorías
-- eran una lista suelta y cada pantalla de servicio en la app filtraba "a mano" por una
-- categoría fija en el código. Ver docs/decisiones/0072-servicio-dueno-de-categoria.md.

ALTER TABLE categorias ADD COLUMN servicio_slug TEXT REFERENCES servicios_app(slug);

-- Fusión "Comida" + "Restaurantes" en una sola categoría (confirmado con el usuario — eran casi
-- lo mismo y generaban confusión al dar de alta un negocio). Se reasignan sus negocios antes de
-- borrarla; ON CONFLICT porque un negocio podía tener ya las dos categorías a la vez.
INSERT INTO negocio_categorias (negocio_id, categoria_id)
SELECT negocio_id, 'cat-restaurantes' FROM negocio_categorias WHERE categoria_id = 'cat-comida'
ON CONFLICT DO NOTHING;
DELETE FROM negocio_categorias WHERE categoria_id = 'cat-comida';
DELETE FROM categorias WHERE id = 'cat-comida';

UPDATE categorias SET servicio_slug = CASE id
  WHEN 'cat-restaurantes'    THEN 'restaurantes'
  WHEN 'cat-supermercado'    THEN 'supermarket'
  WHEN 'cat-moda'            THEN 'market-space'
  WHEN 'cat-hogar'           THEN 'market-space'
  WHEN 'cat-emprendimientos' THEN 'market-space'
  WHEN 'cat-inmobiliaria'    THEN 'inmobiliaria'
  WHEN 'cat-turismo'         THEN 'turismo'
  WHEN 'cat-rescate-animal'  THEN 'rescate-animal'
  WHEN 'cat-consultorias'    THEN 'consultorias'
  WHEN 'cat-salud'           THEN 'consultorias'
  WHEN 'cat-servicios'       THEN 'otros'
  WHEN 'cat-otros-servicios' THEN 'otros'
  -- "Mascotas" no tiene un servicio claro todavía (Rescate animal es rescate, no tienda/veterinaria) —
  -- queda en "Otros servicios" como default movible desde el panel, no una decisión final.
  WHEN 'cat-mascotas'        THEN 'otros'
END
WHERE id IN (
  'cat-restaurantes','cat-supermercado','cat-moda','cat-hogar','cat-emprendimientos',
  'cat-inmobiliaria','cat-turismo','cat-rescate-animal','cat-consultorias','cat-salud',
  'cat-servicios','cat-otros-servicios','cat-mascotas'
);
