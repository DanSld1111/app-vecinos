import { create } from "zustand";
import { Aviso, CategoriaAviso } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/clienteApi";

interface AvisoDirecto {
  comunidadId: string;
  fuenteNombre: string;
  fuenteVerificada: boolean;
  titulo: string;
  cuerpo: string;
  categoria: CategoriaAviso;
}

interface AvisoAEnviar {
  comunidadId: string;
  fuenteNombre: string;
  titulo: string;
  cuerpo: string;
  categoria: CategoriaAviso;
}

interface EstadoAvisos {
  avisos: Aviso[];
  cargando: boolean;
  error: string | null;
  /** "Avisos" del super-admin: todo el contenido, sin importar quién lo creó. */
  cargarTodos: (token: string) => Promise<void>;
  /** "Mis avisos": lo que redactó esta cuenta (Junta Vecinal). */
  cargarPropios: (token: string) => Promise<void>;
  /** Cola de validación: pendientes, ya acotados por el servidor al alcance de esta cuenta. */
  cargarPendientes: (token: string) => Promise<void>;
  /** Historial: ya resueltos (publicado/rechazado), acotados por el servidor al alcance de esta cuenta. */
  cargarHistorial: (token: string) => Promise<void>;
  aprobar: (id: string, token: string) => Promise<void>;
  rechazar: (id: string, motivo: string, token: string) => Promise<void>;
  /** Publicación directa por el super-admin — no pasa por la cola de validación. */
  crear: (datos: AvisoDirecto, token: string) => Promise<boolean>;
  eliminar: (id: string, token: string) => Promise<boolean>;
  /** Junta Vecinal redacta y envía — queda "pendiente" hasta que un validador lo revise. */
  enviarAValidacion: (datos: AvisoAEnviar, token: string) => Promise<boolean>;
  /** Edita un aviso propio rechazado y lo vuelve a poner "pendiente" para una nueva revisión. */
  reenviarTrasRechazo: (
    id: string,
    datos: { titulo: string; cuerpo: string; categoria: CategoriaAviso },
    token: string,
  ) => Promise<boolean>;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useAvisos = create<EstadoAvisos>((set) => ({
  avisos: [],
  cargando: false,
  error: null,

  cargarTodos: async (token) => {
    set({ cargando: true, error: null });
    try {
      const avisos = await apiFetch<Aviso[]>("/avisos/todos", { token });
      set({ avisos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los avisos."), cargando: false });
    }
  },

  cargarPropios: async (token) => {
    set({ cargando: true, error: null });
    try {
      const avisos = await apiFetch<Aviso[]>("/avisos/mios", { token });
      set({ avisos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar tus avisos."), cargando: false });
    }
  },

  cargarPendientes: async (token) => {
    set({ cargando: true, error: null });
    try {
      const avisos = await apiFetch<Aviso[]>("/avisos/pendientes", { token });
      set({ avisos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar los avisos pendientes."), cargando: false });
    }
  },

  cargarHistorial: async (token) => {
    set({ cargando: true, error: null });
    try {
      const avisos = await apiFetch<Aviso[]>("/avisos/historial", { token });
      set({ avisos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo cargar el historial de avisos."), cargando: false });
    }
  },

  aprobar: async (id, token) => {
    try {
      await apiFetch(`/avisos/${id}/aprobar`, { metodo: "PATCH", token });
      set((estado) => ({ avisos: estado.avisos.filter((a) => a.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo aprobar el aviso.") });
    }
  },

  rechazar: async (id, motivo, token) => {
    try {
      await apiFetch(`/avisos/${id}/rechazar`, { metodo: "PATCH", token, cuerpo: { motivo } });
      set((estado) => ({ avisos: estado.avisos.filter((a) => a.id !== id) }));
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo rechazar el aviso.") });
    }
  },

  crear: async (datos, token) => {
    try {
      const nuevo = await apiFetch<Aviso>("/avisos/directo", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ avisos: [nuevo, ...estado.avisos] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo publicar el aviso.") });
      return false;
    }
  },

  eliminar: async (id, token) => {
    try {
      await apiFetch(`/avisos/${id}`, { metodo: "DELETE", token });
      set((estado) => ({ avisos: estado.avisos.filter((a) => a.id !== id) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo eliminar el aviso.") });
      return false;
    }
  },

  enviarAValidacion: async (datos, token) => {
    try {
      const nuevo = await apiFetch<Aviso>("/avisos/enviar-a-validacion", { metodo: "POST", token, cuerpo: datos });
      set((estado) => ({ avisos: [nuevo, ...estado.avisos] }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo enviar el aviso a validación.") });
      return false;
    }
  },

  reenviarTrasRechazo: async (id, datos, token) => {
    try {
      const actualizado = await apiFetch<Aviso>(`/avisos/${id}/reenviar`, { metodo: "PATCH", token, cuerpo: datos });
      set((estado) => ({ avisos: estado.avisos.map((a) => (a.id === id ? actualizado : a)) }));
      return true;
    } catch (error) {
      set({ error: mensajeError(error, "No se pudo reenviar el aviso.") });
      return false;
    }
  },
}));
