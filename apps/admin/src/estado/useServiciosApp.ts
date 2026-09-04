import { create } from "zustand";
import { EstadoServicioApp, ServicioApp } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";

interface EstadoServiciosApp {
  servicios: ServicioApp[];
  cargando: boolean;
  error: string | null;
  cargar: () => Promise<void>;
  actualizar: (
    slug: string,
    datos: { nombre?: string; descripcion?: string; estado?: EstadoServicioApp },
    token: string,
  ) => Promise<boolean>;
  subirFoto: (slug: string, archivo: File, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useServiciosApp = create<EstadoServiciosApp>((set) => ({
  servicios: [],
  cargando: false,
  error: null,

  cargar: async () => {
    set({ cargando: true, error: null });
    try {
      const servicios = await apiFetch<ServicioApp[]>("/servicios-app");
      set({ servicios, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los servicios."), cargando: false });
    }
  },

  actualizar: async (slug, datos, token) => {
    try {
      const actualizado = await apiFetch<ServicioApp>(`/servicios-app/${slug}`, {
        metodo: "PATCH",
        token,
        cuerpo: datos,
      });
      set((estado) => ({
        servicios: estado.servicios.map((s) => (s.slug === slug ? actualizado : s)),
      }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar el servicio.") });
      return false;
    }
  },

  subirFoto: async (slug, archivo, token) => {
    try {
      const actualizado = await apiSubirArchivo<ServicioApp>(`/servicios-app/${slug}/foto`, archivo, token);
      set((estado) => ({
        servicios: estado.servicios.map((s) => (s.slug === slug ? actualizado : s)),
      }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto.") });
      return false;
    }
  },
}));
