export type CategoriaAviso = "municipal" | "junta_vecinal" | "seguridad" | "otro";
export type EstadoAviso = "pendiente" | "publicado" | "rechazado";

export interface Aviso {
  id: string;
  comunidadId: string;
  fuenteNombre: string;
  fuenteVerificada: boolean;
  titulo: string;
  cuerpo: string;
  categoria: CategoriaAviso;
  estado: EstadoAviso;
  /** Cuenta (Junta vecinal o Super-admin) que redactó el aviso. */
  creadoPorCuentaId: string;
  /** Cuenta (Validador de contenido) que aprobó o rechazó. null mientras esté "pendiente". */
  validadoPorCuentaId: string | null;
  /** Motivo del rechazo. null si está publicado o pendiente. */
  motivoRechazo: string | null;
  publicadoEn: string;
  /** Foto real subida por la fuente. null si aún no se subió ninguna (nunca se fabrica una foto de relleno). */
  imagenUrl: string | null;
  /** Conteo semilla de "me interesa". Hasta que exista backend (Etapa 2) no se agrega entre usuarios reales. */
  meGusta: number;
  /** Conteo semilla de veces compartido. Mismo criterio que meGusta: semilla + toggle/incremento local, sin agregación real todavía. */
  compartidos: number;
}
