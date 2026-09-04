-- Extensiones requeridas por el esquema.
-- postgis: tipo geography y funciones de distancia/radio (sección 7 del doc maestro).
-- pg_trgm: búsqueda por texto (ILIKE con índice) como interino hasta que el índice
--          dedicado (Meilisearch/Typesense) esté conectado en Etapa 2 avanzada.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Función reutilizable para mantener "actualizadoEn" al día en cualquier tabla que la use.
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
