-- Endurecimiento post-diagnóstico (ver docs/decisiones/0021-endurecimiento-post-diagnostico.md):
-- baja lógica en vez de DELETE físico, tabla de auditoría de acciones administrativas, y
-- columna para el token de notificaciones push de cada vecino.

-- ---- Baja lógica (soft-delete) ----
-- Antes: DELETE FROM usuarios_app/cuentas/avisos era irreversible y sin rastro de quién lo
-- hizo. Ahora se marca eliminado_en y todas las consultas de lectura excluyen esas filas —
-- el dato queda, por si hace falta revertir o auditar, pero desaparece de la app como si no
-- existiera.
ALTER TABLE usuarios_app ADD COLUMN eliminado_en TIMESTAMPTZ;
ALTER TABLE cuentas ADD COLUMN eliminado_en TIMESTAMPTZ;
ALTER TABLE avisos ADD COLUMN eliminado_en TIMESTAMPTZ;

-- Los índices existentes por estado/rol no filtraban por eliminado_en porque no existía;
-- se agregan versiones parciales para que las consultas de "activos" sigan siendo baratas.
CREATE INDEX idx_usuarios_app_no_eliminados ON usuarios_app(id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_cuentas_no_eliminadas ON cuentas(id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_avisos_no_eliminados ON avisos(id) WHERE eliminado_en IS NULL;

-- ---- Auditoría de acciones administrativas ----
-- Quién hizo qué, sobre qué, y cuándo — para las acciones que antes no dejaban ningún rastro
-- más allá de "validado_por_cuenta_id" (que solo cubre aprobar/rechazar, no crear ni eliminar).
CREATE TABLE auditoria (
  id BIGSERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  cuenta_id TEXT REFERENCES cuentas(id),
  -- Detalle libre por acción (ej. { "motivo": "..." } en un rechazo) — no todas las acciones
  -- necesitan los mismos campos, un jsonb evita crear una columna por caso.
  detalle JSONB,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, entidad_id);
CREATE INDEX idx_auditoria_creado_en ON auditoria(creado_en DESC);

-- ---- Notificaciones push reales ----
-- Token de Expo Push (https://exp.host/--/api/v2/push/send) del último dispositivo donde el
-- vecino activó notificaciones. NULL = nunca activó, o las desactivó. Un vecino con un solo
-- dispositivo a la vez alcanza para el piloto; soportar varios dispositivos por vecino queda
-- para más adelante si hace falta.
ALTER TABLE usuarios_app ADD COLUMN push_token TEXT;
