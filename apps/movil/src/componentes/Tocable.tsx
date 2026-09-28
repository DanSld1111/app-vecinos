import { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

/**
 * `Pressable` que se hunde un 3 % al tocarlo — el mismo feedback para cualquier cosa tocable de
 * la app (tarjetas, filas, fotos), no solo para `BotonPrimario`. `style` va al contenedor
 * animado; lo demás pasa tal cual al `Pressable`.
 */
export function Tocable({
  style,
  children,
  escala = 0.97,
  ...resto
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  escala?: number;
}) {
  const valor = useRef(new Animated.Value(1)).current;

  function animar(hacia: number) {
    Animated.timing(valor, { toValue: hacia, duration: 100, useNativeDriver: true }).start();
  }

  return (
    <Pressable
      {...resto}
      onPressIn={(e) => {
        animar(escala);
        resto.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animar(1);
        resto.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: valor }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
