import { FiltroNegocios, Negocio, ResultadoPaginado } from "@app-vecinos/tipos";
import { RepositorioNegocios } from "../contratos/repositorioNegocios";
import { negociosMock } from "./negocios.mock";
import { categoriasMock } from "./categorias.mock";

const RETRASO_SIMULADO_MS = 300;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RepositorioNegociosMock implements RepositorioNegocios {
  async listar(filtro: FiltroNegocios): Promise<ResultadoPaginado<Negocio>> {
    await esperar(RETRASO_SIMULADO_MS);

    let resultado = negociosMock.filter((n) => n.comunidadId === filtro.comunidadId);

    if (filtro.categoriaId) {
      resultado = resultado.filter((n) => n.categoriaIds.includes(filtro.categoriaId as string));
    }

    if (filtro.servicioSlug) {
      const categoriaIdsDelServicio = categoriasMock
        .filter((c) => c.servicioSlug === filtro.servicioSlug)
        .map((c) => c.id);
      resultado = resultado.filter((n) => n.categoriaIds.some((id) => categoriaIdsDelServicio.includes(id)));
    }

    if (filtro.busqueda) {
      const termino = filtro.busqueda.toLowerCase();
      resultado = resultado.filter((n) => n.nombre.toLowerCase().includes(termino));
    }

    const limite = filtro.limite ?? 20;
    return {
      items: resultado.slice(0, limite),
      cursorSiguiente: resultado.length > limite ? String(limite) : null,
    };
  }

  async obtenerPorId(id: string): Promise<Negocio | null> {
    await esperar(RETRASO_SIMULADO_MS);
    return negociosMock.find((n) => n.id === id) ?? null;
  }
}
