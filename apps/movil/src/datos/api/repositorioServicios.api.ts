import { ServicioApp } from "@app-vecinos/tipos";
import { RepositorioServicios } from "../contratos/repositorioServicios";
import { apiGet } from "./clienteApi";

export class RepositorioServiciosApi implements RepositorioServicios {
  async listar(): Promise<ServicioApp[]> {
    return apiGet<ServicioApp[]>("/servicios-app");
  }
}
