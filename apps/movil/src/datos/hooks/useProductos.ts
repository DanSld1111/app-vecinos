import { useQuery } from "@tanstack/react-query";
import { repositorioProductos } from "../fabricaRepositorios";

export function useProductosPorNegocio(negocioId: string | undefined) {
  return useQuery({
    queryKey: ["productos", negocioId],
    queryFn: () => repositorioProductos.listarPorNegocio(negocioId as string),
    enabled: Boolean(negocioId),
  });
}
