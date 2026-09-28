import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { OrigenFoto } from "../../estado/useTransicionFoto";
import { urlCompleta } from "../../utilidades/media";

const DURACION_MS = 400;

/**
 * La copia de la foto que viaja desde la tarjeta tocada hasta la portada de la ficha: anima
 * posición, tamaño y esquinas con Reanimated (en el hilo de UI en el teléfono). Al llegar avisa
 * con `onLlegar` para que la ficha muestre su portada real y esta copia desaparezca.
 */
export function FotoEnVuelo({
  origen,
  altoDestino,
  onLlegar,
}: {
  origen: OrigenFoto;
  altoDestino: number;
  onLlegar: () => void;
}) {
  const { width } = useWindowDimensions();
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withTiming(1, { duration: DURACION_MS, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }, (terminado) => {
      if (terminado) runOnJS(onLlegar)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estilo = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      left: origen.x * (1 - p),
      top: origen.y * (1 - p),
      width: origen.ancho + (width - origen.ancho) * p,
      height: origen.alto + (altoDestino - origen.alto) * p,
      borderRadius: origen.radio * (1 - p),
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.foto, estilo]}>
      <Image source={{ uri: urlCompleta(origen.url) }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  foto: { position: "absolute", overflow: "hidden", zIndex: 20, elevation: 20 },
});
