-- 0033 — Módulo "Para ti" y módulos que se encienden/apagan (decisión 0091).
--
-- ALTER TYPE ... ADD VALUE va solo, fuera de transacción (ver 0017).
ALTER TYPE rol_cuenta ADD VALUE IF NOT EXISTS 'editor_redes';

-- Pestañas de la app que el super admin enciende o apaga. Inicio, Servicios y Perfil no están
-- aquí porque no se pueden apagar.
CREATE TABLE IF NOT EXISTS modulos_app (
  clave TEXT PRIMARY KEY CHECK (clave IN ('comunidad', 'para_ti')),
  activo BOOLEAN NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_por TEXT REFERENCES cuentas(id)
);
-- Para ti arranca apagado: se prepara contenido y se enciende desde el panel.
INSERT INTO modulos_app (clave, activo) VALUES ('comunidad', true), ('para_ti', false)
  ON CONFLICT (clave) DO NOTHING;

-- Publicaciones de Para ti: sin comunidad ni distrito, las ven todos.
CREATE TABLE IF NOT EXISTS publicaciones (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'fotos', 'video', 'youtube')),
  texto TEXT NOT NULL DEFAULT '',
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  portada_url TEXT,
  enlace_url TEXT,
  enlace_titulo TEXT,
  enlace_miniatura TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicada')),
  permite_comentarios BOOLEAN NOT NULL DEFAULT false,
  destacada_hasta TIMESTAMPTZ,
  corazones INTEGER NOT NULL DEFAULT 0,
  compartidos INTEGER NOT NULL DEFAULT 0,
  creado_por TEXT REFERENCES cuentas(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  publicado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_publicaciones_feed ON publicaciones (publicado_en DESC) WHERE estado = 'publicada';

CREATE TABLE IF NOT EXISTS publicacion_corazones (
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (publicacion_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS publicacion_comentarios (
  id TEXT PRIMARY KEY,
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  oculto BOOLEAN NOT NULL DEFAULT false,
  reportes INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON publicacion_comentarios (publicacion_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS comentario_reportes (
  comentario_id TEXT NOT NULL REFERENCES publicacion_comentarios(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comentario_id, usuario_id)
);
