-- Reseñas y calificaciones de negocios, dejadas por vecinos registrados (usuarios_app).
-- Corresponde a paquetes/tipos/src/resena.ts.

CREATE TABLE resenas (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id),
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Moderación por el mismo rol que ya modera avisos/negocios — nunca DELETE físico, así
  -- queda rastro de qué se ocultó y por qué (mismo criterio que baja lógica en cuentas/avisos).
  oculta BOOLEAN NOT NULL DEFAULT false,
  ocultada_por_cuenta_id TEXT REFERENCES cuentas(id),
  -- Un vecino, una reseña por negocio: volver a "crear" es en realidad editar la propia
  -- (ver resenas.service.ts, upsert con ON CONFLICT).
  UNIQUE (negocio_id, usuario_id)
);
CREATE INDEX idx_resenas_negocio ON resenas(negocio_id) WHERE NOT oculta;
CREATE INDEX idx_resenas_usuario ON resenas(usuario_id);
