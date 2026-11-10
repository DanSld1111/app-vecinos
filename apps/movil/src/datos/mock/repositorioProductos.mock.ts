import { Producto } from "@app-vecinos/tipos";
import { RepositorioProductos } from "../contratos/repositorioProductos";
import { productosMock } from "./productos.mock";

export class RepositorioProductosMock implements RepositorioProductos {
  async listarPorNegocio(negocioId: string): Promise<Producto[]> {
    return productosMock.filter((p) => p.negocioId === negocioId);
  }
}
