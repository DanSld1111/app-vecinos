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
}
