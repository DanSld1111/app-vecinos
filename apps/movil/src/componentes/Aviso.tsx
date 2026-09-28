import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColores } from "../disenio";

/**
 * Aviso corto abajo de la pantalla ("Guardado en favoritos"): sube con un fundido, se queda
 * 1,7 s y se va. `texto` en null = oculto; al terminar llama a `onTerminar` para limpiarlo.
 */
export function Aviso({ texto, onTerminar }: { texto: string | null; onTerminar: () => void }) {
  const colores = useColores();
  const insets = useSafeAreaInsets();
  const valor = useRef(new Animated.Value(0)).current;
  const nativo = Platform.OS !== "web";

  useEffect(() => {
    if (!texto) return;
    valor.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(valor, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: nativo }),
      Animated.delay(1700),
      Animated.timing(valor, { toValue: 0, duration: 200, useNativeDriver: nativo }),
    ]);
    anim.start(({ finished }) => finished && onTerminar());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  if (!texto) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.aviso,
        {
          bottom: insets.bottom + 24,
          backgroundColor: colores.texto,
          opacity: valor,
          transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <Text style={[styles.texto, { color: colores.fondo }]}>{texto}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  texto: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 13 },
});
