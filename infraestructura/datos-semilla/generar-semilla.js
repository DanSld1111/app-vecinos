// Genera infraestructura/datos-semilla/0001_piloto.sql a partir de los mismos datos de
// ejemplo que ya usa apps/admin/src/datos/mock/*.ts — no inventa contenido nuevo, solo lo
// traduce a INSERTs. Se corre una sola vez (o cada vez que el mock cambie); el .sql generado
// es lo que se versiona y se aplica a la base.
//
// Uso: node infraestructura/datos-semilla/generar-semilla.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

function esc(valor) {
  if (valor === null || valor === undefined) return "NULL";
  if (typeof valor === "number") return String(valor);
  if (typeof valor === "boolean") return valor ? "true" : "false";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function jsonb(valor) {
  return valor === null || valor === undefined ? "NULL" : `'${JSON.stringify(valor).replace(/'/g, "''")}'::jsonb`;
}

function textArray(valores) {
  if (!valores || valores.length === 0) return "'{}'";
  return `ARRAY[${valores.map((v) => esc(v)).join(", ")}]`;
}

function punto(lat, lng) {
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

function insert(tabla, columnas, filas) {
  if (filas.length === 0) return `-- ${tabla}: sin datos de ejemplo\n`;
  const valores = filas.map((f) => `  (${f.join(", ")})`).join(",\n");
  return `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES\n${valores};\n`;
}

// ---- Geografía: solo Lima y los 4 distritos piloto ya usados en la app. ----
// El catálogo UBIGEO completo (1874 distritos) queda pendiente: requiere una fuente
// oficial (INEI) y no corresponde fabricar los 1870 restantes con datos inventados.
const departamentos = [{ ubigeo: "15", nombre: "Lima", activo: true }];
const provincias = [{ ubigeo: "1501", departamentoUbigeo: "15", nombre: "Lima", activo: true }];
const distritos = [
  { ubigeo: "150140", provinciaUbigeo: "1501", nombre: "San Borja", centro: { lat: -12.1055, lng: -77.0 }, activo: true },
  { ubigeo: "150122", provinciaUbigeo: "1501", nombre: "Miraflores", centro: { lat: -12.1211, lng: -77.0282 }, activo: true },
  { ubigeo: "150141", provinciaUbigeo: "1501", nombre: "Surco", centro: { lat: -12.1352, lng: -76.9927 }, activo: true },
  { ubigeo: "150142", provinciaUbigeo: "1501", nombre: "Surquillo", centro: { lat: -12.1145, lng: -77.0158 }, activo: true },
];
const comunidades = [
  { id: "com-san-borja", distritoUbigeo: "150140", nombre: "San Borja", slug: "san-borja", centro: { lat: -12.1055, lng: -77.0 }, descripcion: "San Borja es un distrito residencial de Lima conocido por sus áreas verdes, seguridad y cercanía a centros culturales y deportivos.", activo: true, fechaLanzamiento: "2026-09-01" },
  { id: "com-miraflores", distritoUbigeo: "150122", nombre: "Miraflores", slug: "miraflores", centro: { lat: -12.1211, lng: -77.0282 }, descripcion: "Miraflores es un distrito costero de Lima, conocido por el Malecón, sus parques y su intensa actividad comercial y turística.", activo: true, fechaLanzamiento: "2026-09-15" },
  { id: "com-surco", distritoUbigeo: "150141", nombre: "Surco", slug: "surco", centro: { lat: -12.1352, lng: -76.9927 }, descripcion: "Santiago de Surco es uno de los distritos más extensos de Lima, con zonas residenciales, comerciales y parques como el Parque de la Amistad.", activo: true, fechaLanzamiento: "2026-09-20" },
  { id: "com-surquillo", distritoUbigeo: "150142", nombre: "Surquillo", slug: "surquillo", centro: { lat: -12.1145, lng: -77.0158 }, descripcion: "Surquillo es un distrito pequeño y muy comercial de Lima, conocido por su mercado mayorista y su ubicación central entre Miraflores y San Borja.", activo: true, fechaLanzamiento: "2026-09-20" },
];

// ---- Cuentas del panel (mismas de apps/admin/src/datos/mock/cuentas.mock.ts) ----
const credencialesDemo = {
  "admin@elisur.com": "admin123",
  "dueno@elisur.com": "negocio123",
  "junta@elisur.com": "junta123",
  "validador@elisur.com": "validar123",
  "juntavecinal@miraflores.pe": "junta123",
  "validador@miraflores.pe": "validar123",
  "juntavecinal@surco.pe": "junta123",
  "validador@surco.pe": "validar123",
  "juntavecinal@surquillo.pe": "junta123",
  "validador@surquillo.pe": "validar123",
};
const cuentas = [
  { id: "cuenta-super-admin", nombre: "Equipo ELISUR", correo: "admin@elisur.com", rol: "super_admin", negocioIds: [], distritosAsignados: [], activo: true, creadoEn: "2026-07-01T00:00:00.000Z" },
  { id: "cuenta-dueno-fogon", nombre: "María Quispe", correo: "dueno@elisur.com", rol: "dueno_negocio", negocioIds: ["neg-restaurante-fogon", "neg-postres-herminia"], distritosAsignados: [], activo: true, creadoEn: "2026-08-01T00:00:00.000Z" },
  { id: "cuenta-junta-sb", nombre: "Junta Vecinal SB", correo: "junta@elisur.com", rol: "junta_vecinal", negocioIds: [], distritosAsignados: ["150140"], activo: true, creadoEn: "2026-08-01T00:00:00.000Z" },
  { id: "cuenta-validadora-rocio", nombre: "Rocío Salas", correo: "validador@elisur.com", rol: "validador_contenido", negocioIds: [], distritosAsignados: ["150140"], activo: true, creadoEn: "2026-08-01T00:00:00.000Z" },
  { id: "cuenta-junta-miraflores", nombre: "Junta Vecinal Miraflores", correo: "juntavecinal@miraflores.pe", rol: "junta_vecinal", negocioIds: [], distritosAsignados: ["150122"], activo: true, creadoEn: "2026-08-29T00:00:00.000Z" },
  { id: "cuenta-validador-miraflores", nombre: "Javier Ortega", correo: "validador@miraflores.pe", rol: "validador_contenido", negocioIds: [], distritosAsignados: ["150122"], activo: true, creadoEn: "2026-08-29T00:00:00.000Z" },
  { id: "cuenta-junta-surco", nombre: "Junta Vecinal Surco", correo: "juntavecinal@surco.pe", rol: "junta_vecinal", negocioIds: [], distritosAsignados: ["150141"], activo: true, creadoEn: "2026-08-31T00:00:00.000Z" },
  { id: "cuenta-validador-surco", nombre: "Patricia Vega", correo: "validador@surco.pe", rol: "validador_contenido", negocioIds: [], distritosAsignados: ["150141"], activo: true, creadoEn: "2026-08-31T00:00:00.000Z" },
  { id: "cuenta-junta-surquillo", nombre: "Junta Vecinal Surquillo", correo: "juntavecinal@surquillo.pe", rol: "junta_vecinal", negocioIds: [], distritosAsignados: ["150142"], activo: true, creadoEn: "2026-08-31T00:00:00.000Z" },
  { id: "cuenta-validador-surquillo", nombre: "Diego Ramos", correo: "validador@surquillo.pe", rol: "validador_contenido", negocioIds: [], distritosAsignados: ["150142"], activo: true, creadoEn: "2026-08-31T00:00:00.000Z" },
];

// ---- Plantillas visuales y arquetipos (apps/admin/src/datos/plantillasVisuales.ts y datos/mock/arquetipos.mock.ts) ----
const plantillas = [
  { id: "lista-simple", nombre: "Lista simple", modo: "lista", origen: "sistema", descripcionUso: "El mismo diseño que ya usa hoy el arquetipo Servicios — sin foto, sin destacado.", camposEsperados: [{ etiqueta: "Nombre", tipo: "texto", obligatorio: true }, { etiqueta: "Detalle", tipo: "texto_largo", obligatorio: false }, { etiqueta: "Precio", tipo: "precio", obligatorio: true }] },
  { id: "grilla-foto", nombre: "Grilla con foto", modo: "lista", origen: "sistema", descripcionUso: "El mismo diseño que ya usa hoy el arquetipo Catálogo — grilla de 2 columnas con foto y precio.", camposEsperados: [{ etiqueta: "Nombre", tipo: "texto", obligatorio: true }, { etiqueta: "Precio", tipo: "precio", obligatorio: true }, { etiqueta: "Sección", tipo: "texto", obligatorio: false }, { etiqueta: "Foto", tipo: "foto", obligatorio: false }, { etiqueta: "Destacado", tipo: "booleano", obligatorio: false }] },
  { id: "lista-agrupada", nombre: "Lista agrupada por sección", modo: "lista", origen: "sistema", descripcionUso: "El mismo diseño que ya usa hoy el arquetipo Menú — secciones con insignia \"Más pedido\".", camposEsperados: [{ etiqueta: "Nombre", tipo: "texto", obligatorio: true }, { etiqueta: "Precio", tipo: "precio", obligatorio: true }, { etiqueta: "Sección", tipo: "texto", obligatorio: true }, { etiqueta: "Destacado", tipo: "booleano", obligatorio: false }] },
  { id: "chips", nombre: "Chips", modo: "lista", origen: "sistema", descripcionUso: "El mismo diseño que ya usa hoy el arquetipo Rubros — etiquetas sueltas, sin precio.", camposEsperados: [{ etiqueta: "Nombre", tipo: "texto", obligatorio: true }] },
  { id: "carrusel-descuento", nombre: "Carrusel con descuento", modo: "lista", origen: "sistema", descripcionUso: "El mismo diseño que ya usa hoy el arquetipo Ofertas — carrusel horizontal con cinta de descuento.", camposEsperados: [{ etiqueta: "Nombre", tipo: "texto", obligatorio: true }, { etiqueta: "Precio", tipo: "precio", obligatorio: true }, { etiqueta: "Precio anterior", tipo: "precio", obligatorio: false }, { etiqueta: "Etiqueta", tipo: "texto", obligatorio: false }] },
  { id: "ficha-perfil", nombre: "Ficha de perfil", modo: "unico", origen: "nueva", descripcionUso: "Ideal para Consultorías y profesionales independientes — foto, especialidad y tarifa.", camposEsperados: [{ etiqueta: "Foto", tipo: "foto", obligatorio: false }, { etiqueta: "Especialidad", tipo: "texto", obligatorio: true }, { etiqueta: "Tarifa", tipo: "precio", obligatorio: true }, { etiqueta: "Disponible ahora", tipo: "booleano", obligatorio: false }] },
];
const arquetipos = [
  { id: "arq-menu", nombre: "Menú", icono: "restaurant-outline", plantillaId: "lista-agrupada", origen: "sistema", campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }, { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true }, { claveOriginal: "Sección", etiqueta: "Sección", obligatorio: true }, { claveOriginal: "Destacado", etiqueta: "Destacado", obligatorio: false }] },
  { id: "arq-catalogo", nombre: "Catálogo", icono: "shirt-outline", plantillaId: "grilla-foto", origen: "sistema", campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }, { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true }, { claveOriginal: "Sección", etiqueta: "Sección", obligatorio: false }, { claveOriginal: "Foto", etiqueta: "Foto", obligatorio: false }, { claveOriginal: "Destacado", etiqueta: "Destacado", obligatorio: false }] },
  { id: "arq-servicios", nombre: "Servicios", icono: "briefcase-outline", plantillaId: "lista-simple", origen: "sistema", campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }, { claveOriginal: "Detalle", etiqueta: "Detalle", obligatorio: false }, { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true }] },
  { id: "arq-rubros", nombre: "Rubros", icono: "apps-outline", plantillaId: "chips", origen: "sistema", campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }] },
  { id: "arq-ofertas", nombre: "Ofertas", icono: "cart-outline", plantillaId: "carrusel-descuento", origen: "sistema", campos: [{ claveOriginal: "Nombre", etiqueta: "Nombre", obligatorio: true }, { claveOriginal: "Precio", etiqueta: "Precio", obligatorio: true }, { claveOriginal: "Precio anterior", etiqueta: "Precio anterior", obligatorio: false }, { claveOriginal: "Etiqueta", etiqueta: "Etiqueta", obligatorio: false }] },
  { id: "arq-consultorias", nombre: "Consultorías", icono: "medical-outline", plantillaId: "ficha-perfil", origen: "personalizado", campos: [{ claveOriginal: "Foto", etiqueta: "Foto", obligatorio: false }, { claveOriginal: "Especialidad", etiqueta: "Especialidad", obligatorio: true }, { claveOriginal: "Tarifa", etiqueta: "Tarifa", obligatorio: true }, { claveOriginal: "Disponible ahora", etiqueta: "Disponible ahora", obligatorio: false }] },
];

// ---- Categorías (apps/admin/src/datos/mock/categorias.mock.ts) ----
const categorias = [
  { id: "cat-comida", padreId: null, nombre: "Comida", slug: "comida", icono: "restaurant-outline", orden: 1, arquetipoFicha: "menu", arquetipoId: "arq-menu" },
  { id: "cat-salud", padreId: null, nombre: "Salud", slug: "salud", icono: "medkit-outline", orden: 2, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-hogar", padreId: null, nombre: "Hogar", slug: "hogar", icono: "construct-outline", orden: 3, arquetipoFicha: "categorias", arquetipoId: "arq-rubros" },
  { id: "cat-moda", padreId: null, nombre: "Moda", slug: "moda", icono: "shirt-outline", orden: 4, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-servicios", padreId: null, nombre: "Servicios", slug: "servicios", icono: "briefcase-outline", orden: 5, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-mascotas", padreId: null, nombre: "Mascotas", slug: "mascotas", icono: "paw-outline", orden: 6, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-restaurantes", padreId: null, nombre: "Restaurantes", slug: "restaurantes", icono: "restaurant-outline", orden: 7, arquetipoFicha: "menu", arquetipoId: "arq-menu" },
  { id: "cat-supermercado", padreId: null, nombre: "Supermercados", slug: "supermercados", icono: "cart-outline", orden: 8, arquetipoFicha: "ofertas", arquetipoId: "arq-ofertas" },
  { id: "cat-emprendimientos", padreId: null, nombre: "Emprendimientos", slug: "emprendimientos", icono: "storefront-outline", orden: 9, arquetipoFicha: null, arquetipoId: null },
  { id: "cat-rescate-animal", padreId: null, nombre: "Rescate animal", slug: "rescate-animal", icono: "paw-outline", orden: 10, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
  { id: "cat-turismo", padreId: null, nombre: "Turismo", slug: "turismo", icono: "airplane-outline", orden: 11, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-inmobiliaria", padreId: null, nombre: "Inmobiliaria", slug: "inmobiliaria", icono: "business-outline", orden: 12, arquetipoFicha: "catalogo", arquetipoId: "arq-catalogo" },
  { id: "cat-consultorias", padreId: null, nombre: "Consultorías", slug: "consultorias", icono: "medical-outline", orden: 13, arquetipoFicha: null, arquetipoId: "arq-consultorias" },
  { id: "cat-otros-servicios", padreId: null, nombre: "Otros servicios", slug: "otros-servicios", icono: "apps-outline", orden: 14, arquetipoFicha: "servicios", arquetipoId: "arq-servicios" },
];

// ---- Negocios (apps/admin/src/datos/mock/negocios.mock.ts) ----
function horario(abre, cierra) {
  const dia = { cerrado: false, abre, cierra };
  return { lunes: dia, martes: dia, miercoles: dia, jueves: dia, viernes: dia, sabado: dia, domingo: { cerrado: true } };
}
const negocios = [
  { id: "neg-panaderia-rosales", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "Panadería Los Rosales", descripcion: "Pan artesanal, pastelería y desayunos desde 1998.", categoriaIds: ["cat-comida"], coordenada: { lat: -12.1064, lng: -76.9982 }, direccion: "Av. Los Rosales 345, San Borja", telefono: "014753210", whatsapp: "51987654321", horarios: horario("06:00", "20:00"), estado: "activo", verificadoEn: "2026-07-15", validadoPorCuentaId: "cuenta-validadora-rocio", motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-07-01T00:00:00.000Z", actualizadoEn: "2026-07-15T00:00:00.000Z" },
  { id: "neg-restaurante-fogon", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "El Fogón Sanborjino", descripcion: "Comida criolla y parrillas, menú y carta a la carta.", categoriaIds: ["cat-restaurantes", "cat-comida"], coordenada: { lat: -12.1041, lng: -77.0002 }, direccion: "Av. Guardia Civil 235, San Borja", telefono: null, whatsapp: "51944556677", horarios: horario("12:00", "22:00"), estado: "por_verificar", verificadoEn: "2026-08-10", validadoPorCuentaId: null, motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-08-01T00:00:00.000Z", actualizadoEn: "2026-08-27T09:40:00.000Z", ofertas: [{ nombre: "Parrilla mixta", precio: 32, precioOriginal: 38, etiqueta: "-15%" }] },
  { id: "neg-tejidos-andinos", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "Tejidos Andinos SB", descripcion: "Emprendimiento vecinal de chompas y accesorios tejidos a mano.", categoriaIds: ["cat-emprendimientos", "cat-moda"], coordenada: { lat: -12.1009, lng: -76.9989 }, direccion: "Jr. Los Claveles 88, San Borja", telefono: null, whatsapp: "51922114455", horarios: horario("11:00", "18:00"), estado: "por_verificar", verificadoEn: null, validadoPorCuentaId: "cuenta-validadora-rocio", motivoRechazo: "El horario de sábado no coincide con lo confirmado por teléfono, verificar antes de reenviar.", fuente: "reportado_por_vecino", creadoEn: "2026-08-15T00:00:00.000Z", actualizadoEn: "2026-08-27T09:40:00.000Z" },
  { id: "neg-veterinaria-aviacion", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "Veterinaria Aviación", descripcion: "Consulta, vacunas y peluquería canina y felina.", categoriaIds: ["cat-mascotas", "cat-salud"], coordenada: { lat: -12.1032, lng: -76.9971 }, direccion: "Av. Aviación 4210, San Borja", telefono: null, whatsapp: "51981122334", horarios: horario("09:00", "19:00"), estado: "activo", verificadoEn: "2026-07-20", validadoPorCuentaId: "cuenta-validadora-rocio", motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-07-01T00:00:00.000Z", actualizadoEn: "2026-07-20T00:00:00.000Z" },
  { id: "neg-supermercado-sb", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "Supermercado San Borja", descripcion: "Abarrotes, frutas, verduras y productos de limpieza.", categoriaIds: ["cat-supermercado"], coordenada: { lat: -12.1078, lng: -76.9958 }, direccion: "Av. Angamos Este 2050, San Borja", telefono: "014761234", whatsapp: null, horarios: horario("08:00", "22:00"), estado: "activo", verificadoEn: "2026-08-05", validadoPorCuentaId: "cuenta-super-admin", motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-08-01T00:00:00.000Z", actualizadoEn: "2026-08-05T00:00:00.000Z" },
  { id: "neg-postres-herminia", comunidadId: "com-san-borja", distritoUbigeo: "150140", nombre: "Postres Doña Herminia", descripcion: "Emprendimiento vecinal de tortas y postres por encargo.", categoriaIds: ["cat-emprendimientos"], coordenada: { lat: -12.1023, lng: -77.0028 }, direccion: "Calle Las Camelias 145, San Borja", telefono: null, whatsapp: "51933221144", horarios: horario("10:00", "19:00"), estado: "inactivo", verificadoEn: null, validadoPorCuentaId: "cuenta-validadora-rocio", motivoRechazo: "Las fotos no muestran claramente el local. Sube una foto real del punto de venta y vuelve a enviarlo.", fuente: "reportado_por_vecino", creadoEn: "2026-08-27T08:15:00.000Z", actualizadoEn: "2026-08-28T10:20:00.000Z" },
  { id: "neg-cafe-malecon", comunidadId: "com-miraflores", distritoUbigeo: "150122", nombre: "Café del Malecón", descripcion: "Cafetería con vista al mar, especialidad en repostería y café de origen peruano.", categoriaIds: ["cat-comida"], coordenada: { lat: -12.1291, lng: -77.031 }, direccion: "Malecón de la Reserva 610, Miraflores", telefono: null, whatsapp: "51955667788", horarios: horario("08:00", "21:00"), estado: "por_verificar", verificadoEn: null, validadoPorCuentaId: null, motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-08-29T09:00:00.000Z", actualizadoEn: "2026-08-29T09:00:00.000Z" },
  { id: "neg-polleria-surco", comunidadId: "com-surco", distritoUbigeo: "150141", nombre: "Pollería El Rancho de Surco", descripcion: "Pollo a la brasa y parrillas familiares, con más de 20 años en el distrito.", categoriaIds: ["cat-restaurantes"], coordenada: { lat: -12.1367, lng: -76.9942 }, direccion: "Av. Caminos del Inca 2340, Surco", telefono: null, whatsapp: "51966778899", horarios: horario("12:00", "22:00"), estado: "por_verificar", verificadoEn: null, validadoPorCuentaId: null, motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-08-31T09:30:00.000Z", actualizadoEn: "2026-08-31T09:30:00.000Z" },
  { id: "neg-ferreteria-surquillo", comunidadId: "com-surquillo", distritoUbigeo: "150142", nombre: "Ferretería Surquillo Central", descripcion: "Herramientas, pinturas y materiales de construcción para el hogar.", categoriaIds: ["cat-hogar"], coordenada: { lat: -12.1149, lng: -77.0136 }, direccion: "Av. Angamos Este 1180, Surquillo", telefono: "014789900", whatsapp: null, horarios: horario("08:30", "19:00"), estado: "por_verificar", verificadoEn: null, validadoPorCuentaId: null, motivoRechazo: null, fuente: "carga_manual_piloto", creadoEn: "2026-08-31T10:00:00.000Z", actualizadoEn: "2026-08-31T10:00:00.000Z" },
];

// ---- Avisos (apps/admin/src/datos/mock/avisos.mock.ts) ----
const avisos = [
  { id: "aviso-corte-agua", comunidadId: "com-san-borja", fuenteNombre: "Sedapal", fuenteVerificada: true, titulo: "Corte de agua programado", cuerpo: "Sedapal informa corte de agua el jueves 28 de agosto de 9:00 a 17:00 en las cuadras 20-24 de Av. San Luis por mantenimiento de la red.", categoria: "municipal", estado: "publicado", creadoPorCuentaId: "cuenta-super-admin", validadoPorCuentaId: "cuenta-super-admin", motivoRechazo: null, publicadoEn: "2026-08-24T00:00:00.000Z", imagenUrl: null, meGusta: 12, compartidos: 5 },
  { id: "aviso-reunion-sector4", comunidadId: "com-san-borja", fuenteNombre: "Junta Vecinal SB", fuenteVerificada: false, titulo: "Reunión extraordinaria — Sector 4", cuerpo: "Este jueves 3 de septiembre, 7:00 p.m., local comunal. Se tratará seguridad del sector.", categoria: "junta_vecinal", estado: "pendiente", creadoPorCuentaId: "cuenta-junta-sb", validadoPorCuentaId: null, motivoRechazo: null, publicadoEn: "2026-08-27T16:00:00.000Z", imagenUrl: null, meGusta: 0, compartidos: 0 },
  { id: "aviso-poda-arboles", comunidadId: "com-san-borja", fuenteNombre: "Junta Vecinal SB", fuenteVerificada: false, titulo: "Campaña de poda de árboles", cuerpo: "La municipalidad podará árboles en Av. San Luis la próxima semana.", categoria: "municipal", estado: "rechazado", creadoPorCuentaId: "cuenta-junta-sb", validadoPorCuentaId: "cuenta-validadora-rocio", motivoRechazo: "Falta la fecha exacta — vuelve a enviarlo con el día y horario.", publicadoEn: "2026-08-26T11:00:00.000Z", imagenUrl: null, meGusta: 0, compartidos: 0 },
  { id: "aviso-seguridad", comunidadId: "com-san-borja", fuenteNombre: "Serenazgo San Borja", fuenteVerificada: true, titulo: "Refuerzo de serenazgo en zona norte", cuerpo: "Serenazgo aumentó las rondas nocturnas entre Av. Aviación y Av. Angamos Este tras reportes de vecinos.", categoria: "seguridad", estado: "publicado", creadoPorCuentaId: "cuenta-super-admin", validadoPorCuentaId: "cuenta-super-admin", motivoRechazo: null, publicadoEn: "2026-08-20T00:00:00.000Z", imagenUrl: null, meGusta: 21, compartidos: 9 },
  { id: "aviso-parque-kennedy", comunidadId: "com-miraflores", fuenteNombre: "Junta Vecinal Miraflores", fuenteVerificada: false, titulo: "Mantenimiento del Parque Kennedy", cuerpo: "Este fin de semana se realizará poda y riego en el Parque Kennedy — algunas áreas quedarán cercadas temporalmente.", categoria: "municipal", estado: "pendiente", creadoPorCuentaId: "cuenta-junta-miraflores", validadoPorCuentaId: null, motivoRechazo: null, publicadoEn: "2026-08-29T14:00:00.000Z", imagenUrl: null, meGusta: 0, compartidos: 0 },
  { id: "aviso-via-expresa-surco", comunidadId: "com-surco", fuenteNombre: "Junta Vecinal Surco", fuenteVerificada: false, titulo: "Cierre parcial de Caminos del Inca", cuerpo: "Por trabajos de asfaltado, un carril de Av. Caminos del Inca estará cerrado este viernes de 10pm a 5am.", categoria: "municipal", estado: "pendiente", creadoPorCuentaId: "cuenta-junta-surco", validadoPorCuentaId: null, motivoRechazo: null, publicadoEn: "2026-08-31T11:00:00.000Z", imagenUrl: null, meGusta: 0, compartidos: 0 },
  { id: "aviso-feria-surquillo", comunidadId: "com-surquillo", fuenteNombre: "Junta Vecinal Surquillo", fuenteVerificada: false, titulo: "Feria de emprendedores este sábado", cuerpo: "Este sábado de 9am a 2pm, feria de emprendedores vecinales en la plaza principal de Surquillo.", categoria: "junta_vecinal", estado: "pendiente", creadoPorCuentaId: "cuenta-junta-surquillo", validadoPorCuentaId: null, motivoRechazo: null, publicadoEn: "2026-08-31T12:30:00.000Z", imagenUrl: null, meGusta: 0, compartidos: 0 },
];

// ---- Vecinos de la app (apps/admin/src/datos/mock/usuarios.mock.ts) ----
// Contraseña de prueba única para los vecinos de ejemplo (cumple la misma regla de fuerza
// que exige el registro real: 8+ caracteres, mayúscula, número y carácter especial).
const CONTRASENA_DEMO_VECINOS = "Vecino#2026";
const usuariosApp = [
  { id: "usr-carla-mendez", nombre: "Carla", apellido: "Méndez", correo: "carla.mendez@vecino.demo", telefono: "51987001122", comunidadId: "com-san-borja", estado: "activo", registradoEn: "2026-08-05T14:20:00.000Z", ultimoAccesoEn: "2026-08-30T09:10:00.000Z" },
  { id: "usr-jorge-paredes", nombre: "Jorge", apellido: "Paredes", correo: "jorge.paredes@vecino.demo", telefono: "51987002233", comunidadId: "com-san-borja", estado: "activo", registradoEn: "2026-08-07T10:05:00.000Z", ultimoAccesoEn: "2026-08-29T18:40:00.000Z" },
  { id: "usr-lucia-flores", nombre: "Lucía", apellido: "Flores", correo: "lucia.flores@vecino.demo", telefono: "51987003344", comunidadId: "com-san-borja", estado: "activo", registradoEn: "2026-08-10T08:00:00.000Z", ultimoAccesoEn: "2026-08-30T07:55:00.000Z" },
  { id: "usr-renzo-huaman", nombre: "Renzo", apellido: "Huamán", correo: "renzo.huaman@vecino.demo", telefono: "51987004455", comunidadId: "com-san-borja", estado: "bloqueado", registradoEn: "2026-08-12T19:30:00.000Z", ultimoAccesoEn: "2026-08-18T12:00:00.000Z" },
  { id: "usr-daniela-rios", nombre: "Daniela", apellido: "Ríos", correo: "daniela.rios@vecino.demo", telefono: "51987005566", comunidadId: "com-miraflores", estado: "activo", registradoEn: "2026-08-20T15:45:00.000Z", ultimoAccesoEn: "2026-08-30T11:20:00.000Z" },
  { id: "usr-martin-solis", nombre: "Martín", apellido: "Solís", correo: "martin.solis@vecino.demo", telefono: "51987006677", comunidadId: "com-miraflores", estado: "activo", registradoEn: "2026-08-25T09:15:00.000Z", ultimoAccesoEn: "2026-08-29T20:05:00.000Z" },
  { id: "usr-fabiola-castro", nombre: "Fabiola", apellido: "Castro", correo: "fabiola.castro@vecino.demo", telefono: "51987007788", comunidadId: "com-surco", estado: "activo", registradoEn: "2026-08-28T13:00:00.000Z", ultimoAccesoEn: "2026-08-31T08:30:00.000Z" },
  { id: "usr-hugo-ninanya", nombre: "Hugo", apellido: "Ninanya", correo: "hugo.ninanya@vecino.demo", telefono: "51987008899", comunidadId: "com-surquillo", estado: "activo", registradoEn: "2026-08-29T17:10:00.000Z", ultimoAccesoEn: "2026-08-31T09:45:00.000Z" },
];

// ---- Anuncios y novedades (apps/admin/src/datos/mock/anuncios.mock.ts, novedades.mock.ts) ----
const anuncios = [
  { id: "ad-fogon", nombre: "20% en parrillas — El Fogón", detalle: "20% en parrillas todos los martes", imagenUrl: null, ubicaciones: ["carrusel_inicio"], negocioId: "neg-restaurante-fogon", fechaInicio: "2026-08-01", fechaFin: "2026-09-30", orden: 1, activo: true },
  { id: "ad-supermercado", nombre: "2x1 en lácteos — Supermercado SB", detalle: "2x1 en lácteos esta semana", imagenUrl: null, ubicaciones: ["carrusel_inicio", "banner_buscar"], negocioId: "neg-supermercado-sb", fechaInicio: "2026-08-15", fechaFin: "2026-09-05", orden: 2, activo: true },
  { id: "ad-herminia", nombre: "Torta por encargo — Doña Herminia", detalle: "Encarga tu torta con 48h de anticipo", imagenUrl: null, ubicaciones: ["banner_buscar"], negocioId: "neg-postres-herminia", fechaInicio: "2026-10-01", fechaFin: null, orden: 3, activo: true },
];
const novedades = [
  { id: "nov-horario-completo", titulo: "Ahora puedes ver el horario completo", texto: 'Toca "Ver horario completo" en cualquier negocio para ver sus 7 días.', publicadoEn: "2026-08-20T00:00:00.000Z", activo: true },
  { id: "nov-comunidad-muro", titulo: "Comunidad ahora es un muro social", texto: "Avisos con reacciones y opción de compartir, todo en un solo lugar.", publicadoEn: "2026-08-15T00:00:00.000Z", activo: true },
];

// ---- Profesionales (servicios 9, 10 y 11: médicos, veterinarios, legal/contable) ----
// Primer contenido de ejemplo para este módulo — no existía mock previo, se sigue el mismo
// criterio que el resto de la semilla: datos de ejemplo realistas, sin backend de verificación
// real todavía (colegiaturaVerificadaEn queda null salvo que se indique lo contrario).
const profesionales = [
  { id: "prof-medico-castaneda", comunidadId: "com-san-borja", tipo: "medico", nombre: "Dra. Rosa Castañeda", colegiaturaNumero: "CMP 45021", colegiaturaEntidad: "Colegio Médico del Perú", colegiaturaVerificadaEn: "2026-07-10T00:00:00.000Z", especialidad: "Medicina general", whatsapp: "51987112233", direccionConsultorio: "Av. San Luis 2100, San Borja", coordenada: { lat: -12.1049, lng: -76.9995 }, activo: true },
  { id: "prof-veterinario-quispe", comunidadId: "com-san-borja", tipo: "veterinario", nombre: "Dr. Luis Quispe", colegiaturaNumero: "CMVP 8834", colegiaturaEntidad: "Colegio Médico Veterinario del Perú", colegiaturaVerificadaEn: null, especialidad: "Animales menores", whatsapp: "51987223344", direccionConsultorio: "Av. Aviación 4180, San Borja", coordenada: { lat: -12.1030, lng: -76.9968 }, activo: true },
  { id: "prof-contador-farfan", comunidadId: "com-san-borja", tipo: "legal_contable", nombre: "CPC Jorge Farfán", colegiaturaNumero: "CCPL 12045", colegiaturaEntidad: "Colegio de Contadores Públicos de Lima", colegiaturaVerificadaEn: "2026-06-15T00:00:00.000Z", especialidad: "Tributación para pequeños negocios", whatsapp: "51987334455", direccionConsultorio: "Jr. Los Claveles 210, San Borja", coordenada: { lat: -12.1015, lng: -77.0005 }, activo: true },
  { id: "prof-medico-injante", comunidadId: "com-miraflores", tipo: "medico", nombre: "Dr. Pablo Injante", colegiaturaNumero: "CMP 51290", colegiaturaEntidad: "Colegio Médico del Perú", colegiaturaVerificadaEn: null, especialidad: "Pediatría", whatsapp: "51987445566", direccionConsultorio: "Av. Larco 890, Miraflores", coordenada: { lat: -12.1225, lng: -77.0295 }, activo: true },
  { id: "prof-abogado-tello", comunidadId: "com-surco", tipo: "legal_contable", nombre: "Abg. Claudia Tello", colegiaturaNumero: "CAL 78412", colegiaturaEntidad: "Colegio de Abogados de Lima", colegiaturaVerificadaEn: "2026-08-01T00:00:00.000Z", especialidad: "Derecho de familia", whatsapp: "51987556677", direccionConsultorio: "Av. Caminos del Inca 1980, Surco", coordenada: { lat: -12.1370, lng: -76.9935 }, activo: true },
  { id: "prof-veterinario-rojas", comunidadId: "com-surquillo", tipo: "veterinario", nombre: "Dra. Milagros Rojas", colegiaturaNumero: "CMVP 9021", colegiaturaEntidad: "Colegio Médico Veterinario del Perú", colegiaturaVerificadaEn: null, especialidad: "Cirugía de mascotas", whatsapp: "51987667788", direccionConsultorio: "Av. Angamos Este 1150, Surquillo", coordenada: { lat: -12.1152, lng: -77.0142 }, activo: true },
];

// ---- Productos (carta de El Fogón Sanborjino — mismos ítems ya usados como ejemplo en
// apps/movil/src/datos/mock/productos.mock.ts, ahora también disponibles vía la API real) ----
const productos = [
  { id: "prod-fogon-lomo-saltado", negocioId: "neg-restaurante-fogon", nombre: "Lomo saltado", descripcion: "Con papas fritas, arroz y ensalada criolla.", precio: 28, categoriaMenu: "Platos de fondo", destacado: true },
  { id: "prod-fogon-aji-gallina", negocioId: "neg-restaurante-fogon", nombre: "Ají de gallina", descripcion: "Pollo deshilachado en crema de ají amarillo, con arroz y papa.", precio: 24, categoriaMenu: "Platos de fondo", destacado: false },
  { id: "prod-fogon-parrilla-mixta", negocioId: "neg-restaurante-fogon", nombre: "Parrilla mixta (2 personas)", descripcion: "Bife, chorizo, anticucho y pollo a la brasa, con guarniciones.", precio: 68, categoriaMenu: "Parrillas", destacado: true },
  { id: "prod-fogon-anticuchos", negocioId: "neg-restaurante-fogon", nombre: "Anticuchos (porción)", descripcion: "Corazón de res a la parrilla con papa dorada y choclo.", precio: 20, categoriaMenu: "Parrillas", destacado: false },
];

function generar() {
  const partes = [];
  partes.push(
    "-- Semilla del piloto: Lima + San Borja/Miraflores/Surco/Surquillo, generada por\n" +
      "-- infraestructura/datos-semilla/generar-semilla.js a partir de apps/admin/src/datos/mock/*.ts.\n" +
      "-- No editar a mano: si el mock cambia, se vuelve a correr el generador.\n",
  );

  partes.push(insert(
    "departamentos", ["ubigeo", "nombre", "activo"],
    departamentos.map((d) => [esc(d.ubigeo), esc(d.nombre), esc(d.activo)]),
  ));
  partes.push(insert(
    "provincias", ["ubigeo", "departamento_ubigeo", "nombre", "activo"],
    provincias.map((p) => [esc(p.ubigeo), esc(p.departamentoUbigeo), esc(p.nombre), esc(p.activo)]),
  ));
  partes.push(insert(
    "distritos", ["ubigeo", "provincia_ubigeo", "nombre", "centro", "activo"],
    distritos.map((d) => [esc(d.ubigeo), esc(d.provinciaUbigeo), esc(d.nombre), punto(d.centro.lat, d.centro.lng), esc(d.activo)]),
  ));
  partes.push(insert(
    "comunidades", ["id", "distrito_ubigeo", "nombre", "slug", "centro", "descripcion", "activo", "fecha_lanzamiento"],
    comunidades.map((c) => [esc(c.id), esc(c.distritoUbigeo), esc(c.nombre), esc(c.slug), punto(c.centro.lat, c.centro.lng), esc(c.descripcion), esc(c.activo), esc(c.fechaLanzamiento)]),
  ));

  partes.push(insert(
    "cuentas", ["id", "nombre", "correo", "rol", "password_hash", "activo", "creado_en"],
    cuentas.map((c) => [
      esc(c.id), esc(c.nombre), esc(c.correo), esc(c.rol),
      esc(bcrypt.hashSync(credencialesDemo[c.correo], 10)),
      esc(c.activo), esc(c.creadoEn),
    ]),
  ));
  const cuentaDistritos = cuentas.flatMap((c) => c.distritosAsignados.map((ubigeo) => [esc(c.id), esc(ubigeo)]));
  partes.push(insert("cuenta_distritos", ["cuenta_id", "distrito_ubigeo"], cuentaDistritos));

  partes.push(insert(
    "plantillas_visuales", ["id", "nombre", "modo", "origen", "descripcion_uso", "campos_esperados"],
    plantillas.map((p) => [esc(p.id), esc(p.nombre), esc(p.modo), esc(p.origen), esc(p.descripcionUso), jsonb(p.camposEsperados)]),
  ));
  partes.push(insert(
    "arquetipos", ["id", "nombre", "icono", "plantilla_id", "origen", "campos"],
    arquetipos.map((a) => [esc(a.id), esc(a.nombre), esc(a.icono), esc(a.plantillaId), esc(a.origen), jsonb(a.campos)]),
  ));
  partes.push(insert(
    "categorias", ["id", "padre_id", "nombre", "slug", "icono", "orden", "arquetipo_ficha", "arquetipo_id"],
    categorias.map((c) => [esc(c.id), esc(c.padreId), esc(c.nombre), esc(c.slug), esc(c.icono), esc(c.orden), esc(c.arquetipoFicha), esc(c.arquetipoId)]),
  ));

  partes.push(insert(
    "negocios",
    ["id", "comunidad_id", "distrito_ubigeo", "nombre", "descripcion", "coordenada", "direccion", "telefono", "whatsapp", "horarios", "estado", "verificado_en", "validado_por_cuenta_id", "motivo_rechazo", "fuente", "creado_en", "actualizado_en", "ofertas"],
    negocios.map((n) => [
      esc(n.id), esc(n.comunidadId), esc(n.distritoUbigeo), esc(n.nombre), esc(n.descripcion),
      punto(n.coordenada.lat, n.coordenada.lng), esc(n.direccion), esc(n.telefono), esc(n.whatsapp),
      jsonb(n.horarios), esc(n.estado), esc(n.verificadoEn), esc(n.validadoPorCuentaId), esc(n.motivoRechazo),
      esc(n.fuente), esc(n.creadoEn), esc(n.actualizadoEn), jsonb(n.ofertas ?? null),
    ]),
  ));
  const negocioCategorias = negocios.flatMap((n) => n.categoriaIds.map((catId) => [esc(n.id), esc(catId)]));
  partes.push(insert("negocio_categorias", ["negocio_id", "categoria_id"], negocioCategorias));

  partes.push(insert(
    "productos", ["id", "negocio_id", "nombre", "descripcion", "precio", "categoria_menu", "destacado"],
    productos.map((p) => [esc(p.id), esc(p.negocioId), esc(p.nombre), esc(p.descripcion), esc(p.precio), esc(p.categoriaMenu), esc(p.destacado)]),
  ));

  const cuentaNegocios = cuentas.flatMap((c) => c.negocioIds.map((negId) => [esc(c.id), esc(negId)]));
  partes.push(insert("cuenta_negocios", ["cuenta_id", "negocio_id"], cuentaNegocios));

  partes.push(insert(
    "avisos",
    ["id", "comunidad_id", "fuente_nombre", "fuente_verificada", "titulo", "cuerpo", "categoria", "estado", "creado_por_cuenta_id", "validado_por_cuenta_id", "motivo_rechazo", "publicado_en", "imagen_url", "me_gusta", "compartidos"],
    avisos.map((a) => [
      esc(a.id), esc(a.comunidadId), esc(a.fuenteNombre), esc(a.fuenteVerificada), esc(a.titulo), esc(a.cuerpo),
      esc(a.categoria), esc(a.estado), esc(a.creadoPorCuentaId), esc(a.validadoPorCuentaId), esc(a.motivoRechazo),
      esc(a.publicadoEn), esc(a.imagenUrl), esc(a.meGusta), esc(a.compartidos),
    ]),
  ));

  const hashVecinos = bcrypt.hashSync(CONTRASENA_DEMO_VECINOS, 10);
  partes.push(insert(
    "usuarios_app",
    ["id", "nombre", "apellido", "correo", "password_hash", "telefono", "comunidad_id", "estado", "registrado_en", "ultimo_acceso_en"],
    usuariosApp.map((u) => [
      esc(u.id), esc(u.nombre), esc(u.apellido), esc(u.correo), esc(hashVecinos), esc(u.telefono),
      esc(u.comunidadId), esc(u.estado), esc(u.registradoEn), esc(u.ultimoAccesoEn),
    ]),
  ));

  partes.push(insert(
    "anuncios", ["id", "nombre", "detalle", "imagen_url", "ubicaciones", "negocio_id", "fecha_inicio", "fecha_fin", "orden", "activo"],
    anuncios.map((a) => [esc(a.id), esc(a.nombre), esc(a.detalle), esc(a.imagenUrl), textArray(a.ubicaciones) + "::ubicacion_anuncio[]", esc(a.negocioId), esc(a.fechaInicio), esc(a.fechaFin), esc(a.orden), esc(a.activo)]),
  ));
  partes.push(insert(
    "novedades", ["id", "titulo", "texto", "publicado_en", "activo"],
    novedades.map((n) => [esc(n.id), esc(n.titulo), esc(n.texto), esc(n.publicadoEn), esc(n.activo)]),
  ));

  partes.push(insert(
    "profesionales",
    ["id", "comunidad_id", "tipo", "nombre", "colegiatura_numero", "colegiatura_entidad", "colegiatura_verificada_en", "especialidad", "whatsapp", "direccion_consultorio", "coordenada", "activo"],
    profesionales.map((p) => [
      esc(p.id), esc(p.comunidadId), esc(p.tipo), esc(p.nombre), esc(p.colegiaturaNumero), esc(p.colegiaturaEntidad),
      esc(p.colegiaturaVerificadaEn), esc(p.especialidad), esc(p.whatsapp), esc(p.direccionConsultorio),
      punto(p.coordenada.lat, p.coordenada.lng), esc(p.activo),
    ]),
  ));

  return partes.join("\n");
}

const destino = path.join(__dirname, "0001_piloto.sql");
fs.writeFileSync(destino, generar(), "utf8");
console.log(`Semilla generada en ${destino}`);
