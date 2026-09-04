import { useQuery } from "@tanstack/react-query";
import { FiltroNegocios } from "@app-vecinos/tipos";
import { repositorioNegocios } from "../fabricaRepositorios";

export function useNegocios(filtro: FiltroNegocios) {
  return useQuery({
    queryKey: ["negocios", filtro],
    queryFn: () => repositorioNegocios.listar(filtro),
    enabled: Boolean(filtro.comunidadId),
  });
}

export function useNegocio(id: string | undefined) {
  return useQuery({
    queryKey: ["negocio", id],
    queryFn: () => repositorioNegocios.obtenerPorId(id as string),
    enabled: Boolean(id),
  });
}
