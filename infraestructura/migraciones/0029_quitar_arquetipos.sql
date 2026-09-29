-- Quita lo que dejó sin uso la decisión 0080 (Fichas): la tabla de arquetipos, la de plantillas
-- visuales y las dos columnas viejas de categorías. La ficha ahora vive en servicios_app.ficha y
-- categorias.ficha (migración 0028). Nada de la API ni de las apps lee lo que se borra aquí.
-- Sin CASCADE a propósito: si algo nuevo dependiera de esto, la migración falla en vez de
-- llevárselo por delante.

ALTER TABLE categorias
  DROP COLUMN IF EXISTS arquetipo_id,
  DROP COLUMN IF EXISTS arquetipo_ficha;

DROP TABLE IF EXISTS arquetipos;
DROP TABLE IF EXISTS plantillas_visuales;

DROP TYPE IF EXISTS arquetipo_ficha;
DROP TYPE IF EXISTS origen_arquetipo;
DROP TYPE IF EXISTS modo_plantilla;
DROP TYPE IF EXISTS origen_plantilla;
