import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * true si la persona activó "reducir movimiento" en su teléfono. Con eso activo, las animaciones
 * de la app pasan a fundidos cortos o desaparecen (el parallax de la ficha, la oferta que pasa
 * sola en Inicio, los rebotes). En web lee `prefers-reduced-motion`.
 */
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (activo) setReducido(valor);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducido);
    return () => {
      activo = false;
      sub.remove();
    };
  }, []);

  return reducido;
}
