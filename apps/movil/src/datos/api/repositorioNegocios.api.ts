import { FiltroNegocios, Negocio, ResultadoPaginado } from "@app-vecinos/tipos";
import { RepositorioNegocios } from "../contratos/repositorioNegocios";
import { apiGet } from "./clienteApi";

export class RepositorioNegociosApi implements RepositorioNegocios {
  async listar(filtro: FiltroNegocios): Promise<ResultadoPaginado<Negocio>> {
    // Con texto de búsqueda, se usa el endpoint con índice (Meilisearch: tolera errores de
    // tipeo y acentos, y ordena por relevancia) en vez del listado normal — ver
    // docs/decisiones/0018-indice-de-busqueda.md. Sin texto, es el listado paginado de siempre.
    if (filtro.busqueda?.trim()) {
      const items = await apiGet<Negocio[]>("/negocios/buscar", {
        q: filtro.busqueda.trim(),
        comunidadId: filtro.comunidadId,
        limite: filtro.limite,
      });
      // La búsqueda por índice no pagina por cursor — es un solo resultado ordenado por relevancia.
      return { items, cursorSiguiente: null };
    }

    return apiGet<ResultadoPaginado<Negocio>>("/negocios", {
      comunidadId: filtro.comunidadId,
      categoriaId: filtro.categoriaId,
      cursor: filtro.cursor,
      limite: filtro.limite,
    });
  }

  async obtenerPorId(id: string): Promise<Negocio | null> {
    return apiGet<Negocio | null>(`/negocios/${id}`);
  }
}
