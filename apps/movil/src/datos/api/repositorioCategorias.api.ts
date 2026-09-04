import { Categoria } from "@app-vecinos/tipos";
import { RepositorioCategorias } from "../contratos/repositorioCategorias";
import { apiGet } from "./clienteApi";

export class RepositorioCategoriasApi implements RepositorioCategorias {
  async listar(): Promise<Categoria[]> {
    return apiGet<Categoria[]>("/categorias");
  }
}
