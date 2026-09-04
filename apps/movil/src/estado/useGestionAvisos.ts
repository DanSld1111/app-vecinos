import { create } from "zustand";
import { Aviso, CategoriaAviso } from "@app-vecinos/tipos";
import { apiFetch, ErrorApi } from "../datos/api/clienteApi";

interface AvisoAEnviar {
  comunidadId: string;
  fuenteNombre: string;
  titulo: string;
  cuerpo: string;
  categoria: CategoriaAviso;
}

/**
 * Autoservicio de la Junta Vecinal desde la app — mismos endpoints que ya usa
 * `apps/admin` (`useAvisos.ts`: `cargarPropios`/`enviarAValidacion`/`reenviarTrasRechazo`).
 * Publicación directa (sin pasar por validación) sigue siendo solo del panel.
 */
interface EstadoGestionAvisos {
  avisos: Aviso[];
  cargando: boolean;
  error: string | null;
  cargarPropios: (token: string) => Promise<void>;
  enviarAValidacion: (datos: AvisoAEnviar, token: string) => Promise<boolean>;
  reenviarTrasRechazo: (
    id: string,
    datos: { titulo: string; cuerpo: string; categoria: CategoriaAviso },
    token: string,
  ) => Promise<boolean>;
  limpiarError: () => void;
}

function mensajeError(error: unknown, fallback: string): string {
  return error instanceof ErrorApi ? error.message : fallback;
}

export const useGestionAvisos = create<EstadoGestionAvisos>((set) => ({
  avisos: [],
  cargando: false,
  error: null,

  cargarPropios: async (token) => {
    set({ cargando: true, error: null });
    try {
      const avisos = await apiFetch<Aviso[]>("/avisos/mios", { token });
      set({ avisos, cargando: false });
    } catch (error) {
      set({ error: mensajeError(error, "No se pudieron cargar tus avisos."), cargando: false });
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

  limpiarError: () => set({ error: null }),
}));
