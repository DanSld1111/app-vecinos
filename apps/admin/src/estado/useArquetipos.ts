import { create } from "zustand";
import { Arquetipo, CampoArquetipo } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

interface EstadoArquetipos {
  arquetipos: Arquetipo[];
  cargando: boolean;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  crear: (
    datos: { nombre: string; icono: string; plantillaId: string; campos: CampoArquetipo[] },
    token: string,
  ) => Promise<boolean>;
  actualizar: (
    id: string,
    datos: { nombre: string; icono: string; campos: CampoArquetipo[] },
    token: string,
  ) => Promise<boolean>;
  eliminar: (id: string, token: string) => Promise<boolean>;
}

export const useArquetipos = create<EstadoArquetipos>((set) => ({
  arquetipos: [],
  cargando: false,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const arquetipos = await apiFetch<Arquetipo[]>("/arquetipos", { token });
      set({ arquetipos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los arquetipos."), cargando: false });
    }
  },

  crear: async (datos, token) => {
    try {
      const creado = await apiFetch<Arquetipo>("/arquetipos", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ arquetipos: [...estado.arquetipos, creado] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear el arquetipo.") });
      return false;
    }
  },

  actualizar: async (id, datos, token) => {
    try {
      const actualizado = await apiFetch<Arquetipo>(`/arquetipos/${id}`, { metodo: "PATCH", token, cuerpo: datos });
      set((estado) => ({ arquetipos: estado.arquetipos.map((a) => (a.id === id ? actualizado : a)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar el arquetipo.") });
      return false;
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch<{ ok: true }>(`/arquetipos/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ arquetipos: estado.arquetipos.filter((a) => a.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar el arquetipo.") });
      return false;
    }
  },
}));
