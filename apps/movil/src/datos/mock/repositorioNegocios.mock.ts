import { Coordenada, FiltroNegocios, Negocio, ResultadoPaginado } from "@app-vecinos/tipos";
import { RepositorioNegocios } from "../contratos/repositorioNegocios";
import { negociosMock } from "./negocios.mock";
import { categoriasMock } from "./categorias.mock";

const RETRASO_SIMULADO_MS = 300;

/** Mismo tope que negocios.service.ts en el backend real (DISTANCIA_MAXIMA_METROS) — ver
 * docs/decisiones/0073-inicio-orden-real.md. */
const DISTANCIA_MAXIMA_METROS = 6000;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function metrosEntre(a: Coordenada, b: Coordenada): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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

    // Mismo criterio que el backend real: con ubicación, orden por distancia real (con tope) y
    // desempate por visitas; sin ubicación, cae a popularidad — nunca al azar. Ver
    // docs/decisiones/0073-inicio-orden-real.md.
    let conDistancia = resultado.map((n) => ({
      negocio: n,
      distanciaM: filtro.lat != null && filtro.lng != null ? metrosEntre({ lat: filtro.lat, lng: filtro.lng }, n.coordenada) : undefined,
    }));
    if (filtro.lat != null && filtro.lng != null) {
      conDistancia = conDistancia.filter((n) => (n.distanciaM as number) <= DISTANCIA_MAXIMA_METROS);
      conDistancia.sort((a, b) => (a.distanciaM as number) - (b.distanciaM as number) || b.negocio.visitas7d - a.negocio.visitas7d);
    } else {
      conDistancia.sort((a, b) => b.negocio.visitas7d - a.negocio.visitas7d);
    }

    const limite = filtro.limite ?? 20;
    const items = conDistancia.slice(0, limite).map(({ negocio, distanciaM }) => ({ ...negocio, distanciaM }));
    return {
      items,
      cursorSiguiente: conDistancia.length > limite ? String(limite) : null,
    };
  }

  async obtenerPorId(id: string): Promise<Negocio | null> {
    await esperar(RETRASO_SIMULADO_MS);
    return negociosMock.find((n) => n.id === id) ?? null;
  }

  async registrarVisita(): Promise<void> {
    // En mock no hay nada que persistir — el conteo de VISITAS_7D_MOCK ya viene fijo en negocios.mock.ts.
  }
}
