import { Anuncio } from "@app-vecinos/tipos";
import { RepositorioAnuncios } from "../contratos/repositorioAnuncios";
import { apiGet } from "./clienteApi";

export class RepositorioAnunciosApi implements RepositorioAnuncios {
  async listar(): Promise<Anuncio[]> {
    return apiGet<Anuncio[]>("/anuncios");
  }
}
