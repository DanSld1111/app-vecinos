/**
 * Módulo "Para ti" (decisión 0091): publicaciones para todos los distritos — texto, fotos, video
 * subido o enlace de YouTube — con corazones, compartir, comentarios por publicación y destacadas.
 */
export type TipoPublicacion = "texto" | "fotos" | "video" | "youtube";
export type EstadoPublicacion = "borrador" | "publicada";

/** Máximo de destacadas visibles arriba y días que puede durar una. */
export const MAX_DESTACADAS = 10;
export const DIAS_DESTACADA_MAX = 7;
export const MAX_FOTOS_PUBLICACION = 10;

export interface Publicacion {
  id: string;
  tipo: TipoPublicacion;
  texto: string;
  /** Solo en tipo "fotos", en orden. */
  fotos: string[];
  /** Solo en tipo "video": el archivo subido y su portada (opcional). */
  videoUrl: string | null;
  portadaUrl: string | null;
  /** Solo en tipo "youtube": el enlace y su vista previa. */
  enlaceUrl: string | null;
  enlaceTitulo: string | null;
  enlaceMiniatura: string | null;
  estado: EstadoPublicacion;
  permiteComentarios: boolean;
  /** null = no está destacada. Si ya pasó, deja de estarlo. */
  destacadaHasta: string | null;
  corazones: number;
  compartidos: number;
  /** Comentarios visibles (no ocultos). */
  comentarios: number;
  /** Por ahora siempre "ELISUR". */
  autor: string;
  creadoEn: string;
  publicadoEn: string | null;
  actualizadoEn: string;
}

export interface ComentarioPublicacion {
  id: string;
  publicacionId: string;
  texto: string;
  /** "María R." — nombre y la inicial del apellido del vecino. */
  autorNombre: string;
  creadoEn: string;
  /** Solo en el panel. */
  oculto?: boolean;
  reportes?: number;
  publicacionTexto?: string;
}

/** Pestañas que se encienden y apagan desde el panel. */
export interface ModulosApp {
  comunidad: boolean;
  paraTi: boolean;
}

/** El id de un video de YouTube a partir de su enlace (watch, youtu.be, shorts o embed), o null. */
export function idYoutube(enlace: string | null | undefined): string | null {
  if (!enlace) return null;
  const m = enlace.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
