-- La calificación por estrellas ahora admite medias estrellas (1, 1.5, 2 … hasta 5) — antes
-- solo enteros. Ver docs/decisiones/0076-calificacion-estrellas.md.

ALTER TABLE resenas DROP CONSTRAINT resenas_calificacion_check;
ALTER TABLE resenas ALTER COLUMN calificacion TYPE numeric(2,1) USING calificacion::numeric(2,1);
ALTER TABLE resenas ADD CONSTRAINT resenas_calificacion_check
  CHECK (calificacion BETWEEN 1 AND 5 AND calificacion * 2 = ROUND(calificacion * 2));
