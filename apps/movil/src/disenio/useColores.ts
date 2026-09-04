import { useTema } from "../estado/useTema";
import { paletaClara, paletaOscura, PaletaColores } from "./colores";

/** La paleta activa según el modo elegido en Mi perfil — usarlo en vez de importar `colores` directo en cualquier componente que pinte algo en pantalla. */
export function useColores(): PaletaColores {
  const modo = useTema((estado) => estado.modo);
  return modo === "oscuro" ? paletaOscura : paletaClara;
}
