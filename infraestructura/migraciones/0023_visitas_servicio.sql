-- Registro de aperturas de cada tarjeta de servicio (Restaurantes, Market Space…) — permite
-- ordenar "Explora por rubro" en la pantalla Servicios por uso real, mismo criterio que ya usa
-- Inicio con "Cerca de ti" (ver 0022_visitas_negocio.sql). Ver docs/decisiones/0074-servicios-real.md.

CREATE TABLE servicio_visitas (
  id text PRIMARY KEY,
  servicio_slug text NOT NULL REFERENCES servicios_app(slug) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_servicio_visitas_slug_fecha ON servicio_visitas (servicio_slug, creado_en DESC);
