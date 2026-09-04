import { Categoria } from "@app-vecinos/tipos";
import { RepositorioCategorias } from "../contratos/repositorioCategorias";
import { categoriasMock } from "./categorias.mock";

export class RepositorioCategoriasMock implements RepositorioCategorias {
  async listar(): Promise<Categoria[]> {
    return categoriasMock;
  }
}
