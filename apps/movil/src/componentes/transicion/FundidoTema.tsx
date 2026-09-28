import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import { paletaClara, paletaOscura } from "../../disenio";
import { useTema } from "../../estado/useTema";
import { useMovimientoReducido } from "../../utilidades/useMovimientoReducido";

/**
 * Cambio de modo claro/oscuro con fundido: toda la app ya se pintó con el tema nuevo, y encima
 * queda un instante una capa con el fondo del tema anterior que se desvanece en 320 ms. Así el
 * cambio se siente como una transición y no como un parpadeo.
 */
export function FundidoTema() {
  const modo = useTema((e) => e.modo);
  const reducido = useMovimientoReducido();
  const anterior = useRef(modo);
  const opacidad = useRef(new Animated.Value(0)).current;
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (anterior.current === modo) return;
    const colorAnterior = (anterior.current === "oscuro" ? paletaOscura : paletaClara).fondo;
    anterior.current = modo;
    if (reducido) return;
    setColor(colorAnterior);
    opacidad.setValue(1);
    Animated.timing(opacidad, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    }).start(() => setColor(null));
  }, [modo, reducido, opacidad]);

  if (!color) return null;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: opacidad }]} />;
}
