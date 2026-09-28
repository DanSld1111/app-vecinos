import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { PaletaColores, useColores } from "../disenio";

export function Interruptor({
  activo,
  onCambiar,
  deshabilitado = false,
  etiqueta,
}: {
  activo: boolean;
  onCambiar: (valor: boolean) => void;
  deshabilitado?: boolean;
  /** Lo que lee el lector de pantalla ("Modo oscuro"); si falta, lee solo "activado/desactivado". */
  etiqueta?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const posicion = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(posicion, {
      toValue: activo ? 1 : 0,
      duration: 180,
      easing: Easing.bezier(0.3, 1.4, 0.5, 1),
      useNativeDriver: true,
    }).start();
  }, [activo, posicion]);

  const translateX = posicion.interpolate({ inputRange: [0, 1], outputRange: [2, 14] });

  return (
    <Pressable
      disabled={deshabilitado}
      onPress={() => onCambiar(!activo)}
      accessibilityRole="switch"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: activo, disabled: deshabilitado }}
      style={[
        styles.pista,
        { backgroundColor: activo ? colores.primario : colores.bordeFuerte },
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <Animated.View style={[styles.perilla, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    pista: {
      width: 40,
      height: 22,
      borderRadius: 11,
      justifyContent: "center",
    },
    perilla: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#ffffff",
    },
    deshabilitado: {
      opacity: 0.5,
    },
  });
}
