import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActividadRescate,
  AvisoMascota,
  AvisoMascotaConPistas,
  DatosAlbergue,
  InicioRescate,
  Mascota,
  MascotaConAlbergue,
  Padrinazgo,
  PistaAviso,
  SolicitudAdopcion,
  TamanoMascota,
} from "@app-vecinos/tipos";
import { ArchivoImagen, apiFetch, apiGet, apiSubirArchivo } from "../api/clienteApi";
import { useSesion } from "../../estado/useSesion";
import { useComunidadActiva } from "../../estado/comunidadActiva";
import { entorno } from "../../config/entorno";
import { useComunidadesActivas } from "./useComunidades";

/** Rescate animal (decisión 0097). Sin API (datos de ejemplo) todo queda vacío. */
const esApi = entorno.fuenteDeDatos === "api";

/** Al entrar directo por un enlace (sin pasar por las pestañas) todavía no hay comunidad elegida:
 * se usa la del vecino o, si no, la primera activa, igual que hace la barra de pestañas. */
function useComunidadId(): string | undefined {
  const elegida = useComunidadActiva((e) => e.comunidad?.id);
  const delVecino = useSesion((e) => e.usuario?.comunidadId);
  const { data: comunidades } = useComunidadesActivas();
  return elegida ?? delVecino ?? comunidades?.[0]?.id;
}

export function useInicioRescate() {
  const comunidadId = useComunidadId();
  return useQuery({
    queryKey: ["rescate", "inicio", comunidadId],
    queryFn: async () => (await apiGet<InicioRescate | null>("/rescate/inicio", { comunidadId })) ?? { mascotas: [], albergues: [], avisos: [] },
    enabled: esApi && Boolean(comunidadId),
  });
}

export function useMascota(id: string | undefined) {
  return useQuery({
    queryKey: ["rescate", "mascota", id],
    queryFn: () => apiGet<(MascotaConAlbergue & { datosAlbergue: DatosAlbergue }) | null>(`/rescate/mascotas/${id}`),
    enabled: esApi && Boolean(id),
  });
}

export function useMascotasDeAlbergue(negocioId: string | undefined, activo: boolean) {
  return useQuery({
    queryKey: ["rescate", "albergue", negocioId],
    queryFn: async () => (await apiGet<Mascota[] | null>(`/rescate/albergues/${negocioId}/mascotas`)) ?? [],
    enabled: esApi && Boolean(negocioId) && activo,
  });
}

/** Con sesión pide la versión que sabe si el aviso es mío (y que lo muestra aunque esté cerrado). */
export function useAvisoMascota(id: string | undefined) {
  const token = useSesion((e) => e.token);
  return useQuery({
    queryKey: ["rescate", "aviso", id, Boolean(token)],
    queryFn: async () => {
      if (!token) return apiGet<AvisoMascotaConPistas | null>(`/rescate/avisos/${id}`);
      try {
        return await apiFetch<AvisoMascotaConPistas>(`/rescate/avisos/${id}/mio`, { token });
      } catch {
        return null;
      }
    },
    enabled: esApi && Boolean(id),
  });
}

export function useActividadRescate() {
  const token = useSesion((e) => e.token);
  return useQuery({
    queryKey: ["rescate", "actividad", token],
    queryFn: () => apiFetch<ActividadRescate>("/rescate/actividad", { token }),
    enabled: esApi && Boolean(token),
  });
}

/** Tras enviar algo, se vuelve a pedir todo lo de Rescate (listas, actividad y detalle). */
export function useRefrescarRescate() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: ["rescate"] });
}

export const solicitarAdopcion = (mascotaId: string, respuestas: Record<string, string>, motivo: string, token: string) =>
  apiFetch<SolicitudAdopcion>(`/rescate/mascotas/${mascotaId}/solicitudes`, { metodo: "POST", cuerpo: { respuestas, motivo }, token });

export const cancelarSolicitud = (id: string, token: string) => apiFetch<SolicitudAdopcion>(`/rescate/solicitudes/${id}/cancelar`, { metodo: "POST", token });

export const apadrinar = (mascotaId: string, monto: number, token: string) =>
  apiFetch<Padrinazgo>(`/rescate/mascotas/${mascotaId}/padrinazgos`, { metodo: "POST", cuerpo: { monto }, token });

export const cancelarPadrinazgo = (id: string, token: string) => apiFetch<Padrinazgo>(`/rescate/padrinazgos/${id}/cancelar`, { metodo: "POST", token });

export const subirFotoAviso = (archivo: ArchivoImagen, token: string) => apiSubirArchivo<{ url: string }>("/rescate/avisos/fotos", archivo, token);

export interface DatosNuevoAviso {
  tipo: AvisoMascota["tipo"];
  especie: AvisoMascota["especie"];
  nombre: string;
  senas: string;
  tamano: TamanoMascota | null;
  recompensa: string;
  fotos: string[];
  lugar: string;
  lat: number | null;
  lng: number | null;
  cuando: string;
  mostrarWhatsapp: boolean;
}

export const crearAviso = (datos: DatosNuevoAviso, token: string) =>
  apiFetch<AvisoMascota>("/rescate/avisos", { metodo: "POST", cuerpo: { ...datos, tamano: datos.tamano ?? undefined }, token });

export const cerrarAviso = (id: string, token: string, reabrir = false) =>
  apiFetch<AvisoMascota>(`/rescate/avisos/${id}/${reabrir ? "reabrir" : "cerrar"}`, { metodo: "POST", token });

export const agregarPista = (avisoId: string, datos: { cuando: string; lugar: string; lat: number | null; lng: number | null; texto: string; fotoUrl: string | null; esMio: boolean }, token: string) =>
  apiFetch<PistaAviso>(`/rescate/avisos/${avisoId}/pistas`, { metodo: "POST", cuerpo: datos, token });

export const reportarAviso = (avisoId: string, motivo: string, token: string) =>
  apiFetch<void>(`/rescate/avisos/${avisoId}/reportar`, { metodo: "POST", cuerpo: { motivo }, token });

/** Solo los avisos abiertos de la comunidad (para el Inicio de la app). */
export function useAvisosMascotas() {
  const comunidadId = useComunidadId();
  return useQuery({
    queryKey: ["rescate", "avisos", comunidadId],
    queryFn: async () => (await apiGet<AvisoMascota[] | null>("/rescate/avisos", { comunidadId })) ?? [],
    enabled: esApi && Boolean(comunidadId),
    staleTime: 60_000,
  });
}
