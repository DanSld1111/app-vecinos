-- Cierra el CRUD de negocios: Archivar (reversible) y Eliminar (definitivo).
--
-- "Despublicar" (0066) ya existía para bajar un negocio de la app sin perder el registro.
-- Faltaban dos cosas distintas: retirarlo del propio LISTADO del panel cuando ya no tiene
-- sentido seguir viéndolo ahí (cerró, fue un duplicado) — reversible — y borrarlo de verdad
-- cuando corresponde. Ver docs/decisiones/0071-plan-v2-modulo-negocios.md.

ALTER TABLE negocios ADD COLUMN archivado_en TIMESTAMPTZ;

-- El listado del panel filtra por "no archivado" en casi todas las consultas — este índice
-- parcial es el que se usa en la práctica (igual que idx_productos_negocio_vigentes en 0016).
CREATE INDEX idx_negocios_no_archivados ON negocios(archivado_en) WHERE archivado_en IS NULL;

-- Eliminar (DELETE físico) no puede chocar con filas que lo referencian sin cascada. Antes de
-- esta migración, resenas/anuncios/pagos_transacciones tenían la acción por defecto de
-- Postgres (NO ACTION), que hubiera bloqueado el borrado con un error de FK.
ALTER TABLE resenas DROP CONSTRAINT resenas_negocio_id_fkey,
  ADD CONSTRAINT resenas_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE;

-- Un anuncio no deja de existir porque el negocio que promocionaba se borró — negocio_id ya
-- era nullable, así que queda huérfano en vez de desaparecer.
ALTER TABLE anuncios DROP CONSTRAINT anuncios_negocio_id_fkey,
  ADD CONSTRAINT anuncios_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE SET NULL;

-- Scaffold sin usar todavía (0009_pagos_preparado.sql) — CASCADE por consistencia, no hay
-- filas reales que puedan perderse.
ALTER TABLE pagos_transacciones DROP CONSTRAINT pagos_transacciones_negocio_id_fkey,
  ADD CONSTRAINT pagos_transacciones_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE;
