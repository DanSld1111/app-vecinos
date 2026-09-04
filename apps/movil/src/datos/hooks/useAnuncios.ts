import { useQuery } from "@tanstack/react-query";
import { repositorioAnuncios } from "../fabricaRepositorios";

export function useAnuncios() {
  return useQuery({
    queryKey: ["anuncios"],
    queryFn: () => repositorioAnuncios.listar(),
  });
}
