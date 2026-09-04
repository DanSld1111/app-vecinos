import { Categoria } from "@app-vecinos/tipos";

export interface RepositorioCategorias {
  listar(): Promise<Categoria[]>;
}
