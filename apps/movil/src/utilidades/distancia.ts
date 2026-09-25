import { Coordenada } from "@app-vecinos/tipos";
import { useComunidadActiva } from "../estado/comunidadActiva";

// Respaldo final si todavía no hay comunidad activa cargada (ej. primer render).
// En condiciones normales se usa Comunidad.centro de la comunidad activa —
// mientras no se capture la ubicación real del vecino (Etapa 1, sin geolocalización activa todavía).
const CENTRO_RESPALDO: Coordenada = { lat: -12.0464, lng: -77.0428 };

const VELOCIDAD_CAMINANDO_M_POR_MIN = 80;

function metrosEntre(a: Coordenada, b: Coordenada): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function minutosCaminando(destino: Coordenada, origen?: Coordenada): number {
  const puntoDeReferencia =
    origen ?? useComunidadActiva.getState().comunidad?.centro ?? CENTRO_RESPALDO;
  const metros = metrosEntre(puntoDeReferencia, destino);
  return Math.max(1, Math.round(metros / VELOCIDAD_CAMINANDO_M_POR_MIN));
}

/** "320 m" bajo 1km, "1.2 km" de ahí para arriba — para mostrar la distancia real que ya calculó
 * el backend (Negocio.distanciaM), no una aproximación local. */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}
