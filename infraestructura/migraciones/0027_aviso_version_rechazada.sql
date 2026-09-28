-- Antes y después de un aviso reenviado: cuando una junta corrige un aviso rechazado y lo vuelve
-- a enviar, se guarda aquí la versión que se rechazó (título, cuerpo, categoría y el motivo), para
-- que quien valida vea qué cambió. Se limpia al aprobarlo. Null en todo aviso que nunca fue
-- reenviado. Ver docs/decisiones/0079-antes-despues-avisos.md.

ALTER TABLE avisos ADD COLUMN IF NOT EXISTS version_rechazada jsonb;
