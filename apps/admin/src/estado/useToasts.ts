import { create } from "zustand";

export type TipoToast = "exito" | "error";

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

let siguienteId = 1;

interface EstadoToasts {
  toasts: Toast[];
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
  cerrar: (id: number) => void;
}

/**
 * Confirmaciones tipo "ventana emergente" para acciones que antes solo cambiaban algo en
 * silencio (guardar, enviar a la papelera, etc.) — se apilan y cada una se cierra sola a los
 * pocos segundos, o al tocarla. Nombre "Toast" a propósito, distinto de useAvisos.ts (que es
 * el store de Avisos vecinales — otra cosa por completo, aunque suene parecido).
 */
export const useToasts = create<EstadoToasts>((set, get) => ({
  toasts: [],
  mostrar: (mensaje, tipo = "exito") => {
    const id = siguienteId++;
    set((estado) => ({ toasts: [...estado.toasts, { id, tipo, mensaje }] }));
    setTimeout(() => get().cerrar(id), 3200);
  },
  cerrar: (id) => set((estado) => ({ toasts: estado.toasts.filter((t) => t.id !== id) })),
}));
