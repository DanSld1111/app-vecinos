-- Módulo de pagos: solo el andamiaje (sección 11 del doc maestro). NO USAR TODAVÍA.
-- El modelo de ingresos aún no está validado con negocios reales (ver 10-fases-pendientes.pdf,
-- "Otros pendientes de definición"). Esta tabla existe para que activar el cobro más adelante
-- sea encender una funcionalidad, no rediseñar el esquema.
--
-- La abstracción de proveedor (interfaz ProveedorDePago) vive en el código del backend
-- (apps/api), no en la base de datos: aquí solo se registra el resultado de una transacción,
-- sin importar qué pasarela la procesó.

CREATE TYPE estado_pago AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');

CREATE TABLE pagos_transacciones (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  plan plan_negocio NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  proveedor TEXT NOT NULL, -- nombre del proveedor real (Culqi, MercadoPago, etc.), sin acoplar el esquema a uno
  referencia_externa TEXT, -- id de la transacción en el proveedor
  estado estado_pago NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pagos_negocio ON pagos_transacciones(negocio_id);
CREATE INDEX idx_pagos_estado ON pagos_transacciones(estado);
