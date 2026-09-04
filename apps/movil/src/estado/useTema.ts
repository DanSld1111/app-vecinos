import { create } from "zustand";

export type ModoTema = "claro" | "oscuro";

/**
 * Preferencia de tema — solo en memoria de esta sesión, igual que el resto del estado de la
 * app (ver useNotificacionesLeidas.ts): todavía no existe una capa de almacenamiento
 * persistente en apps/movil. Volver a abrir la app hoy siempre vuelve a modo claro.
 */
interface EstadoTema {
  modo: ModoTema;
  alternar: () => void;
}

export const useTema = create<EstadoTema>((set) => ({
  modo: "claro",
  alternar: () => set((estado) => ({ modo: estado.modo === "claro" ? "oscuro" : "claro" })),
}));
