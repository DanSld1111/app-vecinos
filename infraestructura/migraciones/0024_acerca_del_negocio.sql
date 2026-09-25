-- Texto libre que escribe el propio dueño desde el panel — se muestra en la pantalla
-- "Información del negocio" de la app. Null mientras el dueño no lo complete (no se inventa
-- un texto por defecto). Ver docs/decisiones/0075-ficha-info-y-favoritos.md.

ALTER TABLE negocios ADD COLUMN acerca_del_negocio text;
