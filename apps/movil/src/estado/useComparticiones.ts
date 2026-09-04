import { create } from "zustand";

/**
 * Conteo adicional de veces compartido, solo en memoria de esta sesión.
 * El total mostrado = semilla del mock + este incremento local.
 * Solo suma cuando el sistema confirma que el usuario completó el share (no si cancela la hoja nativa).
 * No hay backend todavía que agregue el conteo real entre vecinos (Etapa 2).
 */
interface EstadoComparticiones {
  incrementos: Record<string, number>;
  registrar: (avisoId: string) => void;
}

export const useComparticiones = create<EstadoComparticiones>((set) => ({
  incrementos: {},
  registrar: (avisoId) =>
    set((estado) => ({
      incrementos: { ...estado.incrementos, [avisoId]: (estado.incrementos[avisoId] ?? 0) + 1 },
    })),
}));
