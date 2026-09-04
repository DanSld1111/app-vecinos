-- Semilla del piloto: Lima + San Borja/Miraflores/Surco/Surquillo, generada por
-- infraestructura/datos-semilla/generar-semilla.js a partir de apps/admin/src/datos/mock/*.ts.
-- No editar a mano: si el mock cambia, se vuelve a correr el generador.

INSERT INTO departamentos (ubigeo, nombre, activo) VALUES
  ('15', 'Lima', true);

INSERT INTO provincias (ubigeo, departamento_ubigeo, nombre, activo) VALUES
  ('1501', '15', 'Lima', true);

INSERT INTO distritos (ubigeo, provincia_ubigeo, nombre, centro, activo) VALUES
  ('150140', '1501', 'San Borja', ST_SetSRID(ST_MakePoint(-77, -12.1055), 4326)::geography, true),
  ('150122', '1501', 'Miraflores', ST_SetSRID(ST_MakePoint(-77.0282, -12.1211), 4326)::geography, true),
  ('150141', '1501', 'Surco', ST_SetSRID(ST_MakePoint(-76.9927, -12.1352), 4326)::geography, true),
  ('150142', '1501', 'Surquillo', ST_SetSRID(ST_MakePoint(-77.0158, -12.1145), 4326)::geography, true);

INSERT INTO comunidades (id, distrito_ubigeo, nombre, slug, centro, descripcion, activo, fecha_lanzamiento) VALUES
  ('com-san-borja', '150140', 'San Borja', 'san-borja', ST_SetSRID(ST_MakePoint(-77, -12.1055), 4326)::geography, 'San Borja es un distrito residencial de Lima conocido por sus áreas verdes, seguridad y cercanía a centros culturales y deportivos.', true, '2026-09-01'),
  ('com-miraflores', '150122', 'Miraflores', 'miraflores', ST_SetSRID(ST_MakePoint(-77.0282, -12.1211), 4326)::geography, 'Miraflores es un distrito costero de Lima, conocido por el Malecón, sus parques y su intensa actividad comercial y turística.', true, '2026-09-15'),
  ('com-surco', '150141', 'Surco', 'surco', ST_SetSRID(ST_MakePoint(-76.9927, -12.1352), 4326)::geography, 'Santiago de Surco es uno de los distritos más extensos de Lima, con zonas residenciales, comerciales y parques como el Parque de la Amistad.', true, '2026-09-20'),
  ('com-surquillo', '150142', 'Surquillo', 'surquillo', ST_SetSRID(ST_MakePoint(-77.0158, -12.1145), 4326)::geography, 'Surquillo es un distrito pequeño y muy comercial de Lima, conocido por su mercado mayorista y su ubicación central entre Miraflores y San Borja.', true, '2026-09-20');

INSERT INTO cuentas (id, nombre, correo, rol, password_hash, activo, creado_en) VALUES
  ('cuenta-super-admin', 'Equipo ELISUR', 'admin@elisur.com', 'super_admin', '$2a$10$v5BP.HqOJe77WgZP6Ex/Se9qsHaPeNeYEcKz9rZnLboy3xC/3CYmS', true, '2026-07-01T00:00:00.000Z'),
  ('cuenta-dueno-fogon', 'María Quispe', 'dueno@elisur.com', 'dueno_negocio', '$2a$10$REIjqSON1i.oRskwM8zOcelKWb.aDN7BwHUzHgiM5.3JFPBxZKT5W', true, '2026-08-01T00:00:00.000Z'),
  ('cuenta-junta-sb', 'Junta Vecinal SB', 'junta@elisur.com', 'junta_vecinal', '$2a$10$Yw7J.dKBVi1fxPk7ephuLOemxFL1QcR/ZHjUsAqdR4G7pDr.kjqzi', true, '2026-08-01T00:00:00.000Z'),
  ('cuenta-validadora-rocio', 'Rocío Salas', 'validador@elisur.com', 'validador_contenido', '$2a$10$6FfHdKtQ7yLb4/h8GVN/1ObvtRV.xBZkbzuipLIIxXZYprq9.K5tC', true, '2026-08-01T00:00:00.000Z'),
  ('cuenta-junta-miraflores', 'Junta Vecinal Miraflores', 'juntavecinal@miraflores.pe', 'junta_vecinal', '$2a$10$cJs0YxWpWYSakljksPY43Ob45/IlUM9LvdcOiUYy5guIf74wRuWtK', true, '2026-08-29T00:00:00.000Z'),
  ('cuenta-validador-miraflores', 'Javier Ortega', 'validador@miraflores.pe', 'validador_contenido', '$2a$10$HawKeoffLtFEyNKDStZvHeG6so4Ab6.OUMBkL2g0CXBvHXlt720Q2', true, '2026-08-29T00:00:00.000Z'),
  ('cuenta-junta-surco', 'Junta Vecinal Surco', 'juntavecinal@surco.pe', 'junta_vecinal', '$2a$10$qOn1dA/DsJ/H3U0Cgj9kueLLwYmpH16AYmwSSn4NBfLUFpBYujP/e', true, '2026-08-31T00:00:00.000Z'),
  ('cuenta-validador-surco', 'Patricia Vega', 'validador@surco.pe', 'validador_contenido', '$2a$10$H6OoqHkJdYPYCVW.X5uq8.6vc24vUEW2iPoWZt8Lueo9Jul.w4l7i', true, '2026-08-31T00:00:00.000Z'),
  ('cuenta-junta-surquillo', 'Junta Vecinal Surquillo', 'juntavecinal@surquillo.pe', 'junta_vecinal', '$2a$10$TV8LU62ncf/apr2iozyV.uUKC0lL3UvwjFvjbV5wO54w.SuP8Ajeq', true, '2026-08-31T00:00:00.000Z'),
  ('cuenta-validador-surquillo', 'Diego Ramos', 'validador@surquillo.pe', 'validador_contenido', '$2a$10$pidyWv4MHb6Zlh/JFX3VZOifm1zGKJFLCBVdeBuBrd4yJdXp8MFLO', true, '2026-08-31T00:00:00.000Z');

INSERT INTO cuenta_distritos (cuenta_id, distrito_ubigeo) VALUES
  ('cuenta-junta-sb', '150140'),
  ('cuenta-validadora-rocio', '150140'),
  ('cuenta-junta-miraflores', '150122'),
  ('cuenta-validador-miraflores', '150122'),
  ('cuenta-junta-surco', '150141'),
  ('cuenta-validador-surco', '150141'),
  ('cuenta-junta-surquillo', '150142'),
  ('cuenta-validador-surquillo', '150142');

INSERT INTO plantillas_visuales (id, nombre, modo, origen, descripcion_uso, campos_esperados) VALUES
  ('lista-simple', 'Lista simple', 'lista', 'sistema', 'El mismo diseño que ya usa hoy el arquetipo Servicios — sin foto, sin destacado.', '[{"etiqueta":"Nombre","tipo":"texto","obligatorio":true},{"etiqueta":"Detalle","tipo":"texto_largo","obligatorio":false},{"etiqueta":"Precio","tipo":"precio","obligatorio":true}]'::jsonb),
  ('grilla-foto', 'Grilla con foto', 'lista', 'sistema', 'El mismo diseño que ya usa hoy el arquetipo Catálogo — grilla de 2 columnas con foto y precio.', '[{"etiqueta":"Nombre","tipo":"texto","obligatorio":true},{"etiqueta":"Precio","tipo":"precio","obligatorio":true},{"etiqueta":"Sección","tipo":"texto","obligatorio":false},{"etiqueta":"Foto","tipo":"foto","obligatorio":false},{"etiqueta":"Destacado","tipo":"booleano","obligatorio":false}]'::jsonb),
  ('lista-agrupada', 'Lista agrupada por sección', 'lista', 'sistema', 'El mismo diseño que ya usa hoy el arquetipo Menú — secciones con insignia "Más pedido".', '[{"etiqueta":"Nombre","tipo":"texto","obligatorio":true},{"etiqueta":"Precio","tipo":"precio","obligatorio":true},{"etiqueta":"Sección","tipo":"texto","obligatorio":true},{"etiqueta":"Destacado","tipo":"booleano","obligatorio":false}]'::jsonb),
  ('chips', 'Chips', 'lista', 'sistema', 'El mismo diseño que ya usa hoy el arquetipo Rubros — etiquetas sueltas, sin precio.', '[{"etiqueta":"Nombre","tipo":"texto","obligatorio":true}]'::jsonb),
  ('carrusel-descuento', 'Carrusel con descuento', 'lista', 'sistema', 'El mismo diseño que ya usa hoy el arquetipo Ofertas — carrusel horizontal con cinta de descuento.', '[{"etiqueta":"Nombre","tipo":"texto","obligatorio":true},{"etiqueta":"Precio","tipo":"precio","obligatorio":true},{"etiqueta":"Precio anterior","tipo":"precio","obligatorio":false},{"etiqueta":"Etiqueta","tipo":"texto","obligatorio":false}]'::jsonb),
  ('ficha-perfil', 'Ficha de perfil', 'unico', 'nueva', 'Ideal para Consultorías y profesionales independientes — foto, especialidad y tarifa.', '[{"etiqueta":"Foto","tipo":"foto","obligatorio":false},{"etiqueta":"Especialidad","tipo":"texto","obligatorio":true},{"etiqueta":"Tarifa","tipo":"precio","obligatorio":true},{"etiqueta":"Disponible ahora","tipo":"booleano","obligatorio":false}]'::jsonb);

INSERT INTO arquetipos (id, nombre, icono, plantilla_id, origen, campos) VALUES
  ('arq-menu', 'Menú', 'restaurant-outline', 'lista-agrupada', 'sistema', '[{"claveOriginal":"Nombre","etiqueta":"Nombre","obligatorio":true},{"claveOriginal":"Precio","etiqueta":"Precio","obligatorio":true},{"claveOriginal":"Sección","etiqueta":"Sección","obligatorio":true},{"claveOriginal":"Destacado","etiqueta":"Destacado","obligatorio":false}]'::jsonb),
  ('arq-catalogo', 'Catálogo', 'shirt-outline', 'grilla-foto', 'sistema', '[{"claveOriginal":"Nombre","etiqueta":"Nombre","obligatorio":true},{"claveOriginal":"Precio","etiqueta":"Precio","obligatorio":true},{"claveOriginal":"Sección","etiqueta":"Sección","obligatorio":false},{"claveOriginal":"Foto","etiqueta":"Foto","obligatorio":false},{"claveOriginal":"Destacado","etiqueta":"Destacado","obligatorio":false}]'::jsonb),
  ('arq-servicios', 'Servicios', 'briefcase-outline', 'lista-simple', 'sistema', '[{"claveOriginal":"Nombre","etiqueta":"Nombre","obligatorio":true},{"claveOriginal":"Detalle","etiqueta":"Detalle","obligatorio":false},{"claveOriginal":"Precio","etiqueta":"Precio","obligatorio":true}]'::jsonb),
  ('arq-rubros', 'Rubros', 'apps-outline', 'chips', 'sistema', '[{"claveOriginal":"Nombre","etiqueta":"Nombre","obligatorio":true}]'::jsonb),
  ('arq-ofertas', 'Ofertas', 'cart-outline', 'carrusel-descuento', 'sistema', '[{"claveOriginal":"Nombre","etiqueta":"Nombre","obligatorio":true},{"claveOriginal":"Precio","etiqueta":"Precio","obligatorio":true},{"claveOriginal":"Precio anterior","etiqueta":"Precio anterior","obligatorio":false},{"claveOriginal":"Etiqueta","etiqueta":"Etiqueta","obligatorio":false}]'::jsonb),
  ('arq-consultorias', 'Consultorías', 'medical-outline', 'ficha-perfil', 'personalizado', '[{"claveOriginal":"Foto","etiqueta":"Foto","obligatorio":false},{"claveOriginal":"Especialidad","etiqueta":"Especialidad","obligatorio":true},{"claveOriginal":"Tarifa","etiqueta":"Tarifa","obligatorio":true},{"claveOriginal":"Disponible ahora","etiqueta":"Disponible ahora","obligatorio":false}]'::jsonb);

INSERT INTO categorias (id, padre_id, nombre, slug, icono, orden, arquetipo_ficha, arquetipo_id) VALUES
  ('cat-comida', NULL, 'Comida', 'comida', 'restaurant-outline', 1, 'menu', 'arq-menu'),
  ('cat-salud', NULL, 'Salud', 'salud', 'medkit-outline', 2, 'servicios', 'arq-servicios'),
  ('cat-hogar', NULL, 'Hogar', 'hogar', 'construct-outline', 3, 'categorias', 'arq-rubros'),
  ('cat-moda', NULL, 'Moda', 'moda', 'shirt-outline', 4, 'catalogo', 'arq-catalogo'),
  ('cat-servicios', NULL, 'Servicios', 'servicios', 'briefcase-outline', 5, 'servicios', 'arq-servicios'),
  ('cat-mascotas', NULL, 'Mascotas', 'mascotas', 'paw-outline', 6, 'servicios', 'arq-servicios'),
  ('cat-restaurantes', NULL, 'Restaurantes', 'restaurantes', 'restaurant-outline', 7, 'menu', 'arq-menu'),
  ('cat-supermercado', NULL, 'Supermercados', 'supermercados', 'cart-outline', 8, 'ofertas', 'arq-ofertas'),
  ('cat-emprendimientos', NULL, 'Emprendimientos', 'emprendimientos', 'storefront-outline', 9, NULL, NULL),
  ('cat-rescate-animal', NULL, 'Rescate animal', 'rescate-animal', 'paw-outline', 10, 'servicios', 'arq-servicios'),
  ('cat-turismo', NULL, 'Turismo', 'turismo', 'airplane-outline', 11, 'catalogo', 'arq-catalogo'),
  ('cat-inmobiliaria', NULL, 'Inmobiliaria', 'inmobiliaria', 'business-outline', 12, 'catalogo', 'arq-catalogo'),
  ('cat-consultorias', NULL, 'Consultorías', 'consultorias', 'medical-outline', 13, NULL, 'arq-consultorias'),
  ('cat-otros-servicios', NULL, 'Otros servicios', 'otros-servicios', 'apps-outline', 14, 'servicios', 'arq-servicios');

INSERT INTO negocios (id, comunidad_id, distrito_ubigeo, nombre, descripcion, coordenada, direccion, telefono, whatsapp, horarios, estado, verificado_en, validado_por_cuenta_id, motivo_rechazo, fuente, creado_en, actualizado_en, ofertas) VALUES
  ('neg-panaderia-rosales', 'com-san-borja', '150140', 'Panadería Los Rosales', 'Pan artesanal, pastelería y desayunos desde 1998.', ST_SetSRID(ST_MakePoint(-76.9982, -12.1064), 4326)::geography, 'Av. Los Rosales 345, San Borja', '014753210', '51987654321', '{"lunes":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"martes":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"miercoles":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"jueves":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"viernes":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"sabado":{"cerrado":false,"abre":"06:00","cierra":"20:00"},"domingo":{"cerrado":true}}'::jsonb, 'activo', '2026-07-15', 'cuenta-validadora-rocio', NULL, 'carga_manual_piloto', '2026-07-01T00:00:00.000Z', '2026-07-15T00:00:00.000Z', NULL),
  ('neg-restaurante-fogon', 'com-san-borja', '150140', 'El Fogón Sanborjino', 'Comida criolla y parrillas, menú y carta a la carta.', ST_SetSRID(ST_MakePoint(-77.0002, -12.1041), 4326)::geography, 'Av. Guardia Civil 235, San Borja', NULL, '51944556677', '{"lunes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"martes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"miercoles":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"jueves":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"viernes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"sabado":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"domingo":{"cerrado":true}}'::jsonb, 'por_verificar', '2026-08-10', NULL, NULL, 'carga_manual_piloto', '2026-08-01T00:00:00.000Z', '2026-08-27T09:40:00.000Z', '[{"nombre":"Parrilla mixta","precio":32,"precioOriginal":38,"etiqueta":"-15%"}]'::jsonb),
  ('neg-tejidos-andinos', 'com-san-borja', '150140', 'Tejidos Andinos SB', 'Emprendimiento vecinal de chompas y accesorios tejidos a mano.', ST_SetSRID(ST_MakePoint(-76.9989, -12.1009), 4326)::geography, 'Jr. Los Claveles 88, San Borja', NULL, '51922114455', '{"lunes":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"martes":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"miercoles":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"jueves":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"viernes":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"sabado":{"cerrado":false,"abre":"11:00","cierra":"18:00"},"domingo":{"cerrado":true}}'::jsonb, 'por_verificar', NULL, 'cuenta-validadora-rocio', 'El horario de sábado no coincide con lo confirmado por teléfono, verificar antes de reenviar.', 'reportado_por_vecino', '2026-08-15T00:00:00.000Z', '2026-08-27T09:40:00.000Z', NULL),
  ('neg-veterinaria-aviacion', 'com-san-borja', '150140', 'Veterinaria Aviación', 'Consulta, vacunas y peluquería canina y felina.', ST_SetSRID(ST_MakePoint(-76.9971, -12.1032), 4326)::geography, 'Av. Aviación 4210, San Borja', NULL, '51981122334', '{"lunes":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"martes":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"miercoles":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"jueves":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"viernes":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"sabado":{"cerrado":false,"abre":"09:00","cierra":"19:00"},"domingo":{"cerrado":true}}'::jsonb, 'activo', '2026-07-20', 'cuenta-validadora-rocio', NULL, 'carga_manual_piloto', '2026-07-01T00:00:00.000Z', '2026-07-20T00:00:00.000Z', NULL),
  ('neg-supermercado-sb', 'com-san-borja', '150140', 'Supermercado San Borja', 'Abarrotes, frutas, verduras y productos de limpieza.', ST_SetSRID(ST_MakePoint(-76.9958, -12.1078), 4326)::geography, 'Av. Angamos Este 2050, San Borja', '014761234', NULL, '{"lunes":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"martes":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"miercoles":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"jueves":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"viernes":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"sabado":{"cerrado":false,"abre":"08:00","cierra":"22:00"},"domingo":{"cerrado":true}}'::jsonb, 'activo', '2026-08-05', 'cuenta-super-admin', NULL, 'carga_manual_piloto', '2026-08-01T00:00:00.000Z', '2026-08-05T00:00:00.000Z', NULL),
  ('neg-postres-herminia', 'com-san-borja', '150140', 'Postres Doña Herminia', 'Emprendimiento vecinal de tortas y postres por encargo.', ST_SetSRID(ST_MakePoint(-77.0028, -12.1023), 4326)::geography, 'Calle Las Camelias 145, San Borja', NULL, '51933221144', '{"lunes":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"martes":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"miercoles":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"jueves":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"viernes":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"sabado":{"cerrado":false,"abre":"10:00","cierra":"19:00"},"domingo":{"cerrado":true}}'::jsonb, 'inactivo', NULL, 'cuenta-validadora-rocio', 'Las fotos no muestran claramente el local. Sube una foto real del punto de venta y vuelve a enviarlo.', 'reportado_por_vecino', '2026-08-27T08:15:00.000Z', '2026-08-28T10:20:00.000Z', NULL),
  ('neg-cafe-malecon', 'com-miraflores', '150122', 'Café del Malecón', 'Cafetería con vista al mar, especialidad en repostería y café de origen peruano.', ST_SetSRID(ST_MakePoint(-77.031, -12.1291), 4326)::geography, 'Malecón de la Reserva 610, Miraflores', NULL, '51955667788', '{"lunes":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"martes":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"miercoles":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"jueves":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"viernes":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"sabado":{"cerrado":false,"abre":"08:00","cierra":"21:00"},"domingo":{"cerrado":true}}'::jsonb, 'por_verificar', NULL, NULL, NULL, 'carga_manual_piloto', '2026-08-29T09:00:00.000Z', '2026-08-29T09:00:00.000Z', NULL),
  ('neg-polleria-surco', 'com-surco', '150141', 'Pollería El Rancho de Surco', 'Pollo a la brasa y parrillas familiares, con más de 20 años en el distrito.', ST_SetSRID(ST_MakePoint(-76.9942, -12.1367), 4326)::geography, 'Av. Caminos del Inca 2340, Surco', NULL, '51966778899', '{"lunes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"martes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"miercoles":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"jueves":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"viernes":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"sabado":{"cerrado":false,"abre":"12:00","cierra":"22:00"},"domingo":{"cerrado":true}}'::jsonb, 'por_verificar', NULL, NULL, NULL, 'carga_manual_piloto', '2026-08-31T09:30:00.000Z', '2026-08-31T09:30:00.000Z', NULL),
  ('neg-ferreteria-surquillo', 'com-surquillo', '150142', 'Ferretería Surquillo Central', 'Herramientas, pinturas y materiales de construcción para el hogar.', ST_SetSRID(ST_MakePoint(-77.0136, -12.1149), 4326)::geography, 'Av. Angamos Este 1180, Surquillo', '014789900', NULL, '{"lunes":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"martes":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"miercoles":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"jueves":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"viernes":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"sabado":{"cerrado":false,"abre":"08:30","cierra":"19:00"},"domingo":{"cerrado":true}}'::jsonb, 'por_verificar', NULL, NULL, NULL, 'carga_manual_piloto', '2026-08-31T10:00:00.000Z', '2026-08-31T10:00:00.000Z', NULL);

INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES
  ('neg-panaderia-rosales', 'cat-comida'),
  ('neg-restaurante-fogon', 'cat-restaurantes'),
  ('neg-restaurante-fogon', 'cat-comida'),
  ('neg-tejidos-andinos', 'cat-emprendimientos'),
  ('neg-tejidos-andinos', 'cat-moda'),
  ('neg-veterinaria-aviacion', 'cat-mascotas'),
  ('neg-veterinaria-aviacion', 'cat-salud'),
  ('neg-supermercado-sb', 'cat-supermercado'),
  ('neg-postres-herminia', 'cat-emprendimientos'),
  ('neg-cafe-malecon', 'cat-comida'),
  ('neg-polleria-surco', 'cat-restaurantes'),
  ('neg-ferreteria-surquillo', 'cat-hogar');

INSERT INTO productos (id, negocio_id, nombre, descripcion, precio, categoria_menu, destacado) VALUES
  ('prod-fogon-lomo-saltado', 'neg-restaurante-fogon', 'Lomo saltado', 'Con papas fritas, arroz y ensalada criolla.', 28, 'Platos de fondo', true),
  ('prod-fogon-aji-gallina', 'neg-restaurante-fogon', 'Ají de gallina', 'Pollo deshilachado en crema de ají amarillo, con arroz y papa.', 24, 'Platos de fondo', false),
  ('prod-fogon-parrilla-mixta', 'neg-restaurante-fogon', 'Parrilla mixta (2 personas)', 'Bife, chorizo, anticucho y pollo a la brasa, con guarniciones.', 68, 'Parrillas', true),
  ('prod-fogon-anticuchos', 'neg-restaurante-fogon', 'Anticuchos (porción)', 'Corazón de res a la parrilla con papa dorada y choclo.', 20, 'Parrillas', false);

INSERT INTO cuenta_negocios (cuenta_id, negocio_id) VALUES
  ('cuenta-dueno-fogon', 'neg-restaurante-fogon'),
  ('cuenta-dueno-fogon', 'neg-postres-herminia');

INSERT INTO avisos (id, comunidad_id, fuente_nombre, fuente_verificada, titulo, cuerpo, categoria, estado, creado_por_cuenta_id, validado_por_cuenta_id, motivo_rechazo, publicado_en, imagen_url, me_gusta, compartidos) VALUES
  ('aviso-corte-agua', 'com-san-borja', 'Sedapal', true, 'Corte de agua programado', 'Sedapal informa corte de agua el jueves 28 de agosto de 9:00 a 17:00 en las cuadras 20-24 de Av. San Luis por mantenimiento de la red.', 'municipal', 'publicado', 'cuenta-super-admin', 'cuenta-super-admin', NULL, '2026-08-24T00:00:00.000Z', NULL, 12, 5),
  ('aviso-reunion-sector4', 'com-san-borja', 'Junta Vecinal SB', false, 'Reunión extraordinaria — Sector 4', 'Este jueves 3 de septiembre, 7:00 p.m., local comunal. Se tratará seguridad del sector.', 'junta_vecinal', 'pendiente', 'cuenta-junta-sb', NULL, NULL, '2026-08-27T16:00:00.000Z', NULL, 0, 0),
  ('aviso-poda-arboles', 'com-san-borja', 'Junta Vecinal SB', false, 'Campaña de poda de árboles', 'La municipalidad podará árboles en Av. San Luis la próxima semana.', 'municipal', 'rechazado', 'cuenta-junta-sb', 'cuenta-validadora-rocio', 'Falta la fecha exacta — vuelve a enviarlo con el día y horario.', '2026-08-26T11:00:00.000Z', NULL, 0, 0),
  ('aviso-seguridad', 'com-san-borja', 'Serenazgo San Borja', true, 'Refuerzo de serenazgo en zona norte', 'Serenazgo aumentó las rondas nocturnas entre Av. Aviación y Av. Angamos Este tras reportes de vecinos.', 'seguridad', 'publicado', 'cuenta-super-admin', 'cuenta-super-admin', NULL, '2026-08-20T00:00:00.000Z', NULL, 21, 9),
  ('aviso-parque-kennedy', 'com-miraflores', 'Junta Vecinal Miraflores', false, 'Mantenimiento del Parque Kennedy', 'Este fin de semana se realizará poda y riego en el Parque Kennedy — algunas áreas quedarán cercadas temporalmente.', 'municipal', 'pendiente', 'cuenta-junta-miraflores', NULL, NULL, '2026-08-29T14:00:00.000Z', NULL, 0, 0),
  ('aviso-via-expresa-surco', 'com-surco', 'Junta Vecinal Surco', false, 'Cierre parcial de Caminos del Inca', 'Por trabajos de asfaltado, un carril de Av. Caminos del Inca estará cerrado este viernes de 10pm a 5am.', 'municipal', 'pendiente', 'cuenta-junta-surco', NULL, NULL, '2026-08-31T11:00:00.000Z', NULL, 0, 0),
  ('aviso-feria-surquillo', 'com-surquillo', 'Junta Vecinal Surquillo', false, 'Feria de emprendedores este sábado', 'Este sábado de 9am a 2pm, feria de emprendedores vecinales en la plaza principal de Surquillo.', 'junta_vecinal', 'pendiente', 'cuenta-junta-surquillo', NULL, NULL, '2026-08-31T12:30:00.000Z', NULL, 0, 0);

INSERT INTO usuarios_app (id, nombre, apellido, correo, password_hash, telefono, comunidad_id, estado, registrado_en, ultimo_acceso_en) VALUES
  ('usr-carla-mendez', 'Carla', 'Méndez', 'carla.mendez@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987001122', 'com-san-borja', 'activo', '2026-08-05T14:20:00.000Z', '2026-08-30T09:10:00.000Z'),
  ('usr-jorge-paredes', 'Jorge', 'Paredes', 'jorge.paredes@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987002233', 'com-san-borja', 'activo', '2026-08-07T10:05:00.000Z', '2026-08-29T18:40:00.000Z'),
  ('usr-lucia-flores', 'Lucía', 'Flores', 'lucia.flores@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987003344', 'com-san-borja', 'activo', '2026-08-10T08:00:00.000Z', '2026-08-30T07:55:00.000Z'),
  ('usr-renzo-huaman', 'Renzo', 'Huamán', 'renzo.huaman@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987004455', 'com-san-borja', 'bloqueado', '2026-08-12T19:30:00.000Z', '2026-08-18T12:00:00.000Z'),
  ('usr-daniela-rios', 'Daniela', 'Ríos', 'daniela.rios@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987005566', 'com-miraflores', 'activo', '2026-08-20T15:45:00.000Z', '2026-08-30T11:20:00.000Z'),
  ('usr-martin-solis', 'Martín', 'Solís', 'martin.solis@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987006677', 'com-miraflores', 'activo', '2026-08-25T09:15:00.000Z', '2026-08-29T20:05:00.000Z'),
  ('usr-fabiola-castro', 'Fabiola', 'Castro', 'fabiola.castro@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987007788', 'com-surco', 'activo', '2026-08-28T13:00:00.000Z', '2026-08-31T08:30:00.000Z'),
  ('usr-hugo-ninanya', 'Hugo', 'Ninanya', 'hugo.ninanya@vecino.demo', '$2a$10$/bzv4sj8IDGIazIEVDzysen9TRLlp4iPAQ3RTHgH1/zdj8iuSkbx2', '51987008899', 'com-surquillo', 'activo', '2026-08-29T17:10:00.000Z', '2026-08-31T09:45:00.000Z');

INSERT INTO anuncios (id, nombre, detalle, imagen_url, ubicaciones, negocio_id, fecha_inicio, fecha_fin, orden, activo) VALUES
  ('ad-fogon', '20% en parrillas — El Fogón', '20% en parrillas todos los martes', NULL, ARRAY['carrusel_inicio']::ubicacion_anuncio[], 'neg-restaurante-fogon', '2026-08-01', '2026-09-30', 1, true),
  ('ad-supermercado', '2x1 en lácteos — Supermercado SB', '2x1 en lácteos esta semana', NULL, ARRAY['carrusel_inicio', 'banner_buscar']::ubicacion_anuncio[], 'neg-supermercado-sb', '2026-08-15', '2026-09-05', 2, true),
  ('ad-herminia', 'Torta por encargo — Doña Herminia', 'Encarga tu torta con 48h de anticipo', NULL, ARRAY['banner_buscar']::ubicacion_anuncio[], 'neg-postres-herminia', '2026-10-01', NULL, 3, true);

INSERT INTO novedades (id, titulo, texto, publicado_en, activo) VALUES
  ('nov-horario-completo', 'Ahora puedes ver el horario completo', 'Toca "Ver horario completo" en cualquier negocio para ver sus 7 días.', '2026-08-20T00:00:00.000Z', true),
  ('nov-comunidad-muro', 'Comunidad ahora es un muro social', 'Avisos con reacciones y opción de compartir, todo en un solo lugar.', '2026-08-15T00:00:00.000Z', true);

INSERT INTO profesionales (id, comunidad_id, tipo, nombre, colegiatura_numero, colegiatura_entidad, colegiatura_verificada_en, especialidad, whatsapp, direccion_consultorio, coordenada, activo) VALUES
  ('prof-medico-castaneda', 'com-san-borja', 'medico', 'Dra. Rosa Castañeda', 'CMP 45021', 'Colegio Médico del Perú', '2026-07-10T00:00:00.000Z', 'Medicina general', '51987112233', 'Av. San Luis 2100, San Borja', ST_SetSRID(ST_MakePoint(-76.9995, -12.1049), 4326)::geography, true),
  ('prof-veterinario-quispe', 'com-san-borja', 'veterinario', 'Dr. Luis Quispe', 'CMVP 8834', 'Colegio Médico Veterinario del Perú', NULL, 'Animales menores', '51987223344', 'Av. Aviación 4180, San Borja', ST_SetSRID(ST_MakePoint(-76.9968, -12.103), 4326)::geography, true),
  ('prof-contador-farfan', 'com-san-borja', 'legal_contable', 'CPC Jorge Farfán', 'CCPL 12045', 'Colegio de Contadores Públicos de Lima', '2026-06-15T00:00:00.000Z', 'Tributación para pequeños negocios', '51987334455', 'Jr. Los Claveles 210, San Borja', ST_SetSRID(ST_MakePoint(-77.0005, -12.1015), 4326)::geography, true),
  ('prof-medico-injante', 'com-miraflores', 'medico', 'Dr. Pablo Injante', 'CMP 51290', 'Colegio Médico del Perú', NULL, 'Pediatría', '51987445566', 'Av. Larco 890, Miraflores', ST_SetSRID(ST_MakePoint(-77.0295, -12.1225), 4326)::geography, true),
  ('prof-abogado-tello', 'com-surco', 'legal_contable', 'Abg. Claudia Tello', 'CAL 78412', 'Colegio de Abogados de Lima', '2026-08-01T00:00:00.000Z', 'Derecho de familia', '51987556677', 'Av. Caminos del Inca 1980, Surco', ST_SetSRID(ST_MakePoint(-76.9935, -12.137), 4326)::geography, true),
  ('prof-veterinario-rojas', 'com-surquillo', 'veterinario', 'Dra. Milagros Rojas', 'CMVP 9021', 'Colegio Médico Veterinario del Perú', NULL, 'Cirugía de mascotas', '51987667788', 'Av. Angamos Este 1150, Surquillo', ST_SetSRID(ST_MakePoint(-77.0142, -12.1152), 4326)::geography, true);
