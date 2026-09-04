import { Aviso } from "@app-vecinos/tipos";

export interface RepositorioAvisos {
  listarPorComunidad(comunidadId: string): Promise<Aviso[]>;
}
