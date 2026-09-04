-- Cuentas internas del panel administrador (roles del sistema).
-- Corresponde a paquetes/tipos/src/cuenta.ts.
-- Distinto de usuarios_app (0006_usuarios_app.sql), que son los vecinos anónimos de la app móvil.

CREATE TYPE rol_cuenta AS ENUM (
  'super_admin',
  'dueno_negocio',
  'junta_vecinal',
  'validador_contenido'
);

CREATE TABLE cuentas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  rol rol_cuenta NOT NULL,
  -- Hash de la contraseña (bcrypt/argon2). Campo interno del backend: no forma parte
  -- del contrato paquetes/tipos/src/cuenta.ts, que describe la forma de la respuesta
  -- de la API, nunca las credenciales.
  password_hash TEXT NOT NULL,
  -- "Olvidé mi contraseña": código de un solo uso hasheado + vencimiento. Ambos NULL cuando
  -- no hay una recuperación en curso. Ver docs/decisiones/0011-recuperacion-de-clave.md.
  codigo_recuperacion_hash TEXT,
  codigo_recuperacion_expira TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_acceso_en TIMESTAMPTZ
);
CREATE INDEX idx_cuentas_rol ON cuentas(rol);

-- negocioIds: solo aplica a rol = 'dueno_negocio'. Una cuenta puede administrar varios locales.
CREATE TABLE cuenta_negocios (
  cuenta_id TEXT NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  negocio_id TEXT NOT NULL, -- FK a negocios(id) se agrega en 0005_negocios.sql (evita dependencia circular de archivos)
  PRIMARY KEY (cuenta_id, negocio_id)
);

-- distritosAsignados: solo aplica a rol = 'junta_vecinal' o 'validador_contenido'.
-- Sin filas para una cuenta = alcance de todos los distritos (regla de utilidades/alcance.ts).
CREATE TABLE cuenta_distritos (
  cuenta_id TEXT NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  distrito_ubigeo TEXT NOT NULL REFERENCES distritos(ubigeo),
  PRIMARY KEY (cuenta_id, distrito_ubigeo)
);
