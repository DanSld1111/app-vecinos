export interface ResultadoPaginado<T> {
  items: T[];
  cursorSiguiente: string | null;
}

export type EstadoCarga = "inactivo" | "cargando" | "listo" | "error" | "sin_resultados";

/**
 * Moneda en la que un negocio cobra todo su catálogo (productos, ofertas y servicios). Se
 * define a nivel del negocio, no de cada precio — ver 0016_productos_crud_y_moneda.sql.
 */
export type Moneda = "PEN" | "USD" | "EUR";

export const SIMBOLO_MONEDA: Record<Moneda, string> = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
};

export const NOMBRE_MONEDA: Record<Moneda, string> = {
  PEN: "Soles",
  USD: "Dólares",
  EUR: "Euros",
};

/**
 * Único lugar donde se decide cómo se escribe un precio en toda la app y el panel — antes cada
 * pantalla tenía su propia función con "S/" escrito a mano (6 copias).
 */
export function formatearPrecio(precio: number, moneda: Moneda = "PEN"): string {
  const monto = precio % 1 === 0 ? precio.toFixed(0) : precio.toFixed(2);
  return `${SIMBOLO_MONEDA[moneda]} ${monto}`;
}
