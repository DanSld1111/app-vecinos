import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Destacadas de Para ti que este vecino ya abrió (borde naranja = nueva, gris = vista), como los
 * estados. Solo en este celular; se guardan las últimas 100.
 */
interface EstadoVistas {
  vistas: string[];
  marcar: (id: string) => void;
}

export const useDestacadasVistas = create<EstadoVistas>()(
  persist(
    (set) => ({
      vistas: [],
      marcar: (id) => set((e) => (e.vistas.includes(id) ? e : { vistas: [id, ...e.vistas].slice(0, 100) })),
    }),
    { name: "elisur-destacadas-vistas", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
