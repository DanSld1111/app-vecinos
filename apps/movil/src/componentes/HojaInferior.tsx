import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { PaletaColores, espaciado, radios, useColores } from "../disenio";

export function HojaInferior({
  visible,
  onCerrar,
  children,
}: {
  visible: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const desplazamiento = useRef(new Animated.Value(300)).current;
  const opacidadFondo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(desplazamiento, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacidadFondo, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      desplazamiento.setValue(300);
      opacidadFondo.setValue(0);
    }
  }, [visible, desplazamiento, opacidadFondo]);

  function cerrarConAnimacion() {
    Animated.parallel([
      Animated.timing(desplazamiento, {
        toValue: 300,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacidadFondo, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onCerrar());
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrarConAnimacion}>
      <Animated.View style={[styles.fondo, { opacity: opacidadFondo }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrarConAnimacion} />
      </Animated.View>
      <Animated.View
        style={[styles.hoja, { transform: [{ translateY: desplazamiento }] }]}
      >
        <View style={styles.manija} />
        {children}
      </Animated.View>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fondo: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    hoja: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colores.superficie,
      borderTopLeftRadius: radios.lg,
      borderTopRightRadius: radios.lg,
      paddingTop: espaciado.sm,
      paddingBottom: espaciado.xl,
      paddingHorizontal: espaciado.lg,
      maxHeight: "80%",
    },
    manija: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colores.borde,
      alignSelf: "center",
      marginBottom: espaciado.md,
    },
  });
}
