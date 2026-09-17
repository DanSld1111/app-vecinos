export interface Resena {
  id: string;
  negocioId: string;
  usuarioId: string;
  /** Nombre del vecino que dejó la reseña — solo el nombre de pila, nunca datos de contacto. */
  usuarioNombre: string;
  calificacion: 1 | 2 | 3 | 4 | 5;
  comentario: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ResumenResenas {
  promedio: number;
  total: number;
}
