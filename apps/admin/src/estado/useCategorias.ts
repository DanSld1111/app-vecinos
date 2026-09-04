import { create } from "zustand";
import { Categoria } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";

type CategoriaNueva = { nombre: string; icono: string; arquetipoId?: string };
type CategoriaEditable = { nombre?: string; icono?: string; arquetipoId?: string | null };

interface EstadoCategorias {
  categorias: Categoria[];
  cargando: boolean;
  error: string | null;
  cargar: () => Promise<void>;
  crear: (categoria: CategoriaNueva, token: string) => Promise<boolean>;
  actualizar: (id: string, datos: CategoriaEditable, token: string) => Promise<boolean>;
  subirFoto: (id: string, archivo: File, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useCategorias = create<EstadoCategorias>((set) => ({
  categorias: [],
  cargando: false,
  error: null,

  cargar: async () => {
    set({ cargando: true, error: null });
    try {
      const categorias = await apiFetch<Categoria[]>("/categorias");
      set({ categorias, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar las categorías."), cargando: false });
    }
  },

  crear: async (categoria, token) => {
    try {
      const creada = await apiFetch<Categoria>("/categorias", { metodo: "POST", token, cuerpo: categoria });
      set((estado) => ({ categorias: [...estado.categorias, creada] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo crear la categoría.") });
      return false;
    }
  },

  actualizar: async (id, datos, token) => {
    try {
      const actualizada = await apiFetch<Categoria>(`/categorias/${id}`, { metodo: "PATCH", token, cuerpo: datos });
      set((estado) => ({ categorias: estado.categorias.map((c) => (c.id === id ? actualizada : c)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo guardar la categoría.") });
      return false;
    }
  },

  subirFoto: async (id, archivo, token) => {
    try {
      const actualizada = await apiSubirArchivo<Categoria>(`/categorias/${id}/foto`, archivo, token);
      set((estado) => ({ categorias: estado.categorias.map((c) => (c.id === id ? actualizada : c)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo subir la foto.") });
      return false;
    }
  },
}));
