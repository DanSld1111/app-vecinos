-- 0031 — Aviso en la ficha de los negocios de una categoría (decisión 0088): "+18" en Licorerías,
-- "Receta" en Veterinarias, o uno informativo. { "tipo": "mayores18" | "receta" | "info", "texto": "…" }.
-- NULL = sin aviso. Los campos de producto ganan "filtro" e "insignia" dentro de atributos_producto
-- (JSONB), sin columna nueva.
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS aviso_ficha JSONB;
