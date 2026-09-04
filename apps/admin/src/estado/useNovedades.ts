import { create } from "zustand";
import { Novedad } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

interface EstadoNovedades {
  novedades: Novedad[];
  cargando: boolean;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  crear: (titulo: string, texto: string, token: string) => Promise<boolean>;
  actualizar: (id: string, titulo: string, texto: string, token: string) => Promise<boolean>;
  eliminar: (id: string, token: string) => Promise<boolean>;
  alternarActivo: (id: string, token: string) => Promise<boolean>;
}

export const useNovedades = create<EstadoNovedades>((set, get) => ({
  novedades: [],
  cargando: false,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const novedades = await apiFetch<Novedad[]>("/novedades/admin", { token });
      set({ novedades, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar las novedades."), cargando: false });
    }
  },

  crear: async (titulo, texto, token) => {
    try {
      const creada = await apiFetch<Novedad>("/novedades", { metodo: "POST", token, cuerpo: { titulo, texto } });
      set((estado) => ({ novedades: [creada, ...estado.novedades] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo publicar la novedad.") });
      return false;
    }
  },

  actualizar: async (id, titulo, texto, token) => {
    try {
      const actualizada = await apiFetch<Novedad>(`/novedades/${id}`, {
        metodo: "PATCH",
        token,
        cuerpo: { titulo, texto },
      });
      set((estado) => ({ novedades: estado.novedades.map((n) => (n.id === id ? actualizada : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar la novedad.") });
      return false;
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch<{ ok: true }>(`/novedades/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ novedades: estado.novedades.filter((n) => n.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar la novedad.") });
      return false;
    }
  },

  alternarActivo: async (id, token) => {
    const actual = get().novedades.find((n) => n.id === id);
    if (!actual) return false;
    try {
      const actualizada = await apiFetch<Novedad>(`/novedades/${id}`, {
        metodo: "PATCH",
        token,
        cuerpo: { activo: !actual.activo },
      });
      set((estado) => ({ novedades: estado.novedades.map((n) => (n.id === id ? actualizada : n)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cambiar la visibilidad.") });
      return false;
    }
  },
}));
