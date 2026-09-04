import { ServicioApp } from "@app-vecinos/tipos";

export interface RepositorioServicios {
  listar(): Promise<ServicioApp[]>;
}
