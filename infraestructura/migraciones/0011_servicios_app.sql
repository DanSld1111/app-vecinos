-- Contenido editable de la pantalla "Servicios" de apps/movil: nombre, descripción, si está
-- disponible o "próximamente", y la foto de fondo de la tarjeta. El slug, el ícono y a qué
-- pantalla navega cada uno siguen fijos en el código (apps/movil/src/componentes/IconoServicio.tsx
-- y apps/movil/app/(tabs)/servicios/index.tsx) — activar un servicio nuevo real (ej. "Taxi")
-- todavía requiere construir esa pantalla; esta tabla solo controla cómo se ve la tarjeta.
-- Ver docs/decisiones/0025-servicios-editables-desde-admin.md.

CREATE TABLE servicios_app (
  slug TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'proximamente' CHECK (estado IN ('disponible', 'proximamente')),
  foto_url TEXT,
  orden INTEGER NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_servicios_app_actualizado_en
  BEFORE UPDATE ON servicios_app
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

INSERT INTO servicios_app (slug, nombre, descripcion, estado, foto_url, orden) VALUES
  ('negocios', 'Guía de negocios', '', 'disponible', '/uploads/servicios/negocios.jpg', 1),
  ('restaurantes', 'Restaurantes', 'Platos y pedidos', 'disponible', '/uploads/servicios/restaurantes.jpg', 2),
  ('market-space', 'Market Space', 'Productos de emprendedores', 'disponible', '/uploads/servicios/market-space.jpg', 3),
  ('supermarket', 'Supermarket', 'Todo para tu despensa', 'disponible', '/uploads/servicios/supermarket.jpg', 4),
  ('rescate-animal', 'Rescate animal', '', 'proximamente', NULL, 5),
  ('turismo', 'Turismo', '', 'proximamente', NULL, 6),
  ('inmobiliaria', 'Inmobiliaria', '', 'proximamente', NULL, 7),
  ('taxi', 'Taxi', '', 'proximamente', NULL, 8),
  ('consultorias', 'Consultorías', '', 'proximamente', NULL, 9),
  ('bolsa-empleo', 'Bolsa de empleo', '', 'proximamente', NULL, 10),
  ('bolsa-puntos', 'Bolsa de puntos', '', 'proximamente', NULL, 11),
  ('otros', 'Otros servicios', '', 'proximamente', NULL, 12);
