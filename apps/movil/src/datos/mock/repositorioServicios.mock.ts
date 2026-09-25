import { ServicioApp } from "@app-vecinos/tipos";
import { RepositorioServicios } from "../contratos/repositorioServicios";
import { serviciosMock } from "./servicios.mock";

export class RepositorioServiciosMock implements RepositorioServicios {
  async listar(): Promise<ServicioApp[]> {
    return serviciosMock;
  }

  async registrarVisita(): Promise<void> {
    // En mock no hay nada que persistir — el conteo de VISITAS_7D_MOCK ya viene fijo en servicios.mock.ts.
  }
}
