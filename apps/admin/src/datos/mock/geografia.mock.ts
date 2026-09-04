import { Comunidad, Distrito } from "@app-vecinos/tipos";

export const distritosMock: Distrito[] = [
  {
    ubigeo: "150140",
    provinciaUbigeo: "1501",
    nombre: "San Borja",
    centro: { lat: -12.1055, lng: -77.0 },
    activo: true,
  },
  {
    ubigeo: "150122",
    provinciaUbigeo: "1501",
    nombre: "Miraflores",
    centro: { lat: -12.1211, lng: -77.0282 },
    activo: true,
  },
  {
    ubigeo: "150141",
    provinciaUbigeo: "1501",
    nombre: "Surco",
    centro: { lat: -12.1352, lng: -76.9927 },
    activo: true,
  },
  {
    ubigeo: "150142",
    provinciaUbigeo: "1501",
    nombre: "Surquillo",
    centro: { lat: -12.1145, lng: -77.0158 },
    activo: true,
  },
];

export const comunidadesMock: Comunidad[] = [
  {
    id: "com-san-borja",
    distritoUbigeo: "150140",
    nombre: "San Borja",
    slug: "san-borja",
    centro: { lat: -12.1055, lng: -77.0 },
    descripcion:
      "San Borja es un distrito residencial de Lima conocido por sus áreas verdes, seguridad y cercanía a centros culturales y deportivos.",
    activo: true,
    fechaLanzamiento: "2026-09-01",
  },
  {
    id: "com-miraflores",
    distritoUbigeo: "150122",
    nombre: "Miraflores",
    slug: "miraflores",
    centro: { lat: -12.1211, lng: -77.0282 },
    descripcion:
      "Miraflores es un distrito costero de Lima, conocido por el Malecón, sus parques y su intensa actividad comercial y turística.",
    activo: true,
    fechaLanzamiento: "2026-09-15",
  },
  {
    id: "com-surco",
    distritoUbigeo: "150141",
    nombre: "Surco",
    slug: "surco",
    centro: { lat: -12.1352, lng: -76.9927 },
    descripcion:
      "Santiago de Surco es uno de los distritos más extensos de Lima, con zonas residenciales, comerciales y parques como el Parque de la Amistad.",
    activo: true,
    fechaLanzamiento: "2026-09-20",
  },
  {
    id: "com-surquillo",
    distritoUbigeo: "150142",
    nombre: "Surquillo",
    slug: "surquillo",
    centro: { lat: -12.1145, lng: -77.0158 },
    descripcion:
      "Surquillo es un distrito pequeño y muy comercial de Lima, conocido por su mercado mayorista y su ubicación central entre Miraflores y San Borja.",
    activo: true,
    fechaLanzamiento: "2026-09-20",
  },
];
