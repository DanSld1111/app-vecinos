export type EstadoServicioApp = "disponible" | "proximamente";

/**
 * Contenido editable de una tarjeta de la pantalla "Servicios" — el slug, a qué pantalla navega
 * y qué ícono usa siguen fijos en el código de apps/movil; esto es solo lo que un super-admin
 * puede cambiar desde el panel (nombre, descripción, si está disponible, y la foto de fondo).
 */
export interface ServicioApp {
  slug: string;
  nombre: string;
  descripcion: string;
  estado: EstadoServicioApp;
  fotoUrl: string | null;
  orden: number;
  /** Negocios activos de este servicio (por sus categorías — ver categorias.servicioSlug) — 0
   * para servicios que no son un directorio de negocio (Taxi, Bolsa de empleo, etc.). Ver
   * docs/decisiones/0074-servicios-real.md. */
  negocios: number;
  /** Aperturas de este servicio en los últimos 7 días — sube con POST /servicios-app/:slug/visitas.
   * Se usa para ordenar "Explora por rubro" por uso real. */
  visitas7d: number;
}
