-- Las tarjetas de categoría de Inicio pasan de ícono de líneas a foto — ver
-- docs/decisiones/0029-categorias-con-foto.md.
ALTER TABLE categorias ADD COLUMN foto_url TEXT;
