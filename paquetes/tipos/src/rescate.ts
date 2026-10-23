/**
 * Rescate animal (decisión 0097): adopción y padrinazgo de las mascotas de un albergue, y avisos
 * de mascotas perdidas y encontradas que publican los vecinos.
 */

export type EspecieMascota = "perro" | "gato" | "otro";
export type SexoMascota = "hembra" | "macho";
export type TamanoMascota = "pequeno" | "mediano" | "grande";
export type EstadoMascota = "disponible" | "en_proceso" | "adoptada";
/** "nose" = el albergue todavía no lo sabe. */
export type Convive = "si" | "no" | "nose";

export interface SaludMascota {
  vacunas?: boolean;
  esterilizado?: boolean;
  desparasitado?: boolean;
  microchip?: boolean;
  cuidadosEspeciales?: boolean;
}

export interface ConvivenciaMascota {
  ninos?: Convive;
  perros?: Convive;
  gatos?: Convive;
}

export interface Mascota {
  id: string;
  negocioId: string;
  nombre: string;
  especie: EspecieMascota;
  sexo: SexoMascota;
  edadValor: number | null;
  edadUnidad: "anios" | "meses";
  tamano: TamanoMascota;
  pesoKg: number | null;
  fotoUrl: string | null;
  fotos: string[];
  personalidad: string[];
  salud: SaludMascota;
  convivencia: ConvivenciaMascota;
  historia: string;
  estado: EstadoMascota;
  urgente: boolean;
  apadrinable: boolean;
  orden: number;
  creadoEn: string;
}

/** Lo justo del albergue para mostrar junto a una mascota. */
export interface AlbergueResumen {
  id: string;
  nombre: string;
  fotoPrincipalUrl: string | null;
  whatsapp: string | null;
  direccion: string;
}

export interface MascotaConAlbergue extends Mascota {
  albergue: AlbergueResumen;
}

export interface NecesidadAlbergue {
  que: string;
  tiene: number;
  meta: number;
  unidad: string;
}

export interface TurnoVoluntariado {
  /** "2026-10-25" */
  fecha: string;
  /** "09:00" */
  hora: string;
  que: string;
  /** Cuántas personas faltan. */
  faltan: number;
}

/** Cómo ayudar a un albergue: lo edita el albergue en el panel. */
export interface DatosAlbergue {
  /** Número de Yape o Plin para donaciones y padrinazgos. */
  yape?: string;
  titular?: string;
  /** Aportes sugeridos para apadrinar (S/ al mes). */
  montosPadrinazgo?: number[];
  necesidades?: NecesidadAlbergue[];
  turnos?: TurnoVoluntariado[];
  /** Requisitos para adoptar, en texto. */
  requisitos?: string;
}

export interface Albergue extends AlbergueResumen {
  datos: DatosAlbergue;
  enAdopcion: number;
}

export const PREGUNTAS_ADOPCION = [
  { id: "vivienda", titulo: "¿Dónde vives?", opciones: ["Casa", "Departamento", "Casa con patio"] },
  { id: "propia", titulo: "¿La vivienda es…?", opciones: ["Propia", "Alquilada (el dueño acepta mascotas)", "Alquilada (no sé)"] },
  { id: "ninos", titulo: "¿Hay niños en casa?", opciones: ["Sí", "No"] },
  { id: "otras", titulo: "¿Tienes otras mascotas?", opciones: ["Perro", "Gato", "Ninguna"] },
  { id: "horas", titulo: "¿Cuántas horas al día pasaría sin compañía?", opciones: ["Menos de 4", "4 a 8", "Más de 8"] },
] as const;

export type EstadoSolicitudAdopcion = "nueva" | "entrevista" | "aprobada" | "adoptada" | "no_aprobada" | "cancelada";

export interface SolicitudAdopcion {
  id: string;
  numero: number;
  mascotaId: string;
  mascotaNombre: string;
  mascotaFotoUrl: string | null;
  negocioId: string;
  albergueNombre: string;
  albergueWhatsapp: string | null;
  nombre: string;
  telefono: string;
  /** Clave = id de PREGUNTAS_ADOPCION. */
  respuestas: Record<string, string>;
  motivo: string;
  estado: EstadoSolicitudAdopcion;
  creadoEn: string;
  actualizadoEn: string;
}

export type EstadoPadrinazgo = "por_confirmar" | "activo" | "atrasado" | "cancelado";

export interface Padrinazgo {
  id: string;
  numero: number;
  mascotaId: string;
  mascotaNombre: string;
  mascotaFotoUrl: string | null;
  negocioId: string;
  albergueNombre: string;
  albergueWhatsapp: string | null;
  nombre: string;
  telefono: string;
  monto: number;
  /** "atrasado" se calcula: activo y sin pago hace más de 40 días. */
  estado: EstadoPadrinazgo;
  ultimoPagoEn: string | null;
  creadoEn: string;
}

export type TipoAvisoMascota = "perdido" | "encontrado";
export type EstadoAvisoMascota = "publicado" | "oculto" | "cerrado";

export interface PistaAviso {
  id: string;
  autorNombre: string;
  cuando: string;
  lugar: string;
  lat: number | null;
  lng: number | null;
  texto: string;
  fotoUrl: string | null;
  /** "Es mío": quien escribe dice ser la familia (en avisos de encontrados). */
  esMio: boolean;
  creadoEn: string;
}

export interface AvisoMascota {
  id: string;
  comunidadId: string;
  tipo: TipoAvisoMascota;
  especie: EspecieMascota;
  nombre: string;
  senas: string;
  tamano: TamanoMascota | null;
  recompensa: string;
  fotos: string[];
  lugar: string;
  lat: number | null;
  lng: number | null;
  cuando: string;
  autorNombre: string;
  /** Solo si quien publicó eligió mostrarlo (o si lo pide el panel). */
  telefono: string | null;
  mostrarWhatsapp: boolean;
  estado: EstadoAvisoMascota;
  pistas: number;
  reportes: number;
  /** El vecino que lo ve es quien lo publicó. */
  esMio?: boolean;
  venceEn: string;
  creadoEn: string;
  cerradoEn: string | null;
}

export interface AvisoMascotaConPistas extends AvisoMascota {
  listaPistas: PistaAviso[];
}

/** Lo que el vecino tiene abierto en Rescate animal. */
export interface ActividadRescate {
  solicitudes: SolicitudAdopcion[];
  padrinazgos: Padrinazgo[];
  avisos: AvisoMascota[];
}

/** La pantalla de Rescate animal en una sola petición. */
export interface InicioRescate {
  mascotas: MascotaConAlbergue[];
  albergues: Albergue[];
  avisos: AvisoMascota[];
}

export const ETIQUETA_ESPECIE: Record<EspecieMascota, string> = { perro: "Perro", gato: "Gato", otro: "Otro" };
export const ETIQUETA_TAMANO: Record<TamanoMascota, string> = { pequeno: "Pequeño", mediano: "Mediano", grande: "Grande" };
export const ETIQUETA_ESTADO_MASCOTA: Record<EstadoMascota, string> = { disponible: "Disponible para adopción", en_proceso: "En proceso de adopción", adoptada: "Adoptada" };
export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitudAdopcion, string> = {
  nueva: "Nueva",
  entrevista: "En entrevista",
  aprobada: "Aprobada",
  adoptada: "Adoptada",
  no_aprobada: "No aprobada",
  cancelada: "Cancelada",
};
export const ETIQUETA_ESTADO_PADRINAZGO: Record<EstadoPadrinazgo, string> = { por_confirmar: "Por confirmar", activo: "Activo", atrasado: "Atrasado", cancelado: "Cancelado" };

/** "2 años", "5 meses", "1 año". */
export function edadMascota(m: Pick<Mascota, "edadValor" | "edadUnidad">): string {
  if (m.edadValor === null || m.edadValor === undefined) return "Edad desconocida";
  if (m.edadUnidad === "meses") return m.edadValor === 1 ? "1 mes" : `${m.edadValor} meses`;
  return m.edadValor === 1 ? "1 año" : `${m.edadValor} años`;
}

/** Cachorro (< 1 año), Joven (1–2), Adulto (3–7), Senior (8+). */
export function etapaMascota(m: Pick<Mascota, "edadValor" | "edadUnidad">): "Cachorro" | "Joven" | "Adulto" | "Senior" | null {
  if (m.edadValor === null || m.edadValor === undefined) return null;
  const anios = m.edadUnidad === "meses" ? m.edadValor / 12 : m.edadValor;
  if (anios < 1) return "Cachorro";
  if (anios < 3) return "Joven";
  if (anios < 8) return "Adulto";
  return "Senior";
}

/** "Mediana" / "Mediano" según el sexo. */
export function tamanoMascota(m: Pick<Mascota, "tamano" | "sexo">): string {
  const t = ETIQUETA_TAMANO[m.tamano];
  return m.sexo === "hembra" ? t.replace(/o$/, "a") : t;
}
