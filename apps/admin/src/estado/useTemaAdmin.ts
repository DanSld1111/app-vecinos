import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PreferenciaTema = "sistema" | "claro" | "oscuro";

const consulta = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

/** El tema que de verdad se pinta: "sistema" sigue la preferencia del sistema operativo. */
export function temaEfectivo(preferencia: PreferenciaTema): "claro" | "oscuro" {
  if (preferencia === "sistema") return consulta?.matches ? "oscuro" : "claro";
  return preferencia;
}

/** Pone data-tema en <html>; las variables de color de index.css cambian con eso. */
export function aplicarTema(preferencia: PreferenciaTema) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.tema = temaEfectivo(preferencia);
}

interface EstadoTema {
  preferencia: PreferenciaTema;
  /** Alterna entre claro y oscuro partiendo de lo que se ve ahora (deja de seguir al sistema). */
  alternar: () => void;
}

/**
 * Modo claro u oscuro del panel, guardado en este navegador. Por defecto sigue al sistema
 * operativo; al tocar el botón del menú queda fijo en lo que se eligió.
 */
export const useTemaAdmin = create<EstadoTema>()(
  persist(
    (set, get) => ({
      preferencia: "sistema",
      alternar: () => {
        const siguiente = temaEfectivo(get().preferencia) === "oscuro" ? "claro" : "oscuro";
        set({ preferencia: siguiente });
        aplicarTema(siguiente);
      },
    }),
    {
      name: "elisur-admin-tema",
      onRehydrateStorage: () => (estado) => aplicarTema(estado?.preferencia ?? "sistema"),
    },
  ),
);

// Si se sigue al sistema y este cambia (ej. el celular pasa a oscuro de noche), se actualiza solo.
consulta?.addEventListener("change", () => {
  const { preferencia } = useTemaAdmin.getState();
  if (preferencia === "sistema") aplicarTema("sistema");
});
