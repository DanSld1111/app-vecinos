import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface EstadoOnboarding {
  visto: boolean;
  marcarVisto: () => void;
}

/** Un solo flag, guardado en el dispositivo — no hace falta más que "ya lo vio o no". */
export const useOnboarding = create<EstadoOnboarding>()(
  persist(
    (set) => ({
      visto: false,
      marcarVisto: () => set({ visto: true }),
    }),
    {
      name: "elisur-onboarding-visto",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
