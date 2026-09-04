import { Negocio } from "@app-vecinos/tipos";

export type EstadoVisualNegocio = "activo" | "pendiente" | "rechazado";

/** El motivoRechazo manda: si está presente, el último envío fue rechazado aunque el negocio siga "activo" con su versión anterior. */
export function estadoVisualDe(negocio: Negocio): EstadoVisualNegocio {
  if (negocio.motivoRechazo) return "rechazado";
  if (negocio.estado === "activo") return "activo";
  return "pendiente";
}

export const ETIQUETA_ESTADO_VISUAL: Record<EstadoVisualNegocio, string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  rechazado: "Rechazado",
};

export const ICONO_ESTADO_VISUAL: Record<EstadoVisualNegocio, string> = {
  activo: "✅",
  pendiente: "⏳",
  rechazado: "✕",
};
