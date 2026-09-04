import { PaletaColores } from "../disenio";

export type GrupoNotificacion = "comunidad" | "negocios" | "app";

export interface CategoriaNotificacion {
  id: string;
  grupo: GrupoNotificacion;
  nombre: string;
  descripcion: string;
  emoji: string;
  colorFondo: string;
  colorTexto: string;
  /** Si empieza activada por defecto la primera vez que el usuario abre los ajustes. */
  porDefecto: boolean;
}

export const GRUPOS_NOTIFICACION: { id: GrupoNotificacion; nombre: string }[] = [
  { id: "comunidad", nombre: "Comunidad" },
  { id: "negocios", nombre: "Negocios" },
  { id: "app", nombre: "App" },
];

interface BaseCategoria {
  id: string;
  grupo: GrupoNotificacion;
  nombre: string;
  descripcion: string;
  emoji: string;
  porDefecto: boolean;
  /** Cuál color usar de la paleta activa (o "mostaza", el único tono que no forma parte de PaletaColores). */
  color: "acento" | "primario" | "mostaza" | "neutro";
}

/**
 * Lista abierta a propósito: para agregar una categoría nueva de notificación
 * (para Comunidad, Negocios, App o un grupo nuevo) solo hace falta un objeto más aquí —
 * la pantalla de ajustes y el feed de Notificaciones la recogen solas.
 */
const CATEGORIAS_BASE: BaseCategoria[] = [
  {
    id: "seguridad",
    grupo: "comunidad",
    nombre: "Alertas de seguridad",
    descripcion: "Serenazgo y emergencias del vecindario.",
    emoji: "🚨",
    color: "acento",
    porDefecto: true,
  },
  {
    id: "avisos_municipales",
    grupo: "comunidad",
    nombre: "Avisos municipales y junta vecinal",
    descripcion: "Cortes de servicio, reuniones, campañas.",
    emoji: "🏛️",
    color: "mostaza",
    porDefecto: true,
  },
  {
    id: "ofertas",
    grupo: "negocios",
    nombre: "Ofertas y promociones",
    descripcion: "Descuentos de negocios cerca de ti.",
    emoji: "🎉",
    color: "primario",
    porDefecto: true,
  },
  {
    id: "nuevos_negocios",
    grupo: "negocios",
    nombre: "Nuevos negocios en tu zona",
    descripcion: "Cuando se suma un negocio verificado.",
    emoji: "🏪",
    color: "primario",
    porDefecto: false,
  },
  {
    id: "novedades",
    grupo: "app",
    nombre: "Novedades de la app",
    descripcion: "Funciones nuevas y mejoras.",
    emoji: "✨",
    color: "neutro",
    porDefecto: true,
  },
];

/** Ids y valores por defecto, sin depender de ninguna paleta — lo único que necesita useNotificaciones.ts. */
export const IDS_CATEGORIAS_NOTIFICACION = CATEGORIAS_BASE.map((c) => ({ id: c.id, porDefecto: c.porDefecto }));

function coloresPara(color: BaseCategoria["color"], colores: PaletaColores, oscuro: boolean) {
  switch (color) {
    case "acento":
      return { colorFondo: colores.acentoSuave, colorTexto: colores.acentoFuerte };
    case "primario":
      return { colorFondo: colores.primarioSuave, colorTexto: colores.primarioFuerte };
    case "neutro":
      return { colorFondo: colores.superficieHundida2, colorTexto: colores.textoSuave };
    case "mostaza":
      // Mismo tono decorativo que OfertasPasillosNegocio.tsx — a propósito fuera de PaletaColores.
      return oscuro ? { colorFondo: "#3a3018", colorTexto: "#e0b565" } : { colorFondo: "#f6ecd6", colorTexto: "#b8862e" };
  }
}

/** Lista completa con colores ya resueltos para la paleta activa — usarla en las pantallas (nunca CATEGORIAS_BASE directo). */
export function obtenerCategoriasNotificacion(colores: PaletaColores, oscuro: boolean): CategoriaNotificacion[] {
  return CATEGORIAS_BASE.map((base) => ({ ...base, ...coloresPara(base.color, colores, oscuro) }));
}
