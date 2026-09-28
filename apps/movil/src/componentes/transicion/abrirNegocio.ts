import { View } from "react-native";
import { router } from "expo-router";
import { useTransicionFoto } from "../../estado/useTransicionFoto";

/**
 * Abre la ficha de un negocio. Si se pasa la vista de su foto (y el negocio tiene foto), mide
 * dónde está en pantalla para que la ficha la haga crecer hasta la portada; si no, abre la
 * ficha con el deslizamiento de siempre.
 */
export function abrirNegocio(
  negocioId: string,
  foto?: { vista: View | null; url: string | null | undefined; radio?: number },
) {
  const vista = foto?.vista;
  if (!vista || !foto?.url) {
    router.push(`/negocio/${negocioId}`);
    return;
  }

  let navegado = false;
  const irSinFoto = setTimeout(() => {
    // measureInWindow no respondió (vista desmontada): se abre igual, sin la foto en vuelo.
    if (!navegado) {
      navegado = true;
      router.push(`/negocio/${negocioId}`);
    }
  }, 150);

  vista.measureInWindow((x, y, ancho, alto) => {
    if (navegado) return;
    navegado = true;
    clearTimeout(irSinFoto);
    if (!ancho || !alto) {
      router.push(`/negocio/${negocioId}`);
      return;
    }
    useTransicionFoto.getState().preparar({
      negocioId,
      url: foto.url as string,
      x,
      y,
      ancho,
      alto,
      radio: foto.radio ?? 8,
    });
    router.push({ pathname: "/negocio/[id]", params: { id: negocioId, transicion: "foto" } });
  });
}
