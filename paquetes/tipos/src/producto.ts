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
}
