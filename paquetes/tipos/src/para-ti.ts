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
  /** Orden manual entre las destacadas (menor primero); null = por fecha. */
  destacadaOrden: number | null;
  /** Publicada con fecha futura: sale sola en publicadoEn (decisión 0092). */
  programada: boolean;
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

export type MotivoReporte = "publicidad" | "ofensivo" | "enganoso" | "otro";
export const MOTIVOS_REPORTE: Record<MotivoReporte, string> = {
  publicidad: "Es publicidad o spam",
  ofensivo: "Es ofensivo",
  enganoso: "Es engañoso",
  otro: "Otro motivo",
};
/** Con esta cantidad de reportes un comentario se oculta solo hasta que el panel lo revise. */
export const REPORTES_PARA_OCULTAR = 3;

export interface ComentarioPublicacion {
  id: string;
  publicacionId: string;
  texto: string;
  /** "María R." — nombre y la inicial del apellido del vecino; "ELISUR" si es oficial. */
  autorNombre: string;
  creadoEn: string;
  /** Escrito desde el panel: se muestra como ELISUR con la insignia de cuenta oficial. */
  oficial: boolean;
  /** Id del comentario principal al que responde (las respuestas tienen un solo nivel). */
  respuestaA: string | null;
  /** Fijado arriba por ELISUR (uno por publicación). */
  fijado: boolean;
  corazones: number;
  /** Solo en el panel. */
  oculto?: boolean;
  reportes?: number;
  revisado?: boolean;
  motivos?: { motivo: MotivoReporte; cantidad: number }[];
  usuarioId?: string | null;
  autorComunidad?: string | null;
  silenciadoHasta?: string | null;
  /** Un comentario principal de vecino que ya tiene respuesta de ELISUR. */
  respondido?: boolean;
  publicacionTexto?: string;
  publicacionTipo?: TipoPublicacion;
  publicacionMiniatura?: string | null;
  publicacionComentarios?: number;
  publicacionPermiteComentarios?: boolean;
}

export type FiltroComentarios = "reportados" | "todos" | "ocultos" | "sin_responder";
export type ResumenComentarios = Record<FiltroComentarios, number>;

/** Números de Para ti para el inicio del panel: los últimos 7 días contra los 7 anteriores. */
export interface MetricaParaTi {
  clave: "corazones" | "comentarios" | "compartidos" | "visitantes";
  total: number;
  anterior: number;
  /** 7 valores, del más antiguo a hoy. */
  porDia: number[];
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
