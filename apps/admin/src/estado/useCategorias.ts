import { create } from "zustand";
import { AtributoProductoDef, AvisoFicha, Categoria, TipoFicha } from "@app-vecinos/tipos";
import { apiFetch, apiSubirArchivo, ErrorApi } from "../datos/clienteApi";

/** Lo que define la ficha de la categoría — ver docs/decisiones/0080-fichas.md. */
type ConfigFicha = {
  /** null = hereda la ficha del servicio. */
  ficha?: TipoFicha | null;
  tituloSeccion?: string | null;
  /** Campos nuevos van con clave vacía: la API la genera. */
  atributosProducto?: AtributoProductoDef[];
  /** null = sin aviso en la ficha. */
  avisoFicha?: AvisoFicha | null;
};
type CategoriaNueva = { nombre: string; icono: string; servicioSlug?: string | null } & ConfigFicha;
type CategoriaEditable = { nombre?: string; icono?: string; servicioSlug?: string | null } & ConfigFicha;

interface EstadoCategorias {
  categorias: Categoria[];
  cargando: boolean;
  error: string | null;
  cargar: () => Promise<void>;
  crear: (categoria: CategoriaNueva, token: string) => Promise<boolean>;
  actualizar: (id: string, datos: CategoriaEditable, token: string) => Promise<boolean>;
  subirFoto: (id: string, archivo: File, token: string) => Promise<boolean>;
  /** Mueve una categoría un lugar antes (-1) o después (1) en la app. */
  mover: (id: string, direccion: -1 | 1, token: string) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useCategorias = create<EstadoCategorias>((set, get) => ({
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

  mover: async (id, direccion, token) => {
    const antes = get().categorias;
    const lista = [...antes].filter((c) => !c.padreId).sort((a, b) => a.orden - b.orden);
    const i = lista.findIndex((c) => c.id === id);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= lista.length) return false;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    // Se ve al instante; si la API falla, vuelve como estaba.
    const conOrden = lista.map((c, n) => ({ ...c, orden: n + 1 }));
    set({ categorias: [...conOrden, ...antes.filter((c) => c.padreId)], error: null });
    try {
      const categorias = await apiFetch<Categoria[]>("/categorias/orden", { metodo: "PUT", token, cuerpo: { ids: lista.map((c) => c.id) } });
      set({ categorias });
      return true;
    } catch (error) {
      set({ categorias: antes, error: mensajeError(error, "No se pudo cambiar el orden.") });
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
