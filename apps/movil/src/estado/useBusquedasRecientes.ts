import { create } from "zustand";

const MAXIMO = 5;

interface EstadoBusquedasRecientes {
  recientes: string[];
  agregar: (termino: string) => void;
  quitar: (termino: string) => void;
  limpiar: () => void;
}

export const useBusquedasRecientes = create<EstadoBusquedasRecientes>((set) => ({
  recientes: [],
  agregar: (termino) =>
    set((estado) => {
      const limpio = termino.trim();
      if (!limpio) return estado;
      const sinDuplicado = estado.recientes.filter(
        (r) => r.toLowerCase() !== limpio.toLowerCase()
      );
      return { recientes: [limpio, ...sinDuplicado].slice(0, MAXIMO) };
    }),
  quitar: (termino) =>
    set((estado) => ({ recientes: estado.recientes.filter((r) => r !== termino) })),
  limpiar: () => set({ recientes: [] }),
}));
