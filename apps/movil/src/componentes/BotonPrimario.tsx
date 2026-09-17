import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

export function BotonPrimario({
  texto,
  onPress,
  variante = "primario",
  style,
}: {
  texto: string;
  onPress: () => void;
  variante?: "primario" | "fantasma";
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  // Escala sutil al presionar — mismo feedback táctil que se espera de un botón nativo,
  // sin esto un botón web se siente "plano" comparado con iOS/Android.
  const escala = useRef(new Animated.Value(1)).current;

  function presionar(hacia: number) {
    Animated.spring(escala, { toValue: hacia, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => presionar(0.96)}
        onPressOut={() => presionar(1)}
        style={[styles.base, variante === "primario" ? styles.primario : styles.fantasma]}
      >
        <Text style={variante === "primario" ? styles.textoPrimario : styles.textoFantasma}>
          {texto}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    base: {
      height: 46,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: espaciado.lg,
    },
    primario: {
      backgroundColor: colores.primario,
    },
    fantasma: {
      borderWidth: 1,
      borderColor: colores.bordeFuerte,
    },
    textoPrimario: {
      ...tipografia.cuerpoDestacado,
      color: colores.fondo,
    },
    textoFantasma: {
      ...tipografia.cuerpoDestacado,
      color: colores.textoSuave,
    },
  });
}
