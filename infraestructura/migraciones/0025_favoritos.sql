-- Negocios favoritos de un vecino registrado (nunca de "modo prueba" — necesita cuenta real).
-- Ver docs/decisiones/0075-ficha-info-y-favoritos.md.

CREATE TABLE favoritos (
  id text PRIMARY KEY,
  usuario_id text NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  negocio_id text NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, negocio_id)
);

CREATE INDEX idx_favoritos_usuario ON favoritos (usuario_id, creado_en DESC);
