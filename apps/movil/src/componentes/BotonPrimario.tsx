import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";

export function BotonPrimario({
  texto,
  onPress,
  variante = "primario",
  icono,
  deshabilitado = false,
  style,
}: {
  texto: string;
  onPress: () => void;
  /** "primario": verde de marca, una sola vez por pantalla. "fantasma": borde firme en el color del texto. */
  variante?: "primario" | "fantasma";
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const escala = useRef(new Animated.Value(1)).current;
  const esPrimario = variante === "primario";
  const colorTexto = esPrimario ? colores.fondo : colores.texto;

  function presionar(hacia: number) {
    Animated.timing(escala, { toValue: hacia, duration: 100, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale: escala }], opacity: deshabilitado ? 0.45 : 1 }, style]}>
      <Pressable
        onPress={deshabilitado ? undefined : onPress}
        onPressIn={() => !deshabilitado && presionar(0.97)}
        onPressOut={() => presionar(1)}
        accessibilityRole="button"
        accessibilityLabel={texto}
        accessibilityState={{ disabled: deshabilitado }}
        style={[styles.base, esPrimario ? styles.primario : styles.fantasma]}
      >
        {icono ? <Ionicons name={icono} size={17} color={colorTexto} /> : null}
        <Text style={[styles.texto, { color: colorTexto }]}>{texto}</Text>
      </Pressable>
    </Animated.View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    base: {
      height: 44,
      borderRadius: 10,
      flexDirection: "row",
      gap: 7,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: espaciado.lg,
    },
    primario: {
      backgroundColor: colores.primario,
    },
    fantasma: {
      borderWidth: 1.5,
      borderColor: colores.texto,
    },
    texto: {
      ...tipografia.cuerpoDestacado,
    },
  });
}
