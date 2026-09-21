import { entorno } from "../config/entorno";

/**
 * Igual que apps/movil/src/utilidades/media.ts. Las fotos llegan del servidor de dos formas:
 * ruta relativa cuando se subieron acá (`/uploads/negocios/xxx.jpg`) o URL absoluta cuando
 * apuntan afuera (las categorías y los negocios de ejemplo usan Unsplash). Anteponerle el
 * origen de la API a una URL absoluta la rompe, así que todo `<img>` del panel pasa por acá.
 */
export function urlCompleta(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined;
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${entorno.origenApi}${ruta}`;
}
