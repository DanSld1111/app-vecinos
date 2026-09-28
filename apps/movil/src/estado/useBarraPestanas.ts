import { create } from "zustand";

interface EstadoBarraPestanas {
  /** true mientras el vecino baja por una lista: la barra se esconde para dejar más espacio a las fotos. */
  oculta: boolean;
  /** Alto real de la barra (incluye el borde inferior seguro del teléfono), para que las listas no queden tapadas. */
  altura: number;
  /** Hasta cuándo el vecino ya vio Comunidad — las alertas de seguridad posteriores encienden el punto de la pestaña. */
  comunidadVistaHasta: string | null;
  setOculta: (oculta: boolean) => void;
  setAltura: (altura: number) => void;
  marcarComunidadVista: () => void;
}

export const useBarraPestanas = create<EstadoBarraPestanas>((set, get) => ({
  oculta: false,
  altura: 64,
  comunidadVistaHasta: null,
  setOculta: (oculta) => {
    if (get().oculta !== oculta) set({ oculta });
  },
  setAltura: (altura) => {
    if (Math.abs(get().altura - altura) > 0.5) set({ altura });
  },
  marcarComunidadVista: () => set({ comunidadVistaHasta: new Date().toISOString() }),
}));
