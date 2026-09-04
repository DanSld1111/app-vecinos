import { create } from "zustand";
import { useEffect, useMemo } from "react";
import { useSesionAdmin } from "./useSesionAdmin";
import { useNegocios } from "./useNegocios";

interface EstadoNegocioActivoStore {
  negocioId: string | null;
  elegir: (id: string) => void;
}

const useNegocioActivoStore = create<EstadoNegocioActivoStore>((set) => ({
  negocioId: null,
  elegir: (id) => set({ negocioId: id }),
}));

/** Para cuentas dueño_negocio: sus negocios y cuál está activo en este momento del panel. */
export function useNegociosDelDueno() {
  const cuenta = useSesionAdmin((estado) => estado.cuenta);
  const token = useSesionAdmin((estado) => estado.token);
  const negocios = useNegocios((estado) => estado.negocios);
  const cargarMios = useNegocios((estado) => estado.cargarMios);
  const negocioIdGuardado = useNegocioActivoStore((estado) => estado.negocioId);
  const elegir = useNegocioActivoStore((estado) => estado.elegir);

  useEffect(() => {
    if (token) cargarMios(token);
  }, [cargarMios, token]);

  const negocioIds = cuenta?.negocioIds ?? [];
  const misNegocios = useMemo(
    () => negocios.filter((n) => negocioIds.includes(n.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [negocios, negocioIds.join(",")]
  );

  const activo = misNegocios.find((n) => n.id === negocioIdGuardado) ?? misNegocios[0] ?? null;

  return { misNegocios, activo, elegir };
}
