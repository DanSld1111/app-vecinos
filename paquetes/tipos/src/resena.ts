/** Medias estrellas: se toca la mitad izquierda o derecha de cada estrella. */
export type Calificacion = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface Resena {
  id: string;
  negocioId: string;
  usuarioId: string;
  /** Nombre del vecino que dejó la reseña — solo el nombre de pila, nunca datos de contacto. */
  usuarioNombre: string;
  calificacion: Calificacion;
  comentario: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ResumenResenas {
  promedio: number;
  total: number;
}
