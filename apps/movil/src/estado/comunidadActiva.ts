import { create } from "zustand";
import { Comunidad } from "@app-vecinos/tipos";

interface EstadoComunidadActiva {
  comunidad: Comunidad | null;
  establecerComunidad: (comunidad: Comunidad) => void;
}

export const useComunidadActiva = create<EstadoComunidadActiva>((set) => ({
  comunidad: null,
  establecerComunidad: (comunidad) => set({ comunidad }),
}));
