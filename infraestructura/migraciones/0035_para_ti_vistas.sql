-- 0035 — Visualizaciones de Para ti (decisión 0094).
--
-- Una visualización = un celular (el mismo id al azar de para_ti_visitas) que vio la
-- publicación ese día: en el muro (al menos 1 segundo en pantalla), abierta, en los videos en
-- vertical o como destacada. Contar una vez por celular y por día evita que se infle con cada
-- vuelta al muro. publicaciones.vistas guarda el total para leerlo rápido.
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS vistas INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS publicacion_vistas (
  publicacion_id TEXT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  visitante TEXT NOT NULL,
  dia DATE NOT NULL,
  PRIMARY KEY (publicacion_id, visitante, dia)
);
CREATE INDEX IF NOT EXISTS idx_publicacion_vistas_dia ON publicacion_vistas (dia);
