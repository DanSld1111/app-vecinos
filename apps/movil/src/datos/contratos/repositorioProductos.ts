import { Producto } from "@app-vecinos/tipos";

export interface RepositorioProductos {
  listarPorNegocio(negocioId: string): Promise<Producto[]>;
}
