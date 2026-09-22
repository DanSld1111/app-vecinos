-- El atributo "color" de cualquier categoría pasa de texto libre a un combo con paleta fija
-- (ver SelectorColorAtributo en el admin) — mismo `AtributoProductoDef.tipo`, ahora "color" en
-- vez de "texto". Los valores ya guardados en productos.atributos no se tocan: quedan como texto
-- libre hasta que alguien vuelva a editar ese producto y elija de la paleta.
UPDATE categorias
SET atributos_producto = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'clave' = 'color' THEN jsonb_set(elem, '{tipo}', '"color"')
         ELSE elem END
  )
  FROM jsonb_array_elements(atributos_producto) AS elem
)
WHERE atributos_producto @> '[{"clave": "color"}]';
