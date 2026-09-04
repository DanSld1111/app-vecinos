import { Novedad } from "@app-vecinos/tipos";
import { RepositorioNovedades } from "../contratos/repositorioNovedades";
import { novedadesMock } from "./novedades.mock";

export class RepositorioNovedadesMock implements RepositorioNovedades {
  async listar(): Promise<Novedad[]> {
    return novedadesMock.filter((n) => n.activo);
  }
}
