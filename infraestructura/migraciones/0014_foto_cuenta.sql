-- Foto de perfil de una cuenta del panel (super_admin, dueño de negocio, junta vecinal,
-- validador) — self-service, ver docs/decisiones/0040-mi-cuenta-autoservicio.md.
ALTER TABLE cuentas ADD COLUMN foto_url TEXT;
