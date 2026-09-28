import { create } from "zustand";

export interface OrigenFoto {
  negocioId: string;
  url: string;
  /** Posición y tamaño de la foto tocada, en coordenadas de la ventana. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
  radio: number;
}

interface EstadoTransicionFoto {
  origen: OrigenFoto | null;
  preparar: (origen: OrigenFoto) => void;
  limpiar: () => void;
}

/**
 * Dónde estaba la foto que se tocó para abrir una ficha — la ficha la lee al montarse y hace
 * crecer una copia de esa foto desde ahí hasta la portada (ver FotoEnVuelo). Solo vive en memoria
 * y se limpia al terminar: no es estado de la app, es un pase de mano entre dos pantallas.
 */
export const useTransicionFoto = create<EstadoTransicionFoto>((set) => ({
  origen: null,
  preparar: (origen) => set({ origen }),
  limpiar: () => set({ origen: null }),
}));
