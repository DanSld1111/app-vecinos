-- Jerarquía geográfica: departamento -> provincia -> distrito -> comunidad.
-- Corresponde a paquetes/tipos/src/geografia.ts.
--
-- Regla del doc maestro (sección 5): se carga el catálogo UBIGEO completo del Perú
-- (1874 distritos) con activo=false salvo los distritos piloto. Expandir a una zona
-- nueva es "activar un registro", nunca una migración de esquema.

CREATE TABLE departamentos (
  ubigeo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE provincias (
  ubigeo TEXT PRIMARY KEY,
  departamento_ubigeo TEXT NOT NULL REFERENCES departamentos(ubigeo),
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_provincias_departamento ON provincias(departamento_ubigeo);

CREATE TABLE distritos (
  ubigeo TEXT PRIMARY KEY,
  provincia_ubigeo TEXT NOT NULL REFERENCES provincias(ubigeo),
  nombre TEXT NOT NULL,
  -- Coordenada del centro del distrito (Coordenada { lat, lng } en el contrato).
  centro geography(Point, 4326) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_distritos_provincia ON distritos(provincia_ubigeo);
CREATE INDEX idx_distritos_centro ON distritos USING GIST (centro);

-- Comunidad: unidad operativa real del producto, más pequeña que el distrito.
-- El id es un slug legible (p. ej. "com-san-borja"), no un UUID, para que coincida
-- con las referencias ya usadas en el contrato y en los datos de ejemplo actuales.
CREATE TABLE comunidades (
  id TEXT PRIMARY KEY,
  distrito_ubigeo TEXT NOT NULL REFERENCES distritos(ubigeo),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  centro geography(Point, 4326) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT false,
  fecha_lanzamiento DATE
);
CREATE INDEX idx_comunidades_distrito ON comunidades(distrito_ubigeo);
CREATE INDEX idx_comunidades_centro ON comunidades USING GIST (centro);
CREATE INDEX idx_comunidades_activo ON comunidades(activo) WHERE activo = true;
