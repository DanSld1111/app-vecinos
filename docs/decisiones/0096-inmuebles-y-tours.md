# 0096 — Fichas Inmuebles y Tours

## Contexto

Inmobiliaria y Turismo usaban la ficha «catálogo» (una grilla de productos con foto y precio).
No alcanzaba: un inmueble se lee por dormitorios, baños y m², se filtra por Venta/Alquiler y
necesita varias fotos; un tour se elige por fecha de salida, cupos, itinerario y qué incluye.

## Decisión

- **Datos (migración 0036)**: `productos.fotos` (hasta 9 fotos extra además de la portada) y
  `productos.detalle` (JSONB: `salidas` con fecha/hora/cupos, `itinerario`, `incluye`,
  `noIncluye`, `puntoEncuentro`, `cancelacion`). Las fichas `inmuebles` y `tours` entran en los
  CHECK de `servicios_app` y `categorias`.
- **Campos configurables**: dos tipos nuevos — `numero` (con `unidad` opcional: m², personas) y
  `varias` (se marcan varias opciones; se guardan separadas por `|`). Hasta 16 campos.
- **Ficha Inmuebles (app)**: el primer campo con filtro va en botones grandes (Venta / Alquiler),
  el segundo en chips (tipo de inmueble). Tarjeta grande con fotos, precio (con `/mes` si es
  alquiler, precio por m² si es venta) y "3 dormitorios · 2 baños · 120 m²". Detalle a pantalla
  completa con galería, cuadros de números, características y WhatsApp ("Agendar visita" /
  "Consultar").
- **Ficha Tours (app)**: filas con foto, tipo, duración, próxima salida, precio por persona y
  cupos ("Quedan 3 cupos"). Detalle con fechas elegibles, itinerario, incluye/no incluye, punto
  de recojo, cancelación, selector de personas con total y "Reservar por WhatsApp" con fecha,
  hora y personas en el mensaje.
- **Pantalla Turismo**: en vez de la lista de agencias abre con las próximas salidas de todas
  ellas (`GET /negocios/tours?comunidadId`), con buscador, tipo de tour, "cuándo" (fin de semana,
  7 días, este mes) y destacados. "Ver todas las agencias" lleva al listado de siempre
  (`/servicios/turismo?vista=agencias`). Sin tours cargados, se muestra directamente el listado.
- **Panel**: el formulario del producto suma "Más fotos", los campos Número/Varias y, en tours,
  fechas de salida, itinerario, incluye/no incluye, punto de recojo y cancelación.
- **Configuración en producción**: Inmobiliaria → ficha `inmuebles` con Operación, Tipo de
  inmueble, Dormitorios, Baños, Área construida (m²), Área de terreno (m²), Cocheras, Pisos,
  Características y Referencia. Turismo → ficha `tours` con Tipo de tour, Duración, Grupo máximo
  (personas), Idioma y la antigua "Salida" oculta (la hora ahora va en cada fecha).
