import { Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColores } from "../disenio";

/**
 * Título grande que "se achica": el título grande de la pantalla se va con el contenido y, cuando
 * ya salió, aparece arriba esta barra fija con el mismo título en chico. `desde` es cuánto hay que
 * bajar para que aparezca (más o menos lo que ocupa el título grande).
 */
export function BarraTituloFija({ titulo, scrollY, desde = 44 }: { titulo: string; scrollY: Animated.Value; desde?: number }) {
  const colores = useColores();
  const insets = useSafeAreaInsets();
  const opacidad = scrollY.interpolate({ inputRange: [desde, desde + 24], outputRange: [0, 1], extrapolate: "clamp" });
  const y = scrollY.interpolate({ inputRange: [desde, desde + 24], outputRange: [-6, 0], extrapolate: "clamp" });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.barra,
        {
          paddingTop: insets.top,
          height: insets.top + 50,
          backgroundColor: colores.fondo,
          borderBottomColor: colores.bordeFuerte,
          opacity: opacidad,
        },
      ]}
    >
      <Animated.Text style={[styles.titulo, { color: colores.texto, transform: [{ translateY: y }] }]} numberOfLines={1}>
        {titulo}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titulo: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 16 },
});

