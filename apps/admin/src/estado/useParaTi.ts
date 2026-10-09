import { create } from "zustand";
import { ComentarioPublicacion, ModulosApp, Publicacion } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";
import { useToasts } from "./useToasts";

/** Lo que se envía al guardar una publicación (ver GuardarPublicacionDto en la API). */
export interface DatosPublicacion {
  tipo: Publicacion["tipo"];
  texto: string;
  fotos: string[];
  videoUrl: string | null;
  portadaUrl: string | null;
  enlaceUrl: string | null;
  estado: Publicacion["estado"];
  permiteComentarios: boolean;
  /** 0 = quitar destacada; 1–7 días desde ahora; undefined = no tocar. */
  diasDestacada?: number;
}

/** Alerta de error con el mensaje que dejó la última acción del módulo. */
export function avisarErrorParaTi(titulo: string) {
  useToasts.getState().alertar({ tipo: "error", titulo, detalle: useParaTi.getState().error ?? undefined });
}

const mensaje = (e: unknown, porDefecto: string) => (e instanceof ErrorApi ? e.message : porDefecto);

interface EstadoParaTi {
  publicaciones: Publicacion[];
  comentarios: ComentarioPublicacion[];
  modulos: ModulosApp | null;
  cargando: boolean;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  guardar: (id: string | null, datos: DatosPublicacion, token: string) => Promise<Publicacion | null>;
  eliminar: (id: string, token: string) => Promise<boolean>;
  subirFoto: (archivo: File, token: string) => Promise<string | null>;
  subirVideo: (archivo: File, token: string, onProgreso: (porcentaje: number) => void) => Promise<string | null>;
  vistaPreviaYoutube: (enlace: string, token: string) => Promise<{ enlaceUrl: string; titulo: string | null; miniatura: string } | null>;
  cargarComentarios: (filtro: "reportados" | "todos", token: string) => Promise<void>;
  ocultarComentario: (id: string, oculto: boolean, token: string) => Promise<boolean>;
  eliminarComentario: (id: string, token: string) => Promise<boolean>;
  cargarModulos: () => Promise<void>;
  cambiarModulo: (clave: "comunidad" | "para_ti", activo: boolean, token: string) => Promise<boolean>;
}

export const useParaTi = create<EstadoParaTi>((set, get) => ({
  publicaciones: [],
  comentarios: [],
  modulos: null,
  cargando: false,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const publicaciones = await apiFetch<Publicacion[]>("/para-ti/admin/publicaciones", { token });
      set({ publicaciones, cargando: false });
    } catch (e) {
      set({ cargando: false, error: mensaje(e, "No se pudieron cargar las publicaciones.") });
    }
  },

  guardar: async (id, datos, token) => {
    set({ error: null });
    try {
      const p = await apiFetch<Publicacion>(id ? `/para-ti/admin/publicaciones/${id}` : "/para-ti/admin/publicaciones", {
        metodo: id ? "PATCH" : "POST",
        cuerpo: datos,
        token,
      });
      const resto = get().publicaciones.filter((x) => x.id !== p.id);
      set({ publicaciones: [p, ...resto] });
      return p;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo guardar la publicación.") });
      return null;
    }
  },

  eliminar: async (id, token) => {
    set({ error: null });
    try {
      await apiFetch<void>(`/para-ti/admin/publicaciones/${id}`, { metodo: "DELETE", token });
      set({ publicaciones: get().publicaciones.filter((p) => p.id !== id) });
      return true;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo eliminar la publicación.") });
      return false;
    }
  },

  subirFoto: async (archivo, token) => {
    try {
      const { url } = await apiSubirArchivo<{ url: string }>("/para-ti/admin/fotos", archivo, token);
      return url;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo subir la foto.") });
      return null;
    }
  },

  // El video va directo del navegador al almacenamiento con un permiso de un solo uso: así un
  // archivo grande no pasa por la API (decisión 0091).
  subirVideo: async (archivo, token, onProgreso) => {
    set({ error: null });
    try {
      const { urlSubida, urlPublica } = await apiFetch<{ urlSubida: string; urlPublica: string }>("/para-ti/admin/video/firmar", {
        metodo: "POST",
        cuerpo: { nombre: archivo.name || "video.mp4" },
        token,
      });
      await new Promise<void>((resolver, rechazar) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", urlSubida);
        xhr.setRequestHeader("Content-Type", archivo.type || "video/mp4");
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) onProgreso(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolver()
            : rechazar(
                new Error(
                  xhr.status === 413
                    ? "El video supera el tamaño máximo que permite el almacenamiento. Prueba con uno más liviano o súbelo a YouTube."
                    : `No se pudo subir el video (${xhr.status}).`,
                ),
              );
        xhr.onerror = () => rechazar(new Error("Se cortó la conexión mientras subía el video."));
        xhr.send(archivo);
      });
      onProgreso(100);
      return urlPublica;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "No se pudo subir el video." });
      return null;
    }
  },

  vistaPreviaYoutube: async (enlace, token) => {
    set({ error: null });
    try {
      return await apiFetch<{ enlaceUrl: string; titulo: string | null; miniatura: string }>("/para-ti/admin/youtube", {
        metodo: "POST",
        cuerpo: { enlace },
        token,
      });
    } catch (e) {
      set({ error: mensaje(e, "No se pudo leer ese enlace.") });
      return null;
    }
  },

  cargarComentarios: async (filtro, token) => {
    set({ cargando: true, error: null });
    try {
      const comentarios = await apiFetch<ComentarioPublicacion[]>(`/para-ti/admin/comentarios?filtro=${filtro}`, { token });
      set({ comentarios, cargando: false });
    } catch (e) {
      set({ cargando: false, error: mensaje(e, "No se pudieron cargar los comentarios.") });
    }
  },

  ocultarComentario: async (id, oculto, token) => {
    try {
      await apiFetch<void>(`/para-ti/admin/comentarios/${id}`, { metodo: "PATCH", cuerpo: { oculto }, token });
      set({ comentarios: get().comentarios.map((c) => (c.id === id ? { ...c, oculto } : c)) });
      return true;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo cambiar el comentario.") });
      return false;
    }
  },

  eliminarComentario: async (id, token) => {
    try {
      await apiFetch<void>(`/para-ti/admin/comentarios/${id}`, { metodo: "DELETE", token });
      set({ comentarios: get().comentarios.filter((c) => c.id !== id) });
      return true;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo eliminar el comentario.") });
      return false;
    }
  },

  cargarModulos: async () => {
    try {
      set({ modulos: await apiFetch<ModulosApp>("/modulos") });
    } catch (e) {
      set({ error: mensaje(e, "No se pudieron cargar los módulos.") });
    }
  },

  cambiarModulo: async (clave, activo, token) => {
    set({ error: null });
    try {
      set({ modulos: await apiFetch<ModulosApp>(`/modulos/${clave}`, { metodo: "PATCH", cuerpo: { activo }, token }) });
      return true;
    } catch (e) {
      set({ error: mensaje(e, "No se pudo cambiar el módulo.") });
      return false;
    }
  },
}));

/** Panel que está viendo el super admin: el completo o solo "Para ti" (la vista del editor). */
const CLAVE_PANEL = "elisur-admin-panel";
interface EstadoPanel {
  panel: "admin" | "para-ti";
  cambiar: (panel: "admin" | "para-ti") => void;
}
function panelGuardado(): "admin" | "para-ti" {
  try {
    return localStorage.getItem(CLAVE_PANEL) === "para-ti" ? "para-ti" : "admin";
  } catch {
    return "admin";
  }
}
export const usePanelActivo = create<EstadoPanel>((set) => ({
  panel: panelGuardado(),
  cambiar: (panel) => {
    try {
      localStorage.setItem(CLAVE_PANEL, panel);
    } catch {
      // Sin almacenamiento local: el cambio vale solo para esta pestaña.
    }
    set({ panel });
  },
}));
