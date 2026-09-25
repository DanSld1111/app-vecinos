import { FiltroNegocios, Negocio, ResultadoPaginado } from "@app-vecinos/tipos";
import { RepositorioNegocios } from "../contratos/repositorioNegocios";
import { apiFetch, apiGet } from "./clienteApi";

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
      servicioSlug: filtro.servicioSlug,
      cursor: filtro.cursor,
      limite: filtro.limite,
      lat: filtro.lat,
      lng: filtro.lng,
    });
  }

  async obtenerPorId(id: string): Promise<Negocio | null> {
    return apiGet<Negocio | null>(`/negocios/${id}`);
  }

  /** Dispara-y-olvida: si falla (sin internet, backend caído) no debe romper la ficha que el
   * vecino ya está viendo — solo se pierde ese conteo. */
  async registrarVisita(id: string): Promise<void> {
    try {
      await apiFetch<void>(`/negocios/${id}/visitas`, { metodo: "POST" });
    } catch {
      // silencioso a propósito — ver comentario de arriba.
    }
  }
}
