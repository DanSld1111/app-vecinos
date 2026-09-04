import { Aviso } from "@app-vecinos/tipos";
import { RepositorioAvisos } from "../contratos/repositorioAvisos";
import { avisosMock } from "./avisos.mock";

export class RepositorioAvisosMock implements RepositorioAvisos {
  async listarPorComunidad(comunidadId: string): Promise<Aviso[]> {
    return avisosMock.filter((a) => a.comunidadId === comunidadId);
  }
}
