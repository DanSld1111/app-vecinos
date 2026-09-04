/**
 * Una plantilla visual es un diseño de ficha ya resuelto (código) que un Arquetipo puede elegir
 * en vez de inventar un layout desde cero. El super-admin solo elige de este catálogo curado y
 * conecta sus campos a lo que la plantilla espera — no dibuja nada.
 */
export type ModoPlantilla = "lista" | "unico";

export type TipoCampoEsperado = "texto" | "texto_largo" | "numero" | "precio" | "booleano" | "opciones" | "foto";

export interface CampoEsperadoPlantilla {
  etiqueta: string;
  tipo: TipoCampoEsperado;
  obligatorio: boolean;
}

export interface PlantillaVisual {
  id: string;
  nombre: string;
  /** "lista" = el dueño agrega varios ítems repetibles. "unico" = un solo conjunto de datos para todo el negocio. */
  modo: ModoPlantilla;
  /** "sistema" = migrada de uno de los 5 arquetipos originales, mismo diseño de siempre. */
  origen: "sistema" | "nueva";
  descripcionUso: string;
  camposEsperados: CampoEsperadoPlantilla[];
}
