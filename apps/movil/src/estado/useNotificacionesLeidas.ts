import { create } from "zustand";

/** Qué notificaciones ya se vieron, solo en memoria de esta sesión (no persiste entre aperturas de la app). */
interface EstadoNotificacionesLeidas {
  leidas: Set<string>;
  marcarLeida: (id: string) => void;
}

export const useNotificacionesLeidas = create<EstadoNotificacionesLeidas>((set) => ({
  leidas: new Set(),
  marcarLeida: (id) =>
    set((estado) => {
      if (estado.leidas.has(id)) return estado;
      const leidas = new Set(estado.leidas);
      leidas.add(id);
      return { leidas };
    }),
}));
