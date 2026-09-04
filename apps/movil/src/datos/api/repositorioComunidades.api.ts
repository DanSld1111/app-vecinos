import { Comunidad, Coordenada } from "@app-vecinos/tipos";
import { RepositorioComunidades } from "../contratos/repositorioComunidades";
import { apiGet } from "./clienteApi";

export class RepositorioComunidadesApi implements RepositorioComunidades {
  async listarActivas(): Promise<Comunidad[]> {
    return apiGet<Comunidad[]>("/comunidades");
  }

  async obtenerPorId(id: string): Promise<Comunidad | null> {
    return apiGet<Comunidad | null>(`/comunidades/${id}`);
  }

  async detectarPorCoordenada(coordenada: Coordenada): Promise<Comunidad | null> {
    return apiGet<Comunidad | null>("/comunidades/detectar", { lat: coordenada.lat, lng: coordenada.lng });
  }
}
