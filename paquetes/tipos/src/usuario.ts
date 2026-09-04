export type EstadoUsuarioApp = "activo" | "bloqueado";

/**
 * Vecino que se registró desde la app móvil (FlujoLogin: correo + clave, sin SMS —
 * ver docs/decisiones/0010-registro-vecinos-correo-clave.md). Distinto de `Cuenta` —
 * Cuenta es para roles internos del panel (super_admin, dueno_negocio, junta_vecinal,
 * validador_contenido). UsuarioApp es el usuario final de la app.
 */
export interface UsuarioApp {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  comunidadId: string;
  estado: EstadoUsuarioApp;
  registradoEn: string;
  ultimoAccesoEn: string | null;
}
