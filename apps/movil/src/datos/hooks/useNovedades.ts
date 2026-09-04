import { useQuery } from "@tanstack/react-query";
import { repositorioNovedades } from "../fabricaRepositorios";

export function useNovedades() {
  return useQuery({
    queryKey: ["novedades"],
    queryFn: () => repositorioNovedades.listar(),
  });
}
