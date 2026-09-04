import { Anuncio } from "@app-vecinos/tipos";

export interface RepositorioAnuncios {
  /** Ya viene filtrado por el servidor: solo activo y dentro de su rango de fechas. */
  listar(): Promise<Anuncio[]>;
}
