import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { tipografia, useColores } from "../../disenio";
import { RectanguloVentana } from "../../estado/useTransicionBuscador";

export const TEXTO_BUSCADOR = "Negocio, plato o producto";

/**
 * Copia del buscador de Inicio que se desliza y se ajusta hasta el campo de la pantalla Buscar
 * (300 ms). Al llegar, `onLlegar` muestra el campo real.
 */
export function BuscadorEnVuelo({
  origen,
  destino,
  onLlegar,
}: {
  origen: RectanguloVentana;
  destino: RectanguloVentana;
  onLlegar: () => void;
}) {
  const colores = useColores();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }, (fin) => {
      if (fin) runOnJS(onLlegar)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estilo = useAnimatedStyle(() => ({
    left: origen.x + (destino.x - origen.x) * p.value,
    top: origen.y + (destino.y - origen.y) * p.value,
    width: origen.ancho + (destino.ancho - origen.ancho) * p.value,
    height: origen.alto + (destino.alto - origen.alto) * p.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.barra, { borderColor: colores.texto, backgroundColor: colores.fondo }, estilo]}
    >
      <Ionicons name="search" size={17} color={colores.textoSuave} />
      <Text style={[styles.texto, { color: colores.textoSuave }]} numberOfLines={1}>
        {TEXTO_BUSCADOR}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: "absolute",
    zIndex: 30,
    elevation: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  texto: { ...tipografia.cuerpo, flex: 1 },
});
