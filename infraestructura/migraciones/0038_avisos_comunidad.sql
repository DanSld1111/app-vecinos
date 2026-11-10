-- 0038 — Avisos de la comunidad (decisión 0098): inmuebles, mascotas y turismo.
--
-- * clasificados: lo que el vecino envía desde la app (queda «pendiente») o lo que el equipo carga a
--   mano en el panel. El equipo lo revisa, ordena los datos y lo publica por 30 días. El contacto es
--   siempre del anunciante (vecino, o la agencia en turismo); ELISUR solo difunde.
-- * clasificados_reportes: un vecino reporta un aviso una sola vez. Con 3 reportes vuelve a revisión.
-- * Reemplaza a las fichas Inmuebles/Tours/Mascotas de los negocios (decisiones 0096 y 0097): sus tres
--   servicios quedan «retirados» (no se listan en la app) y los negocios de esos rubros se archivan.
--   Nada se borra aquí: las tablas de Rescate animal y esos negocios se eliminan aparte, con confirmación.
CREATE TABLE IF NOT EXISTS clasificados (
  id TEXT PRIMARY KEY,
  comunidad_id TEXT NOT NULL REFERENCES comunidades(id),
  seccion TEXT NOT NULL CHECK (seccion IN ('inmuebles', 'mascotas', 'turismo')),
  subtipo TEXT NOT NULL CHECK (subtipo IN ('alquiler', 'venta', 'perdido', 'encontrado', 'adopcion', 'full_day', 'varios_dias', 'playa', 'aventura')),
  titulo TEXT NOT NULL DEFAULT '',
  texto TEXT NOT NULL DEFAULT '',
  texto_original TEXT NOT NULL DEFAULT '',
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  referencia TEXT NOT NULL DEFAULT '',
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  contacto_nombre TEXT NOT NULL DEFAULT '',
  contacto_rol TEXT NOT NULL DEFAULT '',
  contacto_whatsapp TEXT NOT NULL DEFAULT '',
  contacto_telefono TEXT NOT NULL DEFAULT '',
  autoriza_contacto BOOLEAN NOT NULL DEFAULT false,
  usuario_id TEXT REFERENCES usuarios_app(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'publicado', 'rechazado', 'cerrado')),
  cierre TEXT CHECK (cierre IN ('alquilado', 'vendido', 'encontrado', 'adoptado', 'otro')),
  motivo_rechazo TEXT,
  revisado_por_cuenta_id TEXT REFERENCES cuentas(id) ON DELETE SET NULL,
  reportes INTEGER NOT NULL DEFAULT 0,
  vistas INTEGER NOT NULL DEFAULT 0,
  contactos INTEGER NOT NULL DEFAULT 0,
  publicado_en TIMESTAMPTZ,
  vence_en TIMESTAMPTZ,
  cerrado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clasificados_publicos_idx ON clasificados (comunidad_id, seccion, estado, publicado_en DESC);
CREATE INDEX IF NOT EXISTS clasificados_usuario_idx ON clasificados (usuario_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS clasificados_estado_idx ON clasificados (estado, creado_en DESC);
CREATE INDEX IF NOT EXISTS clasificados_busqueda_idx ON clasificados USING gin ((titulo || ' ' || texto || ' ' || referencia) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS clasificados_reportes (
  clasificado_id TEXT NOT NULL REFERENCES clasificados(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (clasificado_id, usuario_id)
);

-- Los servicios de las fichas que se retiran dejan de verse en la app.
ALTER TABLE servicios_app DROP CONSTRAINT IF EXISTS servicios_app_estado_check;
ALTER TABLE servicios_app ADD CONSTRAINT servicios_app_estado_check CHECK (estado IN ('disponible', 'proximamente', 'retirado'));
UPDATE servicios_app SET estado = 'retirado', actualizado_en = now() WHERE ficha IN ('inmuebles', 'tours', 'mascotas');

-- Inmobiliarias, agencias y albergues: ya no publican en la app. Se archivan (se pueden restaurar).
UPDATE negocios n SET archivado_en = now()
 WHERE n.archivado_en IS NULL
   AND EXISTS (
     SELECT 1 FROM negocio_categorias nc
       JOIN categorias c ON c.id = nc.categoria_id
       LEFT JOIN servicios_app s ON s.slug = c.servicio_slug
      WHERE nc.negocio_id = n.id AND COALESCE(c.ficha, s.ficha) IN ('inmuebles', 'tours', 'mascotas'));
