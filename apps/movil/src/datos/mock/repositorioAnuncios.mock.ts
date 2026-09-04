import { Anuncio } from "@app-vecinos/tipos";
import { RepositorioAnuncios } from "../contratos/repositorioAnuncios";
import { anunciosMock } from "./anuncios.mock";

export class RepositorioAnunciosMock implements RepositorioAnuncios {
  async listar(): Promise<Anuncio[]> {
    return anunciosMock;
  }
}
