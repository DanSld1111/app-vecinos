import { useQuery } from "@tanstack/react-query";
import { repositorioComunidades } from "../fabricaRepositorios";

export function useComunidadesActivas() {
  return useQuery({
    queryKey: ["comunidades", "activas"],
    queryFn: () => repositorioComunidades.listarActivas(),
  });
}
