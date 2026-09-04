export type UbicacionAnuncio = "carrusel_inicio" | "banner_buscar";

export interface Anuncio {
  id: string;
  nombre: string;
  detalle: string;
  imagenUrl: string | null;
  /** En qué pantalla(s) de la app aparece — un mismo anuncio puede vivir en más de un espacio. */
  ubicaciones: UbicacionAnuncio[];
  /** Opcional: si se define, tocar el anuncio abre la ficha de este negocio. */
  negocioId: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  orden: number;
  activo: boolean;
}
