/**
 * Avisos de la comunidad (decisión 0098): inmuebles, mascotas y turismo que los vecinos envían y el
 * equipo de ELISUR revisa y publica. En el código se llaman «clasificados» para no confundirlos con
 * los avisos de Comunidad (municipal, junta vecinal, seguridad).
 */
export type SeccionClasificado = "inmuebles" | "mascotas" | "turismo";

/** Inmuebles: alquiler | venta. Mascotas: perdido | encontrado | adopcion. Turismo: el tipo de salida. */
export type SubtipoInmueble = "alquiler" | "venta";
export type SubtipoMascota = "perdido" | "encontrado" | "adopcion";
export type SubtipoTurismo = "full_day" | "varios_dias" | "playa" | "aventura";
export type SubtipoClasificado = SubtipoInmueble | SubtipoMascota | SubtipoTurismo;

export type EstadoClasificado = "pendiente" | "publicado" | "rechazado" | "cerrado";

/** Cómo terminó un aviso que se cerró. */
export type CierreClasificado = "alquilado" | "vendido" | "encontrado" | "adoptado" | "otro";

export type TipoInmueble = "departamento" | "casa" | "habitacion" | "oficina" | "local" | "terreno";
export type EspecieClasificado = "perro" | "gato" | "otro";

/** Los datos ordenados de cada sección. Todos opcionales: el equipo completa lo que el vecino dio. */
export interface DatosClasificado {
  // Inmuebles
  tipoInmueble?: TipoInmueble;
  precio?: number | null;
  moneda?: "PEN" | "USD";
  mantenimiento?: number | null;
  area?: number | null;
  dormitorios?: number | null;
  banos?: number | null;
  cocheras?: number | null;
  amoblado?: boolean;
  aceptaMascotas?: boolean;
  // Mascotas
  especie?: EspecieClasificado;
  nombreMascota?: string;
  lugar?: string;
  cuando?: string;
  // Turismo
  destino?: string;
  duracion?: string;
  /** Fechas de salida, YYYY-MM-DD. */
  salidas?: string[];
  precioPersona?: number | null;
  incluye?: string[];
}

export interface Clasificado {
  id: string;
  comunidadId: string;
  seccion: SeccionClasificado;
  subtipo: SubtipoClasificado;
  titulo: string;
  texto: string;
  fotos: string[];
  /** Zona o referencia: «Av. San Borja Sur, a 1 cuadra de Av. San Luis». */
  referencia: string;
  datos: DatosClasificado;
  /** Quien anuncia: el vecino, o la agencia en turismo. ELISUR solo difunde. */
  contactoNombre: string;
  contactoRol: string;
  contactoWhatsapp: string;
  contactoTelefono: string;
  estado: EstadoClasificado;
  cierre: CierreClasificado | null;
  publicadoEn: string | null;
  venceEn: string | null;
  vistas: number;
  contactos: number;
  creadoEn: string;
}

/** Lo que ve el equipo en el panel, además de lo público. */
export interface ClasificadoAdmin extends Clasificado {
  /** Lo que escribió el vecino, tal cual. */
  textoOriginal: string;
  autorizaContacto: boolean;
  usuarioId: string | null;
  motivoRechazo: string | null;
  reportes: number;
}

/** Lo que ve el vecino en «Mis avisos». */
export interface ClasificadoPropio extends Clasificado {
  motivoRechazo: string | null;
}

export const SECCIONES_CLASIFICADO: Record<SeccionClasificado, string> = {
  inmuebles: "Inmuebles",
  mascotas: "Mascotas",
  turismo: "Turismo",
};

export const SUBTIPOS_CLASIFICADO: Record<SeccionClasificado, { id: SubtipoClasificado; etiqueta: string }[]> = {
  inmuebles: [
    { id: "alquiler", etiqueta: "Alquiler" },
    { id: "venta", etiqueta: "Venta" },
  ],
  mascotas: [
    { id: "perdido", etiqueta: "Perdidos" },
    { id: "encontrado", etiqueta: "Encontrados" },
    { id: "adopcion", etiqueta: "Adopción" },
  ],
  turismo: [
    { id: "full_day", etiqueta: "Full day" },
    { id: "varios_dias", etiqueta: "Varios días" },
    { id: "playa", etiqueta: "Playa" },
    { id: "aventura", etiqueta: "Aventura" },
  ],
};

export const ETIQUETA_SUBTIPO: Record<SubtipoClasificado, string> = {
  alquiler: "Alquiler",
  venta: "Venta",
  perdido: "Se busca",
  encontrado: "Encontrado",
  adopcion: "En adopción",
  full_day: "Full day",
  varios_dias: "Varios días",
  playa: "Playa",
  aventura: "Aventura",
};

export const TIPOS_INMUEBLE: { id: TipoInmueble; etiqueta: string }[] = [
  { id: "departamento", etiqueta: "Departamento" },
  { id: "casa", etiqueta: "Casa" },
  { id: "habitacion", etiqueta: "Habitación" },
  { id: "oficina", etiqueta: "Oficina" },
  { id: "local", etiqueta: "Local" },
  { id: "terreno", etiqueta: "Terreno" },
];

export const ESPECIES_CLASIFICADO: { id: EspecieClasificado; etiqueta: string }[] = [
  { id: "perro", etiqueta: "Perro" },
  { id: "gato", etiqueta: "Gato" },
  { id: "otro", etiqueta: "Otro" },
];

export const CIERRES_CLASIFICADO: Record<SeccionClasificado, { id: CierreClasificado; etiqueta: string }[]> = {
  inmuebles: [
    { id: "alquilado", etiqueta: "Ya se alquiló" },
    { id: "vendido", etiqueta: "Ya se vendió" },
  ],
  mascotas: [
    { id: "encontrado", etiqueta: "Ya apareció" },
    { id: "adoptado", etiqueta: "Ya fue adoptado" },
  ],
  turismo: [{ id: "otro", etiqueta: "Ya no está disponible" }],
};

/** Días que un aviso queda publicado antes de vencer (el vecino puede renovarlo). */
export const DIAS_VIGENCIA_CLASIFICADO = 30;
/** Fotos por aviso. */
export const MAX_FOTOS_CLASIFICADO = 20;

/** «S/ 3,200 al mes», «US$ 180,000», «S/ 129 por persona». null si no hay precio. */
export function precioClasificado(c: Pick<Clasificado, "seccion" | "subtipo" | "datos">): string | null {
  const d = c.datos;
  const monto = c.seccion === "turismo" ? d.precioPersona : d.precio;
  if (monto == null) return null;
  const simbolo = d.moneda === "USD" ? "US$" : "S/";
  const cifra = `${simbolo} ${monto.toLocaleString("en-US")}`;
  if (c.seccion === "turismo") return `${cifra} por persona`;
  if (c.subtipo === "alquiler") return `${cifra} al mes`;
  return cifra;
}

/** Los datos clave en una línea: «3 dorm · 119 m² · 2 cocheras». */
export function resumenClasificado(c: Pick<Clasificado, "seccion" | "datos">): string[] {
  const d = c.datos;
  const partes: string[] = [];
  if (c.seccion === "inmuebles") {
    const tipo = TIPOS_INMUEBLE.find((t) => t.id === d.tipoInmueble)?.etiqueta;
    if (tipo) partes.push(tipo);
    if (d.dormitorios) partes.push(`${d.dormitorios} dorm`);
    if (d.banos) partes.push(`${d.banos} ${d.banos === 1 ? "baño" : "baños"}`);
    if (d.area) partes.push(`${d.area} m²`);
    if (d.cocheras) partes.push(`${d.cocheras} ${d.cocheras === 1 ? "cochera" : "cocheras"}`);
    if (d.amoblado) partes.push("Amoblado");
    if (d.aceptaMascotas) partes.push("Pet friendly");
  } else if (c.seccion === "mascotas") {
    const especie = ESPECIES_CLASIFICADO.find((e) => e.id === d.especie)?.etiqueta;
    if (especie) partes.push(especie);
    if (d.lugar) partes.push(d.lugar);
  } else {
    if (d.destino) partes.push(d.destino);
    if (d.duracion) partes.push(d.duracion);
  }
  return partes;
}
