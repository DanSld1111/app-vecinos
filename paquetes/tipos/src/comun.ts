export interface ResultadoPaginado<T> {
  items: T[];
  cursorSiguiente: string | null;
}

export type EstadoCarga = "inactivo" | "cargando" | "listo" | "error" | "sin_resultados";
