import { create } from "zustand";
import { Comunidad, Distrito } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

interface EstadoGeografia {
  distritos: Distrito[];
  comunidades: Comunidad[];
  resultadosBusqueda: Distrito[];
  buscando: boolean;
  cargando: boolean;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  buscarDistritos: (q: string, token: string) => Promise<void>;
  limpiarBusqueda: () => void;
  activarDistrito: (ubigeo: string, token: string) => Promise<Distrito | null>;
  desactivarDistrito: (ubigeo: string, token: string) => Promise<boolean>;
  crearComunidad: (
    datos: { distritoUbigeo: string; nombre: string; descripcion?: string },
    token: string,
  ) => Promise<boolean>;
  activarComunidad: (id: string, token: string) => Promise<boolean>;
  desactivarComunidad: (id: string, token: string) => Promise<boolean>;
  eliminarComunidad: (id: string, token: string) => Promise<boolean>;
}

export const useGeografia = create<EstadoGeografia>((set) => ({
  distritos: [],
  comunidades: [],
  resultadosBusqueda: [],
  buscando: false,
  cargando: false,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const [distritos, comunidades] = await Promise.all([
        apiFetch<Distrito[]>("/distritos", { token }),
        apiFetch<Comunidad[]>("/comunidades/todas", { token }),
      ]);
      set({ distritos, comunidades, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los distritos."), cargando: false });
    }
  },

  buscarDistritos: async (q, token) => {
    if (q.trim().length < 2) {
      set({ resultadosBusqueda: [] });
      return;
    }
    set({ buscando: true });
    try {
      const resultadosBusqueda = await apiFetch<Distrito[]>(
        `/distritos/buscar?q=${encodeURIComponent(q.trim())}`,
        { token },
      );
      set({ resultadosBusqueda, buscando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo buscar el distrito."), buscando: false });
    }
  },

  limpiarBusqueda: () => set({ resultadosBusqueda: [] }),

  activarDistrito: async (ubigeo, token) => {
    try {
      const distrito = await apiFetch<Distrito>(`/distritos/${ubigeo}/activar`, { metodo: "PATCH", token });
      set((estado) => ({
        distritos: estado.distritos.some((d) => d.ubigeo === ubigeo)
          ? estado.distritos.map((d) => (d.ubigeo === ubigeo ? distrito : d))
          : [...estado.distritos, distrito],
        resultadosBusqueda: [],
      }));
      return distrito;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo activar el distrito.") });
      return null;
    }
  },

  desactivarDistrito: async (ubigeo, token) => {
    try {
      const distrito = await apiFetch<Distrito>(`/distritos/${ubigeo}/desactivar`, { metodo: "PATCH", token });
      // `distritos` en este store son los "gestionados" (activos + apagados que ya tuvieron
      // alguna comunidad — mismo criterio que GET /distritos) — se actualiza en el lugar para
      // que siga viéndose en el panel como Inactivo, no desaparece de la lista.
      set((estado) => ({ distritos: estado.distritos.map((d) => (d.ubigeo === ubigeo ? distrito : d)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo desactivar el distrito.") });
      return false;
    }
  },

  crearComunidad: async (datos, token) => {
    try {
      const comunidad = await apiFetch<Comunidad>("/comunidades", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ comunidades: [...estado.comunidades, comunidad] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear la comunidad.") });
      return false;
    }
  },

  activarComunidad: async (id, token) => {
    try {
      const comunidad = await apiFetch<Comunidad>(`/comunidades/${id}/activar`, { metodo: "PATCH", token });
      set((estado) => ({ comunidades: estado.comunidades.map((c) => (c.id === id ? comunidad : c)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo activar la comunidad.") });
      return false;
    }
  },

  desactivarComunidad: async (id, token) => {
    try {
      const comunidad = await apiFetch<Comunidad>(`/comunidades/${id}/desactivar`, { metodo: "PATCH", token });
      set((estado) => ({ comunidades: estado.comunidades.map((c) => (c.id === id ? comunidad : c)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo desactivar la comunidad.") });
      return false;
    }
  },

  eliminarComunidad: async (id, token) => {
    try {
      await apiFetch<void>(`/comunidades/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ comunidades: estado.comunidades.filter((c) => c.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar la comunidad.") });
      return false;
    }
  },
}));
