-- Vecino final que se registra desde la app móvil (FlujoLogin: correo + clave, sin SMS —
-- ver docs/decisiones/0010-registro-vecinos-correo-clave.md). Corresponde a
-- paquetes/tipos/src/usuario.ts. Distinto de "cuentas" (0003), que son los roles internos
-- del panel.

CREATE TYPE estado_usuario_app AS ENUM ('activo', 'bloqueado');

CREATE TABLE usuarios_app (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  -- Password hash: campo interno del backend, igual que cuentas.password_hash (0003) —
  -- no forma parte del contrato paquetes/tipos/src/usuario.ts.
  password_hash TEXT NOT NULL,
  -- "Olvidé mi contraseña": mismo mecanismo que cuentas.codigo_recuperacion_* (0003).
  codigo_recuperacion_hash TEXT,
  codigo_recuperacion_expira TIMESTAMPTZ,
  telefono TEXT NOT NULL UNIQUE,
  comunidad_id TEXT NOT NULL REFERENCES comunidades(id),
  estado estado_usuario_app NOT NULL DEFAULT 'activo',
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_acceso_en TIMESTAMPTZ
);
CREATE INDEX idx_usuarios_app_comunidad ON usuarios_app(comunidad_id);
CREATE INDEX idx_usuarios_app_estado ON usuarios_app(estado);
