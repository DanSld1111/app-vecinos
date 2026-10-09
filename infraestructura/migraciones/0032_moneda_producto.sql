-- 0032 — Moneda propia de un producto (decisión 0090). NULL = la del negocio. Las ofertas y los
-- servicios guardan la suya dentro de su JSONB (campo "moneda"), sin columna nueva.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS moneda TEXT
  CHECK (moneda IS NULL OR moneda IN ('PEN', 'USD', 'EUR'));
