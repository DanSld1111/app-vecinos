import { create } from "zustand";
import { ResultadoPaginado, UsuarioApp } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

interface EstadoUsuarios {
  usuarios: UsuarioApp[];
  cargando: boolean;
  cargandoMas: boolean;
  /** null = no hay más páginas (o todavía no se cargó nada). Antes el listado traía todo de
   * una sola vez, sin límite — ver docs/decisiones/0021-endurecimiento-post-diagnostico.md. */
  cursorSiguiente: string | null;
  error: string | null;
  cargar: (token: string) => Promise<void>;
  cargarMas: (token: string) => Promise<void>;
  alternarBloqueo: (id: string, token: string) => Promise<void>;
  eliminar: (id: string, token: string) => Promise<void>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useUsuarios = create<EstadoUsuarios>((set, get) => ({
  usuarios: [],
  cargando: false,
  cargandoMas: false,
  cursorSiguiente: null,
  error: null,

  cargar: async (token) => {
    set({ cargando: true, error: null });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<UsuarioApp>>("/usuarios", { token });
      set({ usuarios: items, cursorSiguiente, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los vecinos."), cargando: false });
    }
  },

  cargarMas: async (token) => {
    const cursor = get().cursorSiguiente;
    if (!cursor) return;
    set({ cargandoMas: true });
    try {
      const { items, cursorSiguiente } = await apiFetch<ResultadoPaginado<UsuarioApp>>(
        `/usuarios?cursor=${encodeURIComponent(cursor)}`,
        { token },
      );
      set((estado) => ({ usuarios: [...estado.usuarios, ...items], cursorSiguiente, cargandoMas: false }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar más vecinos."), cargandoMas: false });
    }
  },

  alternarBloqueo: async (id, token) => {
    try {
      const actualizado = await apiFetch<UsuarioApp>(`/usuarios/${id}/alternar-bloqueo`, { metodo: "PATCH", token });
      set((estado) => ({ usuarios: estado.usuarios.map((u) => (u.id === id ? actualizado : u)) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo actualizar el estado del vecino.") });
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch(`/usuarios/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ usuarios: estado.usuarios.filter((u) => u.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar al vecino.") });
    }
  },
}));
