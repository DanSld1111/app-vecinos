import { create } from "zustand";

export interface RectanguloVentana {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Dónde estaba el buscador de Inicio al tocarlo — la pantalla Buscar lo hace "subir" desde ahí
 * hasta su lugar arriba (ver BuscadorEnVuelo). Mismo pase de mano que useTransicionFoto.
 */
export const useTransicionBuscador = create<{
  origen: RectanguloVentana | null;
  preparar: (origen: RectanguloVentana) => void;
  limpiar: () => void;
}>((set) => ({
  origen: null,
  preparar: (origen) => set({ origen }),
  limpiar: () => set({ origen: null }),
}));
