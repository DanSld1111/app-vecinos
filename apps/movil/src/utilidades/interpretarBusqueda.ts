import { SeccionClasificado, SubtipoClasificado } from "@app-vecinos/tipos";

export interface BusquedaAvisos {
  seccion?: SeccionClasificado;
  subtipo?: SubtipoClasificado;
  /** Tipo de inmueble o especie. */
  tipo?: string;
  /** Mínimo de dormitorios («2 dormitorios» = 2 o más). */
  dormitorios?: number;
  /** Lo que queda del texto después de reconocer lo anterior. */
  resto: string;
  /** Lo que se entendió, para mostrarlo como chips. */
  entendido: string[];
}

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Palabra (sin tildes, singular o plural) → lo que significa. */
const PALABRAS: { patron: RegExp; aplicar: Partial<BusquedaAvisos>; etiqueta: string }[] = [
  { patron: /^alquil\w*$|^renta$/, aplicar: { seccion: "inmuebles", subtipo: "alquiler" }, etiqueta: "Alquiler" },
  { patron: /^vent\w*$|^vendo$|^compr\w*$/, aplicar: { seccion: "inmuebles", subtipo: "venta" }, etiqueta: "Venta" },
  { patron: /^(depa|depas|departamentos?|dpto|minidepa)$/, aplicar: { seccion: "inmuebles", tipo: "departamento" }, etiqueta: "Departamento" },
  { patron: /^casas?$/, aplicar: { seccion: "inmuebles", tipo: "casa" }, etiqueta: "Casa" },
  { patron: /^(habitacion(es)?|cuartos?)$/, aplicar: { seccion: "inmuebles", tipo: "habitacion" }, etiqueta: "Habitación" },
  { patron: /^oficinas?$/, aplicar: { seccion: "inmuebles", tipo: "oficina" }, etiqueta: "Oficina" },
  { patron: /^(locales?|tienda)$/, aplicar: { seccion: "inmuebles", tipo: "local" }, etiqueta: "Local" },
  { patron: /^(terrenos?|lotes?)$/, aplicar: { seccion: "inmuebles", tipo: "terreno" }, etiqueta: "Terreno" },
  { patron: /^(inmuebles?|propiedad(es)?)$/, aplicar: { seccion: "inmuebles" }, etiqueta: "Inmuebles" },
  { patron: /^(perdid[oa]s?|extraviad[oa]s?|se busca)$/, aplicar: { seccion: "mascotas", subtipo: "perdido" }, etiqueta: "Perdidos" },
  { patron: /^encontrad[oa]s?$/, aplicar: { seccion: "mascotas", subtipo: "encontrado" }, etiqueta: "Encontrados" },
  { patron: /^(adopci\w*|adoptar)$/, aplicar: { seccion: "mascotas", subtipo: "adopcion" }, etiqueta: "Adopción" },
  { patron: /^(perr[oa]s?|perrit[oa]s?|cachorr\w*)$/, aplicar: { seccion: "mascotas", tipo: "perro" }, etiqueta: "Perros" },
  { patron: /^(gat[oa]s?|gatit[oa]s?)$/, aplicar: { seccion: "mascotas", tipo: "gato" }, etiqueta: "Gatos" },
  { patron: /^(mascotas?)$/, aplicar: { seccion: "mascotas" }, etiqueta: "Mascotas" },
  { patron: /^(full ?day|fullday)$/, aplicar: { seccion: "turismo", subtipo: "full_day" }, etiqueta: "Full day" },
  { patron: /^(playas?)$/, aplicar: { seccion: "turismo", subtipo: "playa" }, etiqueta: "Playa" },
  { patron: /^(tours?|paseos?|viajes?|turismo|excursion(es)?)$/, aplicar: { seccion: "turismo" }, etiqueta: "Turismo" },
];

/**
 * «depa 2 dormitorios alquiler» → inmuebles, alquiler, departamento, 2+ dormitorios.
 * Si no se reconoce nada, todo queda en `resto` y se busca por texto.
 */
export function interpretarBusqueda(texto: string): BusquedaAvisos {
  const r: BusquedaAvisos = { resto: "", entendido: [] };
  const palabras = sinTildes(texto).replace(/full day/g, "fullday").replace(/se busca/g, "perdido").split(/\s+/).filter(Boolean);
  const resto: string[] = [];
  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i];
    const sig = palabras[i + 1] ?? "";
    // «2 dormitorios», «3 dorm», «2 cuartos»
    if (/^\d+$/.test(p) && /^(dormitorios?|dorm|habitacion(es)?|cuartos?|recamaras?)$/.test(sig)) {
      r.seccion = "inmuebles";
      r.dormitorios = Number(p);
      r.entendido.push(`${p}+ dormitorios`);
      i++;
      continue;
    }
    const regla = PALABRAS.find((x) => x.patron.test(p));
    if (regla && !(regla.aplicar.seccion && r.seccion && regla.aplicar.seccion !== r.seccion)) {
      Object.assign(r, regla.aplicar);
      if (!r.entendido.includes(regla.etiqueta)) r.entendido.push(regla.etiqueta);
      continue;
    }
    if (!/^(de|en|con|para|un|una|el|la|los|las|y|busco|quiero|cerca|a)$/.test(p)) resto.push(p);
  }
  r.resto = resto.join(" ");
  return r;
}
