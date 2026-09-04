-- Sistema de fichas de negocio: plantilla visual -> arquetipo -> categoría.
-- Corresponde a paquetes/tipos/src/plantilla.ts, arquetipo.ts y categoria.ts.

CREATE TYPE modo_plantilla AS ENUM ('lista', 'unico');
CREATE TYPE origen_plantilla AS ENUM ('sistema', 'nueva');
CREATE TYPE origen_arquetipo AS ENUM ('sistema', 'personalizado');

-- Un diseño de ficha ya resuelto en código. El super-admin solo elige de este catálogo.
CREATE TABLE plantillas_visuales (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  modo modo_plantilla NOT NULL,
  origen origen_plantilla NOT NULL,
  descripcion_uso TEXT NOT NULL,
  -- CampoEsperadoPlantilla[]: [{ etiqueta, tipo, obligatorio }]
  campos_esperados JSONB NOT NULL DEFAULT '[]'
);

-- Un Arquetipo elige una plantilla y le pone nombres propios a sus campos.
CREATE TABLE arquetipos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL,
  plantilla_id TEXT NOT NULL REFERENCES plantillas_visuales(id),
  origen origen_arquetipo NOT NULL,
  -- CampoArquetipo[]: [{ claveOriginal, etiqueta, obligatorio }]
  campos JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_arquetipos_plantilla ON arquetipos(plantilla_id);

-- arquetipoFicha: valor heredado (@deprecated en el tipo TS) que la app móvil todavía
-- lee para las 5 fichas fijas originales. Se mantiene mientras esa lectura exista.
CREATE TYPE arquetipo_ficha AS ENUM ('menu', 'catalogo', 'servicios', 'categorias', 'ofertas');

CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  padre_id TEXT REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icono TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  arquetipo_ficha arquetipo_ficha, -- @deprecated, ver comentario arriba
  arquetipo_id TEXT REFERENCES arquetipos(id)
);
CREATE INDEX idx_categorias_padre ON categorias(padre_id);
