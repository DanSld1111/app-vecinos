import { Comunidad, Coordenada } from "@app-vecinos/tipos";

export interface RepositorioComunidades {
  listarActivas(): Promise<Comunidad[]>;
  obtenerPorId(id: string): Promise<Comunidad | null>;
  detectarPorCoordenada(coordenada: Coordenada): Promise<Comunidad | null>;
}
