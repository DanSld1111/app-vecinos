-- 0037 — Rescate animal (decisión 0097): adopción, padrinazgo y perdidos y encontrados.
--
-- * Un albergue es un negocio con la ficha «mascotas». Sus datos de ayuda (Yape, necesidades,
--   turnos de voluntariado) van en negocios.datos_albergue.
-- * mascotas: las que el albergue publica para adopción.
-- * solicitudes_adopcion / padrinazgos: lo que el vecino envía desde la app. La conversación sigue
--   por WhatsApp; aquí queda el registro y el estado que el albergue va cambiando.
-- * avisos_mascotas / avisos_pistas / avisos_reportes: perdidos y encontrados, publicados por
--   vecinos. Se publican al instante; con 3 reportes se ocultan hasta que ELISUR los revise.
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS datos_albergue JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS mascotas (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
  sexo TEXT NOT NULL CHECK (sexo IN ('hembra', 'macho')),
  edad_valor INTEGER,
  edad_unidad TEXT NOT NULL DEFAULT 'anios' CHECK (edad_unidad IN ('anios', 'meses')),
  tamano TEXT NOT NULL CHECK (tamano IN ('pequeno', 'mediano', 'grande')),
  peso_kg NUMERIC(5, 1),
  foto_url TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  personalidad JSONB NOT NULL DEFAULT '[]'::jsonb,
  salud JSONB NOT NULL DEFAULT '{}'::jsonb,
  convivencia JSONB NOT NULL DEFAULT '{}'::jsonb,
  historia TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_proceso', 'adoptada')),
  urgente BOOLEAN NOT NULL DEFAULT false,
  apadrinable BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  adoptada_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mascotas_negocio_idx ON mascotas (negocio_id, orden);

CREATE SEQUENCE IF NOT EXISTS solicitudes_adopcion_numero_seq START 1001;
CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
  id TEXT PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('solicitudes_adopcion_numero_seq'),
  mascota_id TEXT NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  motivo TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'entrevista', 'aprobada', 'adoptada', 'no_aprobada', 'cancelada')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS solicitudes_negocio_idx ON solicitudes_adopcion (negocio_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS solicitudes_usuario_idx ON solicitudes_adopcion (usuario_id, creado_en DESC);

CREATE SEQUENCE IF NOT EXISTS padrinazgos_numero_seq START 301;
CREATE TABLE IF NOT EXISTS padrinazgos (
  id TEXT PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT nextval('padrinazgos_numero_seq'),
  mascota_id TEXT NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  monto NUMERIC(8, 2) NOT NULL CHECK (monto > 0),
  estado TEXT NOT NULL DEFAULT 'por_confirmar' CHECK (estado IN ('por_confirmar', 'activo', 'cancelado')),
  ultimo_pago_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS padrinazgos_negocio_idx ON padrinazgos (negocio_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS padrinazgos_usuario_idx ON padrinazgos (usuario_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS avisos_mascotas (
  id TEXT PRIMARY KEY,
  comunidad_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('perdido', 'encontrado')),
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
  nombre TEXT NOT NULL DEFAULT '',
  senas TEXT NOT NULL DEFAULT '',
  tamano TEXT CHECK (tamano IN ('pequeno', 'mediano', 'grande')),
  recompensa TEXT NOT NULL DEFAULT '',
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  lugar TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  cuando TEXT NOT NULL DEFAULT '',
  mostrar_whatsapp BOOLEAN NOT NULL DEFAULT true,
  telefono TEXT NOT NULL DEFAULT '',
  autor_nombre TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'publicado' CHECK (estado IN ('publicado', 'oculto', 'cerrado')),
  reportes INTEGER NOT NULL DEFAULT 0,
  cerrado_en TIMESTAMPTZ,
  vence_en TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avisos_mascotas_comunidad_idx ON avisos_mascotas (comunidad_id, estado, creado_en DESC);
CREATE INDEX IF NOT EXISTS avisos_mascotas_usuario_idx ON avisos_mascotas (usuario_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS avisos_pistas (
  id TEXT PRIMARY KEY,
  aviso_id TEXT NOT NULL REFERENCES avisos_mascotas(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  autor_nombre TEXT NOT NULL DEFAULT '',
  cuando TEXT NOT NULL DEFAULT '',
  lugar TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  texto TEXT NOT NULL DEFAULT '',
  foto_url TEXT,
  es_mio BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avisos_pistas_aviso_idx ON avisos_pistas (aviso_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS avisos_reportes (
  aviso_id TEXT NOT NULL REFERENCES avisos_mascotas(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, usuario_id)
);

ALTER TABLE servicios_app DROP CONSTRAINT IF EXISTS servicios_app_ficha_check;
ALTER TABLE servicios_app ADD CONSTRAINT servicios_app_ficha_check
  CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria', 'inmuebles', 'tours', 'mascotas'));
ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_ficha_check;
ALTER TABLE categorias ADD CONSTRAINT categorias_ficha_check
  CHECK (ficha IN ('menu', 'catalogo', 'servicios', 'rubros', 'ofertas', 'galeria', 'inmuebles', 'tours', 'mascotas'));
