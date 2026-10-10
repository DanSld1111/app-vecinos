import { Platform, Share } from "react-native";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ComentarioPublicacion, ModulosApp, MotivoReporte, Publicacion } from "@app-vecinos/tipos";
import { apiFetch, apiGet } from "../api/clienteApi";
import { useSesion } from "../../estado/useSesion";
import { entorno } from "../../config/entorno";

const esApi = entorno.fuenteDeDatos === "api";

/** Mientras carga (o en modo de datos de ejemplo), Comunidad visible y Para ti oculto. */
export const MODULOS_POR_DEFECTO: ModulosApp = { comunidad: true, paraTi: false };

/** Qué pestañas encendió el super admin (decisión 0091). Se vuelve a pedir al volver a la app. */
export function useModulos(): ModulosApp & { cargado: boolean } {
  const { data } = useQuery({
    queryKey: ["modulos"],
    queryFn: () => apiGet<ModulosApp>("/modulos"),
    enabled: esApi,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  return { ...(data ?? MODULOS_POR_DEFECTO), cargado: !esApi || data !== undefined };
}

/** El muro. `q` = buscador; `videos` = solo videos (la vista en vertical, decisión 0092). */
export function usePublicacionesParaTi(activo: boolean, filtros: { q?: string; videos?: boolean } = {}) {
  const q = filtros.q?.trim() || undefined;
  return useInfiniteQuery({
    queryKey: ["para-ti", "feed", q ?? "", filtros.videos ? "videos" : "todo"],
    // apiGet devuelve null en un 404 (módulo apagado): se trata como lista vacía.
    queryFn: async ({ pageParam }) =>
      (await apiGet<{ items: Publicacion[]; cursorSiguiente: string | null } | null>("/para-ti/publicaciones", {
        antesDe: pageParam ?? undefined,
        q,
        videos: filtros.videos ? "1" : undefined,
      })) ?? {
        items: [],
        cursorSiguiente: null,
      },
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => ultima.cursorSiguiente,
    enabled: esApi && activo,
  });
}

export function useDestacadas(activo: boolean) {
  return useQuery({
    queryKey: ["para-ti", "destacadas"],
    queryFn: async () => (await apiGet<Publicacion[] | null>("/para-ti/destacadas")) ?? [],
    enabled: esApi && activo,
  });
}

export function usePublicacion(id: string | undefined) {
  return useQuery({
    queryKey: ["para-ti", "publicacion", id],
    queryFn: () => apiGet<Publicacion>(`/para-ti/publicaciones/${id}`),
    enabled: esApi && Boolean(id),
  });
}

export function useComentarios(id: string | undefined, permitidos: boolean) {
  return useQuery({
    queryKey: ["para-ti", "comentarios", id],
    queryFn: async () => (await apiGet<ComentarioPublicacion[] | null>(`/para-ti/publicaciones/${id}/comentarios`)) ?? [],
    enabled: esApi && Boolean(id) && permitidos,
  });
}

/** Ids de las publicaciones a las que este vecino ya les dio corazón. */
export function useMisCorazones() {
  const token = useSesion((e) => e.token);
  return useQuery({
    queryKey: ["para-ti", "mis-corazones", token],
    queryFn: () => apiFetch<string[]>("/para-ti/corazones", { token }),
    enabled: esApi && Boolean(token),
  });
}

/** Actualiza el conteo de corazones de una publicación en todas las listas ya cargadas. */
export function useActualizarPublicacionEnCache() {
  const cliente = useQueryClient();
  return (id: string, cambio: (p: Publicacion) => Publicacion) => {
    cliente.setQueriesData<{ pages: { items: Publicacion[]; cursorSiguiente: string | null }[]; pageParams: unknown[] }>(
      { queryKey: ["para-ti", "feed"] },
      (datos) => (datos ? { ...datos, pages: datos.pages.map((pg) => ({ ...pg, items: pg.items.map((p) => (p.id === id ? cambio(p) : p)) })) } : datos),
    );
    cliente.setQueryData<Publicacion[]>(["para-ti", "destacadas"], (lista) => lista?.map((p) => (p.id === id ? cambio(p) : p)));
    cliente.setQueryData<Publicacion>(["para-ti", "publicacion", id], (p) => (p ? cambio(p) : p));
  };
}

export async function alternarCorazon(id: string, token: string, tieneCorazon: boolean): Promise<number> {
  const r = await apiFetch<{ corazones: number }>(`/para-ti/publicaciones/${id}/corazon`, { metodo: tieneCorazon ? "DELETE" : "POST", token });
  return r.corazones;
}

export function comentar(id: string, texto: string, token: string, respuestaA?: string): Promise<ComentarioPublicacion> {
  return apiFetch<ComentarioPublicacion>(`/para-ti/publicaciones/${id}/comentarios`, {
    metodo: "POST",
    cuerpo: { texto, ...(respuestaA ? { respuestaA } : {}) },
    token,
  });
}

export function reportarComentario(comentarioId: string, token: string, motivo: MotivoReporte): Promise<void> {
  return apiFetch<void>(`/para-ti/comentarios/${comentarioId}/reportar`, { metodo: "POST", cuerpo: { motivo }, token });
}

/** Comentarios de una publicación a los que este vecino ya les dio corazón. */
export function useMisCorazonesEnComentarios(publicacionId: string | undefined) {
  const token = useSesion((e) => e.token);
  return useQuery({
    queryKey: ["para-ti", "corazones-comentarios", publicacionId, token],
    queryFn: () => apiFetch<string[]>(`/para-ti/publicaciones/${publicacionId}/comentarios/corazones`, { token }),
    enabled: esApi && Boolean(token) && Boolean(publicacionId),
  });
}

export async function alternarCorazonComentario(comentarioId: string, token: string, tieneCorazon: boolean): Promise<number> {
  const r = await apiFetch<{ corazones: number }>(`/para-ti/comentarios/${comentarioId}/corazon`, { metodo: tieneCorazon ? "DELETE" : "POST", token });
  return r.corazones;
}

/** Un id al azar de este celular (no identifica a la persona) para contar visitas por día. */
function idVisitante(): string {
  const clave = "elisur-visitante";
  try {
    const guardado = globalThis.localStorage?.getItem(clave);
    if (guardado) return guardado;
    const nuevo = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    globalThis.localStorage?.setItem(clave, nuevo);
    return nuevo;
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}
let visitaRegistrada = "";
/** Avisa una vez por día que este celular abrió Para ti (decisión 0092). */
export function registrarVisitaParaTi() {
  if (!esApi) return;
  const hoy = new Date().toDateString();
  if (visitaRegistrada === hoy) return;
  visitaRegistrada = hoy;
  apiFetch<void>("/para-ti/visita", { metodo: "POST", cuerpo: { visitante: idVisitante() } }).catch(() => {
    visitaRegistrada = "";
  });
}

/** Enlace propio de la publicación: abre la app web en esa publicación. */
export const enlacePublicacion = (id: string) => `https://dawan.dev/para-ti/${id}`;

/** Abre el menú de compartir del celular (o del navegador) y cuenta el compartido. */
export async function compartirPublicacion(p: Publicacion): Promise<boolean> {
  const url = enlacePublicacion(p.id);
  const texto = p.texto ? `${p.texto.slice(0, 140)}${p.texto.length > 140 ? "…" : ""}` : "Mira esta publicación en ELISUR";
  try {
    if (Platform.OS === "web") {
      const nav = globalThis.navigator as Navigator | undefined;
      if (nav?.share) await nav.share({ title: "ELISUR · Para ti", text: texto, url });
      else if (nav?.clipboard) await nav.clipboard.writeText(url);
      else return false;
    } else {
      const r = await Share.share({ message: `${texto}\n\n${url}`, url });
      if (r.action === Share.dismissedAction) return false;
    }
  } catch {
    return false;
  }
  apiFetch<void>(`/para-ti/publicaciones/${p.id}/compartir`, { metodo: "POST" }).catch(() => {});
  return true;
}
