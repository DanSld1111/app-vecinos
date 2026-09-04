// Genera infraestructura/datos-semilla/0002_catalogo-ubigeo-nacional.sql a partir de
// fuentes-externas/ubigeo-peru-aumentado/*.csv (ver el README de esa carpeta: fuente real,
// licencia MIT, sin datos inventados). Cubre el pendiente de docs/tecnica/10-fases-pendientes.pdf
// ("cargar los 1874 distritos del Perú, todos inactivos salvo el piloto").
//
// Se aplica DESPUÉS de 0001_piloto.sql — usa ON CONFLICT (ubigeo) DO NOTHING en los tres
// niveles, así que Lima/San Borja/Miraflores/Surco/Surquillo (ya activos ahí) quedan
// intactos; todo lo demás entra como activo=false, listo para "activar un registro" el día
// que se expanda a una comunidad nueva — nunca una migración de esquema.
//
// Uso: node infraestructura/datos-semilla/generar-catalogo-ubigeo.js
const fs = require("fs");
const path = require("path");

const DIR_FUENTES = path.join(__dirname, "fuentes-externas", "ubigeo-peru-aumentado");

function esc(valor) {
  if (valor === null || valor === undefined) return "NULL";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function punto(lat, lng) {
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

// ---- Parser CSV que sí entiende comillas (incluye campos con comas y saltos de línea
// embebidos — la fuente real los tiene, ej. la columna "capital" de un par de distritos). ----
function parseCsvObjects(texto) {
  const filas = [];
  let fila = [];
  let actual = "";
  let entreComillas = false;
  const texto2 = texto.trim() + "\n";
  for (let i = 0; i < texto2.length; i++) {
    const c = texto2[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto2[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        actual += c;
      }
      continue;
    }
    if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(actual);
      actual = "";
    } else if (c === "\r") {
      // ignorar
    } else if (c === "\n") {
      fila.push(actual);
      filas.push(fila);
      fila = [];
      actual = "";
    } else {
      actual += c;
    }
  }
  const encabezados = filas[0];
  return filas
    .slice(1)
    .filter((f) => f.length === encabezados.length)
    .map((f) => Object.fromEntries(encabezados.map((h, idx) => [h, f[idx]])));
}

// ---- Nombres en MAYÚSCULA de la fuente -> Título, con conectores en minúscula
// ("SAN JUAN DE LURIGANCHO" -> "San Juan de Lurigancho"). ----
const CONECTORES = new Set(["de", "del", "la", "las", "los", "y", "el"]);
function aTitulo(nombre) {
  return nombre
    .toLowerCase()
    .split(" ")
    .map((palabra, indice) => {
      if (indice > 0 && CONECTORES.has(palabra)) return palabra;
      return palabra.charAt(0).toLocaleUpperCase("es-PE") + palabra.slice(1);
    })
    .join(" ");
}

function leerCsv(nombreArchivo) {
  return parseCsvObjects(fs.readFileSync(path.join(DIR_FUENTES, nombreArchivo), "utf8"));
}

const filasDepartamento = leerCsv("ubigeo_departamento.csv");
const filasProvincia = leerCsv("ubigeo_provincia.csv");
const filasDistrito = leerCsv("ubigeo_distrito.csv");

// Centro de cada provincia (por su inei de 6 dígitos) — se usa como respaldo para los
// distritos que la fuente no trae con coordenada propia.
const centroProvinciaPorUbigeo = new Map();
for (const fila of filasProvincia) {
  if (fila.inei && fila.latitude && fila.longitude && fila.latitude !== "NA") {
    centroProvinciaPorUbigeo.set(fila.inei, { lat: fila.latitude, lng: fila.longitude });
  }
}

// La fuente trae los nombres de departamento sin tildes ("APURIMAC", "HUANUCO", "SAN MARTIN").
// Son solo 25, una lista corta y bien conocida — se corrige a mano en vez de adivinar. El
// mismo problema existe en menor medida en provincias/distritos (ver README de la carpeta
// fuentes-externas/): con ~2000 nombres, corregir cada uno a mano sería tan poco confiable
// como no corregir ninguno, así que se documenta como limitación conocida en vez de adivinar.
const NOMBRE_DEPARTAMENTO_CORREGIDO = {
  Amazonas: "Amazonas",
  Ancash: "Áncash",
  Apurimac: "Apurímac",
  Arequipa: "Arequipa",
  Ayacucho: "Ayacucho",
  Cajamarca: "Cajamarca",
  Callao: "Callao",
  Cusco: "Cusco",
  Huancavelica: "Huancavelica",
  Huanuco: "Huánuco",
  Ica: "Ica",
  Junin: "Junín",
  "La Libertad": "La Libertad",
  Lambayeque: "Lambayeque",
  Lima: "Lima",
  Loreto: "Loreto",
  "Madre de Dios": "Madre de Dios",
  Moquegua: "Moquegua",
  Pasco: "Pasco",
  Piura: "Piura",
  Puno: "Puno",
  "San Martin": "San Martín",
  Tacna: "Tacna",
  Tumbes: "Tumbes",
  Ucayali: "Ucayali",
};

const departamentos = filasDepartamento
  .filter((f) => f.inei && f.inei.length === 6)
  .map((f) => {
    const nombreBase = aTitulo(f.departamento);
    return { ubigeo: f.inei.slice(0, 2), nombre: NOMBRE_DEPARTAMENTO_CORREGIDO[nombreBase] ?? nombreBase };
  });

const provincias = filasProvincia
  .filter((f) => f.inei && f.inei.length === 6)
  .map((f) => ({
    ubigeo: f.inei.slice(0, 4),
    departamentoUbigeo: f.inei.slice(0, 2),
    nombre: aTitulo(f.provincia),
  }));

let sinCoordenadaPropia = 0;
let descartadosSinUbigeo = 0;
const distritos = filasDistrito
  .filter((f) => {
    const valido = f.inei && f.inei.length === 6 && /^\d{6}$/.test(f.inei);
    if (!valido) descartadosSinUbigeo++;
    return valido;
  })
  .map((f) => {
    let lat = f.latitude;
    let lng = f.longitude;
    if (!lat || !lng || lat === "NA" || lng === "NA") {
      const centroProvincia = centroProvinciaPorUbigeo.get(f.inei.slice(0, 4));
      if (centroProvincia) {
        lat = centroProvincia.lat;
        lng = centroProvincia.lng;
      } else {
        lat = "-9.19"; // centro geográfico aproximado del Perú, último respaldo si ni la provincia tiene coordenada
        lng = "-75.0152";
      }
      sinCoordenadaPropia++;
    }
    return {
      ubigeo: f.inei,
      provinciaUbigeo: f.inei.slice(0, 4),
      nombre: aTitulo(f.distrito),
      lat,
      lng,
    };
  });

function insertConConflicto(tabla, columnas, filas, columnaConflicto) {
  if (filas.length === 0) return `-- ${tabla}: sin filas\n`;
  const valores = filas.map((f) => `  (${f.join(", ")})`).join(",\n");
  return `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES\n${valores}\nON CONFLICT (${columnaConflicto}) DO NOTHING;\n\n`;
}

let sql = `-- Catálogo geográfico nacional completo (departamentos, provincias, distritos del Perú).
-- Generado por infraestructura/datos-semilla/generar-catalogo-ubigeo.js — no editar a mano,
-- volver a correr el generador si hace falta actualizar la fuente.
--
-- Fuente real (no inventada): ver infraestructura/datos-semilla/fuentes-externas/ubigeo-peru-aumentado/README.md
-- (MIT, compilación de INEI/RENIEC/CEPLAN/MINSA/PNUD-Perú).
--
-- Se aplica DESPUÉS de 0001_piloto.sql: usa ON CONFLICT DO NOTHING en los tres niveles, así
-- que Lima/San Borja/Miraflores/Surco/Surquillo (ya cargados ahí como activos) quedan
-- intactos. Todo lo demás entra con activo=false por defecto (columna ya tiene ese default
-- en el esquema, no hace falta repetirlo acá) — expandir a una comunidad nueva es activar un
-- registro existente, nunca una migración.
--
-- ${departamentos.length} departamentos, ${provincias.length} provincias, ${distritos.length} distritos.
-- ${descartadosSinUbigeo} fila(s) de la fuente sin código UBIGEO válido, descartada(s).
-- ${sinCoordenadaPropia} distrito(s) sin coordenada propia en la fuente: se les asignó el
-- centro de su provincia (o el centro geográfico del Perú si ni eso había) como aproximación
-- — son localidades pequeñas y remotas, no afecta al piloto de San Borja.

`;

sql += insertConConflicto(
  "departamentos",
  ["ubigeo", "nombre"],
  departamentos.map((d) => [esc(d.ubigeo), esc(d.nombre)]),
  "ubigeo",
);

sql += insertConConflicto(
  "provincias",
  ["ubigeo", "departamento_ubigeo", "nombre"],
  provincias.map((p) => [esc(p.ubigeo), esc(p.departamentoUbigeo), esc(p.nombre)]),
  "ubigeo",
);

sql += insertConConflicto(
  "distritos",
  ["ubigeo", "provincia_ubigeo", "nombre", "centro"],
  distritos.map((d) => [esc(d.ubigeo), esc(d.provinciaUbigeo), esc(d.nombre), punto(d.lat, d.lng)]),
  "ubigeo",
);

const rutaSalida = path.join(__dirname, "0002_catalogo-ubigeo-nacional.sql");
fs.writeFileSync(rutaSalida, sql, "utf8");
console.log(`Generado: ${rutaSalida}`);
console.log(`${departamentos.length} departamentos, ${provincias.length} provincias, ${distritos.length} distritos.`);
console.log(`${sinCoordenadaPropia} distritos usaron el centro de su provincia como respaldo.`);
