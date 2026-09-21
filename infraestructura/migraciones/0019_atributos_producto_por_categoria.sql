-- Atributos de producto según la categoría del negocio (borrador v1 — se ajusta con uso real,
-- ver docs/decisiones/0071-plan-v2-modulo-negocios.md).
--
-- Un negocio de Moda vende prendas (talla/color/género); uno de Comida vende platos
-- (porción/picante). `categorias.atributos_producto` define, por categoría, qué campos extra
-- pide el formulario de producto — vacío/NULL = sin campos especiales, se queda con
-- nombre/descripción/precio/foto como hasta ahora.

ALTER TABLE categorias ADD COLUMN atributos_producto JSONB;

-- Cada producto guarda los valores elegidos, con la clave del atributo de su categoría como
-- llave. Objeto vacío por defecto: un negocio sin categoría con atributos definidos no pide
-- nada nuevo, ni rompe los productos que ya existían antes de esta migración.
ALTER TABLE productos ADD COLUMN atributos JSONB NOT NULL DEFAULT '{}';

UPDATE categorias SET atributos_producto = '[
  {"clave": "talla", "etiqueta": "Talla", "tipo": "opciones", "opciones": ["XS", "S", "M", "L", "XL", "XXL"]},
  {"clave": "color", "etiqueta": "Color", "tipo": "texto"},
  {"clave": "genero", "etiqueta": "Género", "tipo": "opciones", "opciones": ["Hombre", "Mujer", "Unisex", "Niños"]}
]'::jsonb
WHERE id = 'cat-moda';

UPDATE categorias SET atributos_producto = '[
  {"clave": "porcion", "etiqueta": "Porción", "tipo": "opciones", "opciones": ["Individual", "Para compartir"]},
  {"clave": "picante", "etiqueta": "Nivel de picante", "tipo": "opciones", "opciones": ["Ninguno", "Suave", "Medio", "Picante"]},
  {"clave": "vegetariano", "etiqueta": "Es vegetariano", "tipo": "opciones", "opciones": ["Sí", "No"]}
]'::jsonb
WHERE id IN ('cat-comida', 'cat-restaurantes');

UPDATE categorias SET atributos_producto = '[
  {"clave": "material", "etiqueta": "Material", "tipo": "texto"},
  {"clave": "dimensiones", "etiqueta": "Dimensiones", "tipo": "texto"},
  {"clave": "color", "etiqueta": "Color", "tipo": "texto"}
]'::jsonb
WHERE id = 'cat-hogar';

UPDATE categorias SET atributos_producto = '[
  {"clave": "especie", "etiqueta": "Especie", "tipo": "opciones", "opciones": ["Perro", "Gato", "Otro"]},
  {"clave": "tamano", "etiqueta": "Tamaño recomendado", "tipo": "opciones", "opciones": ["Pequeño", "Mediano", "Grande"]}
]'::jsonb
WHERE id = 'cat-mascotas';

UPDATE categorias SET atributos_producto = '[
  {"clave": "duracion", "etiqueta": "Duración estimada", "tipo": "texto"},
  {"clave": "modalidad", "etiqueta": "Modalidad", "tipo": "opciones", "opciones": ["Presencial", "Remoto", "Ambos"]}
]'::jsonb
WHERE id IN ('cat-servicios', 'cat-consultorias', 'cat-salud', 'cat-otros-servicios');

-- Supermercados, Emprendimientos, Rescate animal, Turismo, Inmobiliaria: sin atributos
-- especiales por ahora (queda NULL) — el producto se queda con los campos genéricos.
