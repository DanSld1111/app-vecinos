import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Resena, ResumenResenas } from "@app-vecinos/tipos";
import { apiGet, apiFetch } from "../api/clienteApi";

export function useResenas(negocioId: string | undefined) {
  return useQuery({
    queryKey: ["resenas", negocioId],
    queryFn: () => apiGet<Resena[]>("/resenas", { negocioId: negocioId as string }),
    enabled: Boolean(negocioId),
  });
}

export function useResumenResenas(negocioId: string | undefined) {
  return useQuery({
    queryKey: ["resenas-resumen", negocioId],
    queryFn: () => apiGet<ResumenResenas>("/resenas/resumen", { negocioId: negocioId as string }),
    enabled: Boolean(negocioId),
  });
}

export function useMiResena(negocioId: string | undefined, token: string | null) {
  return useQuery({
    queryKey: ["resenas-mia", negocioId, token],
    queryFn: () => apiFetch<Resena | null>(`/resenas/mia?negocioId=${negocioId}`, { token }),
    enabled: Boolean(negocioId && token),
  });
}

/** Invalida lista, resumen y "mi reseña" de un negocio — usar tras crear/editar/borrar. */
export function useInvalidarResenas(negocioId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["resenas", negocioId] });
    queryClient.invalidateQueries({ queryKey: ["resenas-resumen", negocioId] });
    queryClient.invalidateQueries({ queryKey: ["resenas-mia", negocioId] });
  };
}
