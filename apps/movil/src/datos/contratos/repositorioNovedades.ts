import { Novedad } from "@app-vecinos/tipos";

export interface RepositorioNovedades {
  /** Solo las visibles (`activo`) — igual criterio que el resto de listados públicos. */
  listar(): Promise<Novedad[]>;
}
