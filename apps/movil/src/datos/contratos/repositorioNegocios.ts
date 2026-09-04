import { FiltroNegocios, Negocio, ResultadoPaginado } from "@app-vecinos/tipos";

export interface RepositorioNegocios {
  listar(filtro: FiltroNegocios): Promise<ResultadoPaginado<Negocio>>;
  obtenerPorId(id: string): Promise<Negocio | null>;
}
