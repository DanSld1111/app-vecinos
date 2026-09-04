-- Dos columnas de foto que faltaban, encontradas en la revisión de diseño de la app:
-- ver docs/decisiones/0028-fotos-productos-galeria-y-publicidad.md.

-- 1) Foto por producto (plato de un menú, o artículo de un catálogo tipo Market Space) —
-- antes cada ítem mostraba un ícono genérico sin importar cuál fuera.
ALTER TABLE productos ADD COLUMN foto_url TEXT;

-- 2) Galería genérica del negocio (fachada, interior, etc.) — la ficha la muestra solo cuando
-- el negocio no tiene menú/catálogo/servicios/ofertas (ver GaleriaNegocio.tsx). Hasta 6 fotos,
-- por eso alcanza con un array simple en vez de una tabla aparte.
ALTER TABLE negocios ADD COLUMN fotos_galeria TEXT[] NOT NULL DEFAULT '{}';
