import { AvisoMascota, DatosAlbergue, EstadoSolicitudAdopcion, Mascota, Padrinazgo, SolicitudAdopcion } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo } from "./clienteApi";

/** Rescate animal (decisión 0097): lo del albergue y la moderación de avisos. */

export type DatosMascota = Omit<Mascota, "id" | "negocioId" | "orden" | "creadoEn">;

const base = (negocioId: string) => `/rescate/admin/albergues/${negocioId}`;

export const listarMascotas = (negocioId: string, token: string) => apiFetch<Mascota[]>(`${base(negocioId)}/mascotas`, { token });
export const crearMascota = (negocioId: string, datos: DatosMascota, token: string) =>
  apiFetch<Mascota>(`${base(negocioId)}/mascotas`, { metodo: "POST", token, cuerpo: datos });
export const actualizarMascota = (negocioId: string, id: string, datos: DatosMascota, token: string) =>
  apiFetch<Mascota>(`${base(negocioId)}/mascotas/${id}`, { metodo: "PATCH", token, cuerpo: datos });
export const eliminarMascota = (negocioId: string, id: string, token: string) =>
  apiFetch<void>(`${base(negocioId)}/mascotas/${id}`, { metodo: "DELETE", token });
export const subirFotoMascota = (negocioId: string, archivo: File, token: string) =>
  apiSubirArchivo<{ url: string }>(`${base(negocioId)}/fotos`, archivo, token);

export const leerDatosAlbergue = (negocioId: string, token: string) => apiFetch<DatosAlbergue>(`${base(negocioId)}/datos`, { token });
export const guardarDatosAlbergue = (negocioId: string, datos: DatosAlbergue, token: string) =>
  apiFetch<DatosAlbergue>(`${base(negocioId)}/datos`, { metodo: "PUT", token, cuerpo: datos });

export const listarSolicitudes = (negocioId: string, token: string) => apiFetch<SolicitudAdopcion[]>(`${base(negocioId)}/solicitudes`, { token });
export const cambiarEstadoSolicitud = (negocioId: string, id: string, estado: EstadoSolicitudAdopcion, token: string) =>
  apiFetch<SolicitudAdopcion>(`${base(negocioId)}/solicitudes/${id}`, { metodo: "PATCH", token, cuerpo: { estado } });

export const listarPadrinazgos = (negocioId: string, token: string) => apiFetch<Padrinazgo[]>(`${base(negocioId)}/padrinazgos`, { token });
export const accionPadrinazgo = (negocioId: string, id: string, accion: "confirmar" | "cancelar", token: string) =>
  apiFetch<Padrinazgo>(`${base(negocioId)}/padrinazgos/${id}`, { metodo: "PATCH", token, cuerpo: { accion } });

export type FiltroAvisos = "todos" | "reportados" | "ocultos" | "cerrados";
export const listarAvisosMascotas = (filtro: FiltroAvisos, token: string) => apiFetch<AvisoMascota[]>(`/rescate/admin/avisos?filtro=${filtro}`, { token });
export const moderarAvisoMascota = (id: string, estado: "publicado" | "oculto", token: string) =>
  apiFetch<AvisoMascota>(`/rescate/admin/avisos/${id}`, { metodo: "PATCH", token, cuerpo: { estado } });

/** wa.me necesita el código de país: los celulares peruanos de 9 dígitos se guardan sin él. */
export function enlaceWhatsapp(numero: string | null | undefined, texto?: string): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const completo = digitos.length === 9 && digitos.startsWith("9") ? `51${digitos}` : digitos;
  return `https://wa.me/${completo}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}
