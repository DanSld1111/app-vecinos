import { create } from "zustand";
import { Anuncio } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";

type AnuncioNuevo = Omit<Anuncio, "id" | "orden" | "activo" | "imagenUrl">;
type AnuncioEditable = Omit<Anuncio, "id" | "orden" | "activo" | "imagenUrl">;

interface EstadoAnuncios {
  anuncios: Anuncio[];
  cargando: boolean;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  crear: (datos: AnuncioNuevo, token: string) => Promise<boolean>;
  actualizar: (id: string, datos: AnuncioEditable, token: string) => Promise<boolean>;
  eliminar: (id: string, token: string) => Promise<boolean>;
  alternarActivo: (id: string, token: string) => Promise<void>;
  subirFoto: (id: string, archivo: File, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useAnuncios = create<EstadoAnuncios>((set, get) => ({
  anuncios: [],
  cargando: false,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const anuncios = await apiFetch<Anuncio[]>("/anuncios/admin", { token });
      set({ anuncios, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los anuncios."), cargando: false });
    }
  },

  crear: async (datos, token) => {
    try {
      const creado = await apiFetch<Anuncio>("/anuncios", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ anuncios: [...estado.anuncios, creado] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear el anuncio.") });
      return false;
    }
  },

  actualizar: async (id, datos, token) => {
    try {
      const actualizado = await apiFetch<Anuncio>(`/anuncios/${id}`, { metodo: "PATCH", token, cuerpo: datos });
      set((estado) => ({ anuncios: estado.anuncios.map((a) => (a.id === id ? actualizado : a)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar el anuncio.") });
      return false;
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch(`/anuncios/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ anuncios: estado.anuncios.filter((a) => a.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar el anuncio.") });
      return false;
    }
  },

  alternarActivo: async (id, token) => {
    const anuncio = get().anuncios.find((a) => a.id === id);
    if (!anuncio) return;
    try {
      const actualizado = await apiFetch<Anuncio>(`/anuncios/${id}`, {
        metodo: "PATCH",
        token,
        cuerpo: { activo: !anuncio.activo },
      });
      set((estado) => ({ anuncios: estado.anuncios.map((a) => (a.id === id ? actualizado : a)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cambiar el estado del anuncio.") });
    }
  },

  subirFoto: async (id, archivo, token) => {
    try {
      const actualizado = await apiSubirArchivo<Anuncio>(`/anuncios/${id}/foto`, archivo, token);
      set((estado) => ({ anuncios: estado.anuncios.map((a) => (a.id === id ? actualizado : a)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto.") });
      return false;
    }
  },
}));
