import { Producto, TourConAgencia } from "@app-vecinos/tipos";

export interface RepositorioProductos {
  listarPorNegocio(negocioId: string): Promise<Producto[]>;
  /** Tours con salidas próximas de todas las agencias de la comunidad (decisión 0096). */
  listarTours(comunidadId: string): Promise<TourConAgencia[]>;
}
