import { marca } from "../config/marca";

export interface PaletaColores {
  primario: string;
  primarioFuerte: string;
  primarioSuave: string;

  acento: string;
  acentoFuerte: string;
  acentoSuave: string;

  fondo: string;
  superficie: string;
  superficieHundida: string;
  superficieHundida2: string;

  texto: string;
  textoSuave: string;
  textoTenue: string;

  borde: string;
  bordeFuerte: string;

  exito: string;
  advertencia: string;
  error: string;
}

export const paletaClara: PaletaColores = {
  primario: marca.colores.primario,
  primarioFuerte: marca.colores.secundario,
  primarioSuave: "#dbf1e3",

  acento: marca.colores.acento,
  acentoFuerte: "#c8532e",
  acentoSuave: "#fce2d7",

  fondo: "#ffffff",
  superficie: "#ffffff",
  superficieHundida: "#eef6f0",
  superficieHundida2: "#e3ece4",

  texto: "#1a2119",
  textoSuave: "#5f6b5c",
  textoTenue: "#96a091",

  borde: "#e3ece4",
  bordeFuerte: "#c9d6cc",

  exito: "#1f8a5a",
  advertencia: "#ef7148",
  error: "#c0392b",
};

// Mismo lenguaje de marca (verde San Borja + coral de acento), pero los neutros (fondo,
// superficies, texto, bordes) son un gris carbón NEUTRO — no la paleta clara con el verde
// "tinturado" en cada gris. La primera versión de este modo oscuro tinturaba de verde oliva
// hasta los grises, y el resultado se veía turbio y sin separación entre capas ("todo muy
// oscuro, los colores no combinan"). Con neutros limpios, el verde/coral de marca quedan como
// lo único que aporta color — se leen, en vez de perderse contra un fondo del mismo tono. Ver
// docs/decisiones/0023-ajuste-modo-oscuro.md.
export const paletaOscura: PaletaColores = {
  primario: "#3ecf8e",
  primarioFuerte: "#7fe3b4",
  primarioSuave: "#173625",

  acento: "#ff8f66",
  acentoFuerte: "#ffb28c",
  acentoSuave: "#3a2419",

  // Jerarquía de profundidad clara: el fondo es lo más oscuro; cada superficie por encima se
  // aclara un paso (así una tarjeta se distingue del fondo sin depender solo de la sombra).
  fondo: "#121316",
  superficie: "#1e2024",
  superficieHundida: "#191b1f",
  superficieHundida2: "#25272c",

  texto: "#f2f3f4",
  textoSuave: "#b3b7bc",
  textoTenue: "#797e84",

  borde: "#2c2f34",
  bordeFuerte: "#3c4046",

  exito: "#3ecf8e",
  advertencia: "#ff8f66",
  error: "#f0554a",
};

/** Paleta activa por defecto (usos estáticos fuera de un componente, ej. datos de ejemplo) — el modo real de cada pantalla viene de `useColores()`. */
export const colores = paletaClara;
