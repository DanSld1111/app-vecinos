import { useEffect } from "react";
import { create } from "zustand";
import { Negocio, Producto } from "@app-vecinos/tipos";

/**
 * Lo que se está editando de un negocio y todavía no se guardó, para que el celular de vista
 * previa (VistaPreviaNegocio) lo muestre en vivo. Cada pestaña publica sus campos mientras está
 * abierta y los retira al cerrarse: al cambiar de pestaña sin guardar, la vista previa vuelve a
 * mostrar lo guardado (igual que el formulario, que también pierde lo no guardado).
 */
interface EstadoBorrador {
  cambios: Partial<Negocio>;
  /** Productos tal como los tiene la pestaña Productos (ya guardados, pero más frescos que el caché). */
  productos: Producto[] | null;
  /** Qué parte de la ficha está editando la pestaña abierta: el celular se desplaza hasta ahí. */
  enfoque: EnfoqueVistaPrevia;
  publicar: (parcial: Partial<Negocio>) => void;
  quitar: (claves: (keyof Negocio)[]) => void;
  publicarProductos: (productos: Producto[] | null) => void;
}

export type EnfoqueVistaPrevia = "arriba" | "contenido" | "horario";

export const useBorradorNegocio = create<EstadoBorrador>((set) => ({
  cambios: {},
  productos: null,
  enfoque: "arriba",
  publicar: (parcial) => set((e) => ({ cambios: { ...e.cambios, ...parcial } })),
  quitar: (claves) =>
    set((e) => {
      const cambios = { ...e.cambios };
      for (const c of claves) delete cambios[c];
      return { cambios };
    }),
  publicarProductos: (productos) => set({ productos }),
}));

/** Mientras la pestaña está abierta, el celular muestra esa parte de la ficha. */
export function useEnfoqueVistaPrevia(enfoque: EnfoqueVistaPrevia) {
  useEffect(() => {
    useBorradorNegocio.setState({ enfoque });
    return () => useBorradorNegocio.setState({ enfoque: "arriba" });
  }, [enfoque]);
}

/** Publica estos campos mientras el componente está montado; los retira al desmontarse. */
export function usePublicarBorrador(parcial: Partial<Negocio>) {
  const publicar = useBorradorNegocio((e) => e.publicar);
  const quitar = useBorradorNegocio((e) => e.quitar);
  const clave = JSON.stringify(parcial);
  useEffect(() => {
    publicar(JSON.parse(clave));
  }, [clave, publicar]);
  useEffect(() => {
    const claves = Object.keys(JSON.parse(clave)) as (keyof Negocio)[];
    return () => quitar(claves);
    // Solo al desmontar: las claves que publica cada pestaña son siempre las mismas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
