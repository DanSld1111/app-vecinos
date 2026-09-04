import { create } from "zustand";

/**
 * Marca personal de "me interesa" por aviso, solo en memoria de esta sesión.
 * El conteo mostrado en cada tarjeta = semilla del mock + este toggle local.
 * No hay backend todavía que agregue el "me interesa" real entre vecinos (Etapa 2).
 */
interface EstadoMeInteresa {
  marcados: Set<string>;
  alternar: (avisoId: string) => void;
}

export const useMeInteresa = create<EstadoMeInteresa>((set) => ({
  marcados: new Set(),
  alternar: (avisoId) =>
    set((estado) => {
      const marcados = new Set(estado.marcados);
      if (marcados.has(avisoId)) {
        marcados.delete(avisoId);
      } else {
        marcados.add(avisoId);
      }
      return { marcados };
    }),
}));
