-- "Información local" (avisos) y directorio profesional.
-- Corresponde a paquetes/tipos/src/aviso.ts y profesional.ts.

CREATE TYPE categoria_aviso AS ENUM ('municipal', 'junta_vecinal', 'seguridad', 'otro');
CREATE TYPE estado_aviso AS ENUM ('pendiente', 'publicado', 'rechazado');

CREATE TABLE avisos (
  id TEXT PRIMARY KEY,
  comunidad_id TEXT NOT NULL REFERENCES comunidades(id),
  fuente_nombre TEXT NOT NULL,
  fuente_verificada BOOLEAN NOT NULL DEFAULT false,
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  categoria categoria_aviso NOT NULL,
  estado estado_aviso NOT NULL DEFAULT 'pendiente',
  creado_por_cuenta_id TEXT NOT NULL REFERENCES cuentas(id),
  validado_por_cuenta_id TEXT REFERENCES cuentas(id),
  motivo_rechazo TEXT,
  publicado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  imagen_url TEXT,
  -- Semillas locales hasta que exista agregación real de usuarios finales (ver comentario en el tipo TS).
  me_gusta INTEGER NOT NULL DEFAULT 0,
  compartidos INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_avisos_comunidad ON avisos(comunidad_id);
CREATE INDEX idx_avisos_estado ON avisos(estado);
CREATE INDEX idx_avisos_publicado_en ON avisos(publicado_en DESC);

-- Servicios 9, 10 y 11: médicos, veterinarios, legal/contable.
CREATE TYPE tipo_profesional AS ENUM ('medico', 'veterinario', 'legal_contable');

CREATE TABLE profesionales (
  id TEXT PRIMARY KEY,
  comunidad_id TEXT NOT NULL REFERENCES comunidades(id),
  tipo tipo_profesional NOT NULL,
  nombre TEXT NOT NULL,
  -- La verificación la respalda el colegio profesional, no la app (ver profesional.ts).
  colegiatura_numero TEXT NOT NULL,
  colegiatura_entidad TEXT NOT NULL,
  colegiatura_verificada_en TIMESTAMPTZ,
  especialidad TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  direccion_consultorio TEXT NOT NULL,
  coordenada geography(Point, 4326) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_profesionales_comunidad ON profesionales(comunidad_id);
CREATE INDEX idx_profesionales_tipo ON profesionales(tipo);
CREATE INDEX idx_profesionales_coordenada ON profesionales USING GIST (coordenada);
