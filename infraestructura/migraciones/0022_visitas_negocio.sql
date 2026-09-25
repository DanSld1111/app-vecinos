-- Registro de visitas a la ficha de cada negocio — permite ordenar "Cerca de ti" por
-- popularidad real de los últimos 7 días, en vez de por fecha de alta del negocio. Ver
-- docs/decisiones/0073-inicio-orden-real.md.

CREATE TABLE negocio_visitas (
  id text PRIMARY KEY,
  negocio_id text NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- El índice cubre tanto el filtro (negocio_id) como la ventana de 7 días (creado_en) que usa
-- el conteo en negocios.mapeo.ts.
CREATE INDEX idx_negocio_visitas_negocio_fecha ON negocio_visitas (negocio_id, creado_en DESC);
