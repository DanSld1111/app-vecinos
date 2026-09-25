import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calificacion, Resena } from "@app-vecinos/tipos";
import { apiFetch } from "../api/clienteApi";
import { useSesion } from "../../estado/useSesion";

/** La calificación propia del vecino en este negocio, si ya puso una — para abrir el selector
 * con su valor actual marcado en vez de vacío. El promedio/total público ya viene incluido en
 * Negocio.calificacionPromedio/calificacionTotal (useNegocio), no hace falta una consulta aparte. */
export function useMiCalificacion(negocioId: string | undefined) {
  const token = useSesion((estado) => estado.token);
  return useQuery({
    queryKey: ["calificacion-mia", negocioId, token],
    queryFn: () => apiFetch<Resena | null>(`/resenas/mia?negocioId=${negocioId}`, { token }),
    enabled: Boolean(negocioId && token),
  });
}

export function useInvalidarCalificacion(negocioId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["calificacion-mia", negocioId] });
    // El promedio vive en Negocio.calificacionPromedio (listados y la propia ficha) — invalidar
    // ahí refresca la línea sutil de la ficha y las tarjetas donde aparezca este negocio.
    queryClient.invalidateQueries({ queryKey: ["negocio", negocioId] });
    queryClient.invalidateQueries({ queryKey: ["negocios"] });
  };
}

export async function calificar(negocioId: string, calificacion: Calificacion, token: string): Promise<void> {
  await apiFetch<Resena>("/resenas", { metodo: "POST", token, cuerpo: { negocioId, calificacion } });
}
