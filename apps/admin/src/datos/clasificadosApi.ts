import { CierreClasificado, ClasificadoAdmin, DatosClasificado, SeccionClasificado, SubtipoClasificado } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo } from "./clienteApi";

/** Avisos de vecinos (decisión 0098): la bandeja del equipo de ELISUR. */

export type BandejaClasificados = "revisar" | "publicados" | "por_vencer" | "cerrados";

export interface DatosGuardarClasificado {
  seccion: SeccionClasificado;
  subtipo: SubtipoClasificado;
  titulo: string;
  texto: string;
  fotos: string[];
  referencia: string;
  datos: DatosClasificado;
  contactoNombre: string;
  contactoRol: string;
  contactoWhatsapp: string;
  contactoTelefono: string;
  comunidadId?: string;
}

export const listarClasificados = (bandeja: BandejaClasificados, seccion: SeccionClasificado | null, token: string) =>
  apiFetch<ClasificadoAdmin[]>(`/clasificados/admin?bandeja=${bandeja}${seccion ? `&seccion=${seccion}` : ""}`, { token });

export const resumenClasificados = (token: string) => apiFetch<Record<BandejaClasificados, number>>("/clasificados/admin/resumen", { token });

export const crearClasificado = (datos: DatosGuardarClasificado, token: string) =>
  apiFetch<ClasificadoAdmin>("/clasificados/admin", { metodo: "POST", token, cuerpo: datos });

export const guardarClasificado = (id: string, datos: DatosGuardarClasificado, token: string) =>
  apiFetch<ClasificadoAdmin>(`/clasificados/admin/${id}`, { metodo: "PUT", token, cuerpo: datos });

export const publicarClasificado = (id: string, token: string) => apiFetch<ClasificadoAdmin>(`/clasificados/admin/${id}/publicar`, { metodo: "POST", token });

export const rechazarClasificado = (id: string, motivo: string, token: string) =>
  apiFetch<ClasificadoAdmin>(`/clasificados/admin/${id}/rechazar`, { metodo: "POST", token, cuerpo: { motivo } });

export const cerrarClasificadoAdmin = (id: string, cierre: CierreClasificado, token: string) =>
  apiFetch<ClasificadoAdmin>(`/clasificados/admin/${id}/cerrar`, { metodo: "POST", token, cuerpo: { cierre } });

export const subirFotoClasificado = (archivo: File, token: string) => apiSubirArchivo<{ url: string }>("/clasificados/admin/fotos", archivo, token);

/** wa.me necesita el código de país: a los celulares de 9 dígitos se les agrega el 51. */
export function enlaceWhatsapp(numero: string | null | undefined, texto?: string): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const completo = digitos.length === 9 && digitos.startsWith("9") ? `51${digitos}` : digitos;
  return `https://wa.me/${completo}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}
