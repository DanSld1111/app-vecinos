import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

/**
 * Fade + deslizado hacia arriba al montar — mismo lenguaje visual que los bocetos del listado
 * (las tarjetas entran una tras otra, no todas de golpe). `retraso` en ms para escalonarlas
 * desde el índice del item en la lista.
 */
export function EntradaAnimada({
  retraso = 0,
  style,
  children,
}: {
  retraso?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.timing(progreso, {
      toValue: 1,
      duration: 380,
      delay: retraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animacion.start();
    return () => animacion.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progreso,
          transform: [
            {
              translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
