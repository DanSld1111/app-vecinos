import { useQuery } from "@tanstack/react-query";
import { repositorioServicios } from "../fabricaRepositorios";

export function useServiciosApp() {
  return useQuery({
    queryKey: ["servicios-app"],
    queryFn: () => repositorioServicios.listar(),
  });
}
