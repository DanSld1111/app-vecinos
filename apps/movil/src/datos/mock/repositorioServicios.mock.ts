import { ServicioApp } from "@app-vecinos/tipos";
import { RepositorioServicios } from "../contratos/repositorioServicios";
import { serviciosMock } from "./servicios.mock";

export class RepositorioServiciosMock implements RepositorioServicios {
  async listar(): Promise<ServicioApp[]> {
    return serviciosMock;
  }
}
