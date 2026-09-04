import { entorno } from "../config/entorno";

/**
 * Las fotos subidas (negocio, servicio) llegan del servidor como ruta relativa
 * (ej. "/uploads/negocios/xxx.jpg") — hace falta anteponer el origen de la API para que
 * `<Image>` las pueda cargar. Si ya viene con esquema (http/https, ej. una URL externa futura)
 * o es null, se devuelve tal cual.
 */
export function urlCompleta(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined;
  if (/^https?:\/\//.test(ruta)) return ruta;
  return `${entorno.origenApi}${ruta}`;
}
