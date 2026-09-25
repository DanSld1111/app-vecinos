import { ServicioApp } from "@app-vecinos/tipos";
import { RepositorioServicios } from "../contratos/repositorioServicios";
import { apiFetch, apiGet } from "./clienteApi";

export class RepositorioServiciosApi implements RepositorioServicios {
  async listar(): Promise<ServicioApp[]> {
    return apiGet<ServicioApp[]>("/servicios-app");
  }

  /** Dispara-y-olvida — mismo criterio que RepositorioNegociosApi.registrarVisita. */
  async registrarVisita(slug: string): Promise<void> {
    try {
      await apiFetch<void>(`/servicios-app/${slug}/visitas`, { metodo: "POST" });
    } catch {
      // silencioso a propósito.
    }
  }
}
