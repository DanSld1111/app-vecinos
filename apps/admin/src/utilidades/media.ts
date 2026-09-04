import { entorno } from "../config/entorno";

/**
 * Igual que apps/movil/src/utilidades/media.ts — hace falta acá porque las categorías son la
 * primera entidad cuya foto puede venir como URL absoluta (las 14 de ejemplo apuntan a Unsplash)
 * en vez de una ruta relativa subida al propio servidor (`/uploads/...`, como negocios/servicios/
 * anuncios). Sin este chequeo, anteponer el origen de la API rompía las URLs absolutas.
 */
export function urlCompleta(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined;
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${entorno.origenApi}${ruta}`;
}
