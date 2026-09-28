import { useEffect, useRef } from "react";
import { Animated, Easing, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, radios, useColores } from "../disenio";
import { useMovimientoReducido } from "../utilidades/useMovimientoReducido";

const DISTANCIA = 420;

/**
 * Hoja que sube desde abajo. Entra con un rebote leve (300 ms), el fondo se oscurece, y se cierra
 * tocando fuera, con "atrás" de Android o arrastrándola hacia abajo más de 80 px.
 */
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
  const insets = useSafeAreaInsets();
  const reducido = useMovimientoReducido();
  const desplazamiento = useRef(new Animated.Value(DISTANCIA)).current;
  const opacidadFondo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      desplazamiento.setValue(reducido ? 0 : DISTANCIA);
      Animated.parallel([
        reducido
          ? Animated.timing(desplazamiento, { toValue: 0, duration: 0, useNativeDriver: true })
          : Animated.spring(desplazamiento, {
              toValue: 0,
              damping: 22,
              stiffness: 260,
              mass: 0.9,
              useNativeDriver: true,
            }),
        Animated.timing(opacidadFondo, { toValue: 1, duration: reducido ? 120 : 220, useNativeDriver: true }),
      ]).start();
    } else {
      desplazamiento.setValue(DISTANCIA);
      opacidadFondo.setValue(0);
    }
  }, [visible, reducido, desplazamiento, opacidadFondo]);

  function cerrarConAnimacion() {
    Animated.parallel([
      Animated.timing(desplazamiento, {
        toValue: DISTANCIA,
        duration: reducido ? 0 : 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacidadFondo, { toValue: 0, duration: reducido ? 100 : 180, useNativeDriver: true }),
    ]).start(() => onCerrar());
  }

  const cerrarRef = useRef(cerrarConAnimacion);
  cerrarRef.current = cerrarConAnimacion;

  const arrastre = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => desplazamiento.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 80 || g.vy > 0.9) {
          cerrarRef.current();
        } else {
          Animated.spring(desplazamiento, { toValue: 0, damping: 20, stiffness: 300, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrarConAnimacion}>
      <Animated.View style={[styles.fondo, { opacity: opacidadFondo }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cerrarConAnimacion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>
      <Animated.View
        {...arrastre.panHandlers}
        style={[
          styles.hoja,
          { paddingBottom: espaciado.xl + insets.bottom, transform: [{ translateY: desplazamiento }] },
        ]}
        accessibilityViewIsModal
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
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(10, 14, 12, 0.5)",
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
      paddingHorizontal: espaciado.lg + 2,
      maxHeight: "85%",
    },
    manija: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colores.bordeFuerte,
      alignSelf: "center",
      marginBottom: espaciado.md + 2,
    },
  });
}
