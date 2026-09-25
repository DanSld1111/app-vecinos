import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Negocio } from "@app-vecinos/tipos";
import { apiFetch } from "../api/clienteApi";
import { useSesion } from "../../estado/useSesion";

/** Solo los ids — lo que usa el corazón de cada ficha para saber si ya es favorito, sin traer
 * cada negocio completo. null (no []) mientras no hay token, para no confundir "sin favoritos"
 * con "no hay sesión". */
export function useFavoritosIds() {
  const token = useSesion((estado) => estado.token);
  return useQuery({
    queryKey: ["favoritos-ids", token],
    queryFn: () => apiFetch<string[]>("/favoritos/ids", { token }),
    enabled: Boolean(token),
  });
}

/** Los negocios favoritos completos — para la lista de Perfil. */
export function useFavoritos() {
  const token = useSesion((estado) => estado.token);
  return useQuery({
    queryKey: ["favoritos", token],
    queryFn: () => apiFetch<Negocio[]>("/favoritos", { token }),
    enabled: Boolean(token),
  });
}

export function useInvalidarFavoritos() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["favoritos-ids"] });
    queryClient.invalidateQueries({ queryKey: ["favoritos"] });
  };
}

/** Agregar/quitar — dispara-y-olvida desde la UI (el corazón cambia de estado optimistamente
 * en el componente que llama esto, ver TarjetaNegocio/ficha). */
export async function alternarFavorito(negocioId: string, token: string, esFavorito: boolean): Promise<void> {
  await apiFetch<void>(`/favoritos/${negocioId}`, { metodo: esFavorito ? "DELETE" : "POST", token });
}
