-- Reenviar un negocio a revisión tras un rechazo, e inicio del gestor (decisión 0086).
-- version_rechazada: cómo estaba la ficha cuando la rechazaron, para el antes y después que ve
--   el validador al reenviarla (igual que avisos.version_rechazada, migración 0027).
-- nota_reenvio: lo que el gestor o el dueño le explica al validador al reenviar.
-- creado_por_cuenta_id: quién registró el negocio ("registrados por ti" en el inicio del gestor).
--   Los negocios anteriores quedan sin dato.
ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS version_rechazada JSONB,
  ADD COLUMN IF NOT EXISTS nota_reenvio TEXT,
  ADD COLUMN IF NOT EXISTS creado_por_cuenta_id TEXT REFERENCES cuentas(id);

-- El historial de un negocio incluye lo de sus productos (auditoria.detalle->>'negocioId').
CREATE INDEX IF NOT EXISTS idx_auditoria_negocio_de_producto ON auditoria ((detalle->>'negocioId')) WHERE entidad = 'producto';
