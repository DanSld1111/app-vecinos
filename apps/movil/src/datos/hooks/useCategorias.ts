import { useQuery } from "@tanstack/react-query";
import { repositorioCategorias } from "../fabricaRepositorios";

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: () => repositorioCategorias.listar(),
  });
}
