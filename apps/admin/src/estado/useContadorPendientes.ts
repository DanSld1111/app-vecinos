import { create } from "zustand";
import { apiFetch } from "../datos/clienteApi";

/**
 * Estado aislado solo para el contador del sidebar — a propósito NO reutiliza el array
 * `negocios`/`avisos` de useNegocios/useAvisos. Esas pantallas cargan subconjuntos muy
 * distintos (todos, pendientes, propios, historial) en el mismo campo; si el contador
 * también escribiera ahí, dos fetches concurrentes (el del sidebar y el de la pantalla)
 * competirían por el mismo estado y el que respondiera último "ganaría" de forma
 * impredecible. Aquí el contador tiene su propio cajón, nadie más lo toca.
 */
interface EstadoContadorPendientes {
  negocios: number;
  avisos: number;
  cargar: (token: string) => Promise<void>;
}

export const useContadorPendientes = create<EstadoContadorPendientes>((set) => ({
  negocios: 0,
  avisos: 0,
  cargar: async (token) => {
    try {
      const [negocios, avisos] = await Promise.all([
        apiFetch<unknown[]>("/negocios/pendientes", { token }),
        apiFetch<unknown[]>("/avisos/pendientes", { token }),
      ]);
      set({ negocios: negocios.length, avisos: avisos.length });
    } catch {
      // Si falla, el contador simplemente no se actualiza — no es una acción que el usuario
      // haya pedido, no corresponde mostrarle un error por esto.
    }
  },
}));
