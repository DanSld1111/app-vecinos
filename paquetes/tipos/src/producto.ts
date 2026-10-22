import type { Negocio } from "./negocio";
import type { Moneda } from "./comun";

export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  /** Sección del menú/catálogo donde se agrupa ("Parrillas", "Postres"). Texto libre: cada negocio usa las suyas. */
  categoriaMenu: string;
  destacado: boolean;
  fotoUrl: string | null;
  /** Posición dentro de su sección — la fija el dueño arrastrando, no es alfabético. */
  orden: number;
  /** Campos según la categoría del negocio (ej. talla/color en Moda) — clave del AtributoProductoDef
   * → valor elegido. Vacío si la categoría no define atributos. Ver categoria.ts. */
  atributos: Record<string, string>;
  /** Moneda de este producto si no es la del negocio (ej. una venta en dólares en una inmobiliaria
   * que alquila en soles). null o ausente = la del negocio. Ver docs/decisiones/0090. */
  moneda?: Moneda | null;
  /** Fotos extra, además de la portada (fotoUrl). Hasta MAX_FOTOS_EXTRA. Decisión 0096. */
  fotos?: string[];
  /** Datos con estructura de la ficha Tours (salidas, itinerario…). Vacío en las demás. */
  detalle?: DetalleProducto;
}

export const MAX_FOTOS_EXTRA = 9;

/** Un tour con su agencia, para la pantalla de inicio de Turismo (decisión 0096). */
export interface TourConAgencia {
  producto: Producto;
  negocio: Negocio;
}

/** Una fecha de salida de un tour. */
export interface SalidaTour {
  /** "2026-10-25" */
  fecha: string;
  /** "04:30" */
  hora: string;
  /** null = sin límite. */
  cupos: number | null;
}

export interface PasoItinerario {
  hora: string;
  titulo: string;
  detalle?: string;
}

export interface DetalleProducto {
  salidas?: SalidaTour[];
  itinerario?: PasoItinerario[];
  incluye?: string[];
  noIncluye?: string[];
  puntoEncuentro?: string;
  cancelacion?: string;
}

/** Las opciones marcadas de un campo "varias" (se guardan separadas por "|"). */
export function valoresVarias(valor: string | undefined | null): string[] {
  return (valor ?? "").split("|").map((v) => v.trim()).filter(Boolean);
}

/** Salidas desde hoy (fecha local "AAAA-MM-DD"), ordenadas. */
export function salidasProximas(detalle: DetalleProducto | undefined, hoy: string): SalidaTour[] {
  return [...(detalle?.salidas ?? [])].filter((s) => s.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
}
