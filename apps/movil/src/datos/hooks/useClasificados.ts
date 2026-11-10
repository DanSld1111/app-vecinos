import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clasificado, ClasificadoPropio, DatosClasificado, SeccionClasificado, SubtipoClasificado } from "@app-vecinos/tipos";
import { ArchivoImagen, apiFetch, apiGet, apiSubirArchivo } from "../api/clienteApi";
import { useSesion } from "../../estado/useSesion";
import { useComunidadActiva } from "../../estado/comunidadActiva";
import { entorno } from "../../config/entorno";
import { useComunidadesActivas } from "./useComunidades";

/** Avisos de la comunidad (decisión 0098). Sin API (datos de ejemplo) todo queda vacío. */
const esApi = entorno.fuenteDeDatos === "api";

/** Al entrar directo por un enlace todavía no hay comunidad elegida: se usa la del vecino o la
 * primera activa, igual que hace la barra de pestañas. */
export function useComunidadId(): string | undefined {
  const elegida = useComunidadActiva((e) => e.comunidad?.id);
  const delVecino = useSesion((e) => e.usuario?.comunidadId);
  const { data: comunidades } = useComunidadesActivas();
  return elegida ?? delVecino ?? comunidades?.[0]?.id;
}

export interface FiltroClasificados {
  seccion?: SeccionClasificado;
  subtipo?: SubtipoClasificado;
  /** Tipo de inmueble o especie. */
  tipo?: string;
  q?: string;
  limite?: number;
}

export function useClasificados(filtro: FiltroClasificados, activo = true) {
  const comunidadId = useComunidadId();
  return useQuery({
    queryKey: ["clasificados", "lista", comunidadId, filtro],
    queryFn: async () => (await apiGet<Clasificado[] | null>("/clasificados", { comunidadId, ...filtro })) ?? [],
    enabled: esApi && activo && Boolean(comunidadId),
    staleTime: 60_000,
  });
}

export function useClasificado(id: string | undefined) {
  return useQuery({
    queryKey: ["clasificados", "uno", id],
    queryFn: () => apiGet<Clasificado | null>(`/clasificados/${id}`),
    enabled: esApi && Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useMisClasificados() {
  const token = useSesion((e) => e.token);
  return useQuery({
    queryKey: ["clasificados", "mios", token],
    queryFn: () => apiFetch<ClasificadoPropio[]>("/clasificados/mios", { token }),
    enabled: esApi && Boolean(token),
  });
}

/** Tras enviar, renovar o cerrar se vuelve a pedir todo lo de avisos. */
export function useRefrescarClasificados() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: ["clasificados"] });
}

export const subirFotoClasificado = (archivo: ArchivoImagen, token: string) => apiSubirArchivo<{ url: string }>("/clasificados/fotos", archivo, token);

export interface DatosEnvioClasificado {
  seccion: SeccionClasificado;
  subtipo: SubtipoClasificado;
  texto: string;
  fotos: string[];
  whatsapp: string;
  autorizaContacto: boolean;
  datos: DatosClasificado;
}

export const enviarClasificado = (datos: DatosEnvioClasificado, token: string) =>
  apiFetch<ClasificadoPropio>("/clasificados", { metodo: "POST", cuerpo: datos, token });

export const renovarClasificado = (id: string, token: string) => apiFetch<ClasificadoPropio>(`/clasificados/${id}/renovar`, { metodo: "POST", token });

export const cerrarClasificado = (id: string, cierre: string, token: string) =>
  apiFetch<ClasificadoPropio>(`/clasificados/${id}/cerrar`, { metodo: "POST", cuerpo: { cierre }, token });

export const reportarClasificado = (id: string, motivo: string, token: string) =>
  apiFetch<void>(`/clasificados/${id}/reportar`, { metodo: "POST", cuerpo: { motivo }, token });

/** Cuenta el contacto (WhatsApp o llamada). Si falla no importa: el vecino igual sale a WhatsApp. */
export const registrarContacto = (id: string) => apiFetch<void>(`/clasificados/${id}/contacto`, { metodo: "POST" }).catch(() => undefined);
