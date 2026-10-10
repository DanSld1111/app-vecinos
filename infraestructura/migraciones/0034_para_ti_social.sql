-- 0034 — "Para ti" como red social (decisión 0092): publicaciones programadas, orden de las
-- destacadas, respuestas y comentarios oficiales de ELISUR, comentario fijado, corazones en
-- comentarios, motivos de reporte, vecinos silenciados y números de los últimos días.

-- Orden manual de las destacadas (null = por fecha). Una publicación programada es una
-- "publicada" cuyo publicado_en todavía no llega: no hace falta otro estado.
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS destacada_orden INTEGER;

-- Comentarios: el autor es un vecino (usuario_id) o ELISUR desde el panel (cuenta_id).
ALTER TABLE publicacion_comentarios ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE publicacion_comentarios ADD COLUMN IF NOT EXISTS cuenta_id TEXT REFERENCES cuentas(id) ON DELETE SET NULL;
-- Respuestas de un solo nivel: respuesta_a apunta siempre a un comentario principal.
ALTER TABLE publicacion_comentarios ADD COLUMN IF NOT EXISTS respuesta_a TEXT REFERENCES publicacion_comentarios(id) ON DELETE CASCADE;
ALTER TABLE publicacion_comentarios ADD COLUMN IF NOT EXISTS fijado_en TIMESTAMPTZ;
ALTER TABLE publicacion_comentarios ADD COLUMN IF NOT EXISTS corazones INTEGER NOT NULL DEFAULT 0;
-- Revisado por el panel ("Está bien" o "Mantener oculto"): sale de Reportados y no se vuelve a
-- ocultar solo.
ALTER TABLE publicacion_comentarios ADD COLUMN IF NOT EXISTS revisado BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_comentarios_respuesta ON publicacion_comentarios (respuesta_a) WHERE respuesta_a IS NOT NULL;

CREATE TABLE IF NOT EXISTS comentario_corazones (
  comentario_id TEXT NOT NULL REFERENCES publicacion_comentarios(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comentario_id, usuario_id)
);

ALTER TABLE comentario_reportes ADD COLUMN IF NOT EXISTS motivo TEXT NOT NULL DEFAULT 'otro';
DO $$ BEGIN
  ALTER TABLE comentario_reportes ADD CONSTRAINT comentario_reportes_motivo_check
    CHECK (motivo IN ('publicidad', 'ofensivo', 'enganoso', 'otro'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vecinos que no pueden comentar en Para ti hasta una fecha.
CREATE TABLE IF NOT EXISTS para_ti_silenciados (
  usuario_id TEXT PRIMARY KEY REFERENCES usuarios_app(id) ON DELETE CASCADE,
  hasta TIMESTAMPTZ NOT NULL,
  por TEXT REFERENCES cuentas(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Para contar por día (el contador de publicaciones.compartidos no guarda cuándo).
CREATE TABLE IF NOT EXISTS publicacion_compartidos (
  id BIGSERIAL PRIMARY KEY,
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compartidos_fecha ON publicacion_compartidos (creado_en);
CREATE INDEX IF NOT EXISTS idx_corazones_fecha ON publicacion_corazones (creado_en);

-- Quién abrió Para ti cada día: un id al azar que guarda el celular (no identifica a la persona).
CREATE TABLE IF NOT EXISTS para_ti_visitas (
  dia DATE NOT NULL,
  visitante TEXT NOT NULL,
  PRIMARY KEY (dia, visitante)
);
