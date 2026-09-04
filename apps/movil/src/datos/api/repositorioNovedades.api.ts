import { Novedad } from "@app-vecinos/tipos";
import { RepositorioNovedades } from "../contratos/repositorioNovedades";
import { apiGet } from "./clienteApi";

export class RepositorioNovedadesApi implements RepositorioNovedades {
  async listar(): Promise<Novedad[]> {
    return apiGet<Novedad[]>("/novedades");
  }
}
