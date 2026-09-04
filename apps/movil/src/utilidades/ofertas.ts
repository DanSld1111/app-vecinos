import { Negocio, OfertaNegocio } from "@app-vecinos/tipos";

export interface OfertaConNegocio {
  negocioId: string;
  negocioNombre: string;
  /** No hay foto propia por oferta en el modelo — se reusa la foto principal del negocio. */
  negocioFotoUrl: string | null;
  oferta: OfertaNegocio;
}

/** Junta las ofertas vigentes de todos los negocios recibidos, sin importar su rubro. */
export function recolectarOfertas(negocios: Negocio[]): OfertaConNegocio[] {
  const resultado: OfertaConNegocio[] = [];
  for (const negocio of negocios) {
    for (const oferta of negocio.ofertas ?? []) {
      resultado.push({
        negocioId: negocio.id,
        negocioNombre: negocio.nombre,
        negocioFotoUrl: negocio.fotoPrincipalUrl,
        oferta,
      });
    }
  }
  return resultado;
}
