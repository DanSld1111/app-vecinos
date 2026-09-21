-- CRUD real de productos + moneda del negocio.
--
-- Hasta ahora los productos solo podían entrar por carga de datos directa: la API únicamente
-- sabía listarlos y cambiarles la foto. Estas columnas son lo que faltaba para poder
-- crearlos/editarlos/borrarlos desde el panel y desde la cuenta del dueño.

-- Orden manual dentro de cada sección del menú (arrastrar para reordenar). Sin esto, los
-- productos salían alfabéticos y el dueño no podía poner primero lo que más vende.
ALTER TABLE productos ADD COLUMN orden INTEGER NOT NULL DEFAULT 0;

-- Papelera: borrado lógico, no DELETE físico — se puede restaurar. A diferencia de otras
-- tablas con `eliminado_en` (cuentas, avisos, usuarios_app), acá NO hay purga automática por
-- tiempo: la papelera se vacía solo cuando alguien elimina definitivamente, a propósito
-- (decisión del usuario). Ver docs/decisiones/0065-crud-productos.md.
ALTER TABLE productos ADD COLUMN eliminado_en TIMESTAMPTZ;
CREATE INDEX idx_productos_negocio_vigentes ON productos(negocio_id) WHERE eliminado_en IS NULL;

-- Moneda a nivel de negocio, no de producto: un negocio cobra todo en la misma moneda, así se
-- elige una vez y aplica a sus productos, ofertas y servicios (si fuera por producto, la misma
-- carta podría terminar mezclando soles y dólares sin querer). 'PEN' por defecto — el piloto es
-- San Borja; 'USD'/'EUR' quedan disponibles por si acaso.
ALTER TABLE negocios ADD COLUMN moneda TEXT NOT NULL DEFAULT 'PEN';
