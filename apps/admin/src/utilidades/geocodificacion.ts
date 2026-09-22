import { Coordenada } from "@app-vecinos/tipos";

/**
 * Nominatim (OpenStreetMap) para pasar de texto a coordenada y viceversa — mismo criterio que
 * SelectorUbicacion: sin clave de API ni cuenta de facturación. Gratuito con límite de uso justo
 * (~1 req/seg), de sobra para un panel interno con pocas personas escribiendo direcciones a la vez.
 */

const BASE = "https://nominatim.openstreetmap.org";

export interface ResultadoGeocodificacion {
  coordenada: Coordenada;
  etiqueta: string;
}

/** Busca una dirección y devuelve el resultado más cercano al punto de referencia (la comunidad elegida). */
export async function buscarDireccion(
  texto: string,
  cercaDe?: Coordenada,
): Promise<ResultadoGeocodificacion | null> {
  if (!texto.trim()) return null;
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${texto}, Perú`,
    limit: "1",
    countrycodes: "pe",
  });
  // No delimita a la fuerza (bounded=0): solo ordena por cercanía, así una dirección real fuera
  // del radio de la comunidad igual aparece en vez de perderse.
  if (cercaDe) {
    const d = 0.08; // ~9 km — suficiente para priorizar el distrito sin acotar de más.
    params.set("viewbox", `${cercaDe.lng - d},${cercaDe.lat + d},${cercaDe.lng + d},${cercaDe.lat - d}`);
  }
  try {
    const respuesta = await fetch(`${BASE}/search?${params}`, { headers: { Accept: "application/json" } });
    if (!respuesta.ok) return null;
    const filas = (await respuesta.json()) as { lat: string; lon: string; display_name: string }[];
    const fila = filas[0];
    if (!fila) return null;
    return { coordenada: { lat: Number(fila.lat), lng: Number(fila.lon) }, etiqueta: fila.display_name };
  } catch {
    return null;
  }
}

/** Coordenada → dirección legible, para cuando la persona ubica el punto directo en el mapa. */
export async function direccionDesdeCoordenada(coordenada: Coordenada): Promise<string | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(coordenada.lat),
    lon: String(coordenada.lng),
  });
  try {
    const respuesta = await fetch(`${BASE}/reverse?${params}`, { headers: { Accept: "application/json" } });
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as { display_name?: string };
    return datos.display_name ?? null;
  } catch {
    return null;
  }
}
