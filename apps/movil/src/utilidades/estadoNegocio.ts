import { Negocio } from "@app-vecinos/tipos";

export type EstadoVisualNegocio = "activo" | "pendiente" | "rechazado";

/** El motivoRechazo manda: si está presente, el último envío fue rechazado aunque el negocio
 * siga "activo" con su versión anterior. Mismo criterio que apps/admin/src/utilidades/estadoNegocio.ts. */
export function estadoVisualDe(negocio: Negocio): EstadoVisualNegocio {
  if (negocio.motivoRechazo) return "rechazado";
  if (negocio.estado === "activo") return "activo";
  return "pendiente";
}
