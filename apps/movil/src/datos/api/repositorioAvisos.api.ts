import { Aviso, ResultadoPaginado } from "@app-vecinos/tipos";
import { RepositorioAvisos } from "../contratos/repositorioAvisos";
import { apiGet } from "./clienteApi";

// El contrato de este repositorio (heredado de la implementación mock) pide un array plano,
// no paginado. El backend sí pagina (regla general de la API) — acá se toma la primera página
// con un límite generoso. Cuando la pantalla de Comunidad implemente "cargar más", este método
// cambia de firma para exponer el cursor; hasta entonces, esto es fiel a lo que la UI ya pinta.
const LIMITE_SIN_PAGINACION_UI = 50;

export class RepositorioAvisosApi implements RepositorioAvisos {
  async listarPorComunidad(comunidadId: string): Promise<Aviso[]> {
    const resultado = await apiGet<ResultadoPaginado<Aviso>>("/avisos", {
      comunidadId,
      limite: LIMITE_SIN_PAGINACION_UI,
    });
    return resultado?.items ?? [];
  }
}
