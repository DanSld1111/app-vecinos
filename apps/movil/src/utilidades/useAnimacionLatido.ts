import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Pulso sutil de escala (1 → 1.08 → 1), en bucle — el mismo tipo de "vida" que tenían los
 * íconos que se animaban en el video de referencia, adaptado a que acá lo que se anima es la
 * foto de la categoría, no un swap entre dos íconos distintos. `retrasoMs` escalona el inicio
 * para que las tarjetas no respiren todas al mismo tiempo (se ve más orgánico, menos repetitivo).
 * Ver docs/decisiones/0032-animacion-categorias-inicio.md.
 */
export function useAnimacionLatido(retrasoMs = 0) {
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    );
    const temporizador = setTimeout(() => animacion.start(), retrasoMs);
    return () => {
      clearTimeout(temporizador);
      animacion.stop();
    };
  }, [escala, retrasoMs]);

  return escala;
}
