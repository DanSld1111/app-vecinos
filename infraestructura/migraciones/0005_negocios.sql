-- Entidad núcleo del directorio (servicio 1 del catálogo).
-- Corresponde a paquetes/tipos/src/negocio.ts y producto.ts.

CREATE TYPE estado_negocio AS ENUM ('activo', 'inactivo', 'por_verificar');

-- plan: preparado para el módulo de pagos (sección 11 del doc maestro), inactivo por ahora.
-- No existe interfaz de cobro real todavía — ver 0009_pagos_preparado.sql.
CREATE TYPE plan_negocio AS ENUM ('gratuito', 'destacado');

CREATE TABLE negocios (
  id TEXT PRIMARY KEY,
  comunidad_id TEXT NOT NULL REFERENCES comunidades(id),
  -- Denormalizado a propósito: evita un JOIN en cada listado filtrado por distrito
  -- (Dashboard, ColaValidacion, etc. ya filtran así en el panel admin).
  distrito_ubigeo TEXT NOT NULL REFERENCES distritos(ubigeo),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  coordenada geography(Point, 4326) NOT NULL,
  direccion TEXT NOT NULL,
  telefono TEXT,
  whatsapp TEXT,
  -- Horarios: Record<DiaSemana, HorarioDia> completo, siempre los 7 días.
  horarios JSONB NOT NULL,
  foto_principal_url TEXT,
  estado estado_negocio NOT NULL DEFAULT 'por_verificar',
  verificado_en TIMESTAMPTZ,
  validado_por_cuenta_id TEXT REFERENCES cuentas(id),
  motivo_rechazo TEXT,
  fuente TEXT NOT NULL,
  plan plan_negocio NOT NULL DEFAULT 'gratuito',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Campos específicos de arquetipo. Solo se llenan los que aplican al negocio;
  -- el resto queda NULL (misma idea que los campos opcionales en el tipo TS).
  servicios_ofrecidos JSONB,   -- ServicioOfrecido[]: arquetipo "servicios"
  rubros_disponibles TEXT[],  -- arquetipo "categorias"
  ofertas JSONB,               -- OfertaNegocio[]: cualquier negocio puede tenerlas
  pasillos TEXT[]              -- arquetipo "ofertas" (supermercados)
);

CREATE INDEX idx_negocios_comunidad ON negocios(comunidad_id);
CREATE INDEX idx_negocios_distrito ON negocios(distrito_ubigeo);
CREATE INDEX idx_negocios_estado ON negocios(estado);
CREATE INDEX idx_negocios_coordenada ON negocios USING GIST (coordenada);
CREATE INDEX idx_negocios_nombre_trgm ON negocios USING GIN (nombre gin_trgm_ops);

CREATE TRIGGER trg_negocios_actualizado_en
  BEFORE UPDATE ON negocios
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Ahora que negocios existe, se completa la FK diferida de cuenta_negocios.
ALTER TABLE cuenta_negocios
  ADD CONSTRAINT fk_cuenta_negocios_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE;

-- categoriaIds: relación muchos-a-muchos negocio <-> categoría.
CREATE TABLE negocio_categorias (
  negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  PRIMARY KEY (negocio_id, categoria_id)
);
CREATE INDEX idx_negocio_categorias_categoria ON negocio_categorias(categoria_id);

-- Menú/carta (servicio 3) o catálogo de Market Space. Ver regla de ficha en 04-modelo-de-datos.md:
-- si el negocio tiene productos se muestra MenuNegocio, si no, GaleriaNegocio.
CREATE TABLE productos (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC(10, 2) NOT NULL,
  categoria_menu TEXT NOT NULL,
  destacado BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_productos_negocio ON productos(negocio_id);
