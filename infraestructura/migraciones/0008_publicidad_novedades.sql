-- Espacios de publicidad interna y novedades del panel.
-- Corresponde a paquetes/tipos/src/anuncio.ts y novedad.ts.

CREATE TYPE ubicacion_anuncio AS ENUM ('carrusel_inicio', 'banner_buscar');

CREATE TABLE anuncios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  detalle TEXT NOT NULL,
  imagen_url TEXT,
  -- Un mismo anuncio puede vivir en más de un espacio de la app.
  ubicaciones ubicacion_anuncio[] NOT NULL DEFAULT '{}',
  negocio_id TEXT REFERENCES negocios(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_anuncios_activo ON anuncios(activo) WHERE activo = true;

-- Novedades del propio producto (changelog visible para el equipo/negocios), no del vecino.
CREATE TABLE novedades (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  publicado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo BOOLEAN NOT NULL DEFAULT true
);
