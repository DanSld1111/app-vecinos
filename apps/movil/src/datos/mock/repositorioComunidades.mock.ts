import { Comunidad, Coordenada } from "@app-vecinos/tipos";
import { RepositorioComunidades } from "../contratos/repositorioComunidades";
import { comunidadesMock } from "./comunidades.mock";

export class RepositorioComunidadesMock implements RepositorioComunidades {
  async listarActivas(): Promise<Comunidad[]> {
    return comunidadesMock.filter((c) => c.activo);
  }

  async obtenerPorId(id: string): Promise<Comunidad | null> {
    return comunidadesMock.find((c) => c.id === id) ?? null;
  }

  async detectarPorCoordenada(_coordenada: Coordenada): Promise<Comunidad | null> {
    return comunidadesMock.find((c) => c.slug === "san-borja") ?? null;
  }
}
