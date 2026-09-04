import { useQuery } from "@tanstack/react-query";
import { repositorioAvisos } from "../fabricaRepositorios";

export function useAvisos(comunidadId: string | undefined) {
  return useQuery({
    queryKey: ["avisos", comunidadId],
    queryFn: () => repositorioAvisos.listarPorComunidad(comunidadId as string),
    enabled: Boolean(comunidadId),
  });
}
