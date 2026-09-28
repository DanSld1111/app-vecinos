import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { espaciado, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { useMovimientoReducido } from "../utilidades/useMovimientoReducido";

const ANCHO_BRILLO = 140;
const ANCHO_PANTALLA = Dimensions.get("window").width;

// Un solo reloj para todos los huesos: todos brillan al mismo ritmo, en vez de cada bloque
// parpadeando por su cuenta.
const brillo = new Animated.Value(0);
let bucle: Animated.CompositeAnimation | null = null;
let usuarios = 0;

function useBrillo(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    usuarios += 1;
    if (!bucle) {
      brillo.setValue(0);
      bucle = Animated.loop(
        Animated.timing(brillo, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      );
      bucle.start();
    }
    return () => {
      usuarios -= 1;
      if (usuarios <= 0 && bucle) {
        bucle.stop();
        bucle = null;
      }
    };
  }, [activo]);
}

/** Bloque gris de carga con un brillo que lo recorre (sin brillo si el teléfono pide menos movimiento). */
export function Hueso({ style }: { style?: StyleProp<ViewStyle> }) {
  const colores = useColores();
  const oscuro = useTema((e) => e.modo === "oscuro");
  const reducido = useMovimientoReducido();
  useBrillo(!reducido);

  const traslado = brillo.interpolate({
    inputRange: [0, 1],
    outputRange: [-ANCHO_BRILLO, ANCHO_PANTALLA + ANCHO_BRILLO],
  });

  return (
    <View style={[{ backgroundColor: colores.superficieHundida2, overflow: "hidden" }, style]}>
      {reducido ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, { width: ANCHO_BRILLO, transform: [{ translateX: traslado }] }]}>
          <LinearGradient
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            colors={
              oscuro
                ? ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0)"]
                : ["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]
            }
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Pulso suave para bloques grandes que no usan Hueso (se mantiene por compatibilidad). */
export function usePulso() {
  const opacidad = useRef(new Animated.Value(0.6)).current;
  const reducido = useMovimientoReducido();

  useEffect(() => {
    if (reducido) {
      opacidad.setValue(1);
      return;
    }
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 0.6, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad, reducido]);

  return opacidad;
}

/** Fila de carga con la forma de TarjetaNegocio: miniatura de 64, tres líneas y línea fina abajo. */
export function EsqueletoNegocio() {
  const colores = useColores();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: espaciado.md,
        paddingVertical: espaciado.md - 1,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colores.borde,
      }}
    >
      <Hueso style={{ width: 64, height: 64, borderRadius: 8 }} />
      <View style={{ flex: 1, gap: 7 }}>
        <Hueso style={{ height: 12, width: "65%", borderRadius: 6 }} />
        <Hueso style={{ height: 9, width: "80%", borderRadius: 5 }} />
        <Hueso style={{ height: 9, width: "40%", borderRadius: 5 }} />
      </View>
    </View>
  );
}

export function EsqueletoListaNegocios({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <View accessibilityLabel="Cargando negocios" accessibilityRole="progressbar">
      {Array.from({ length: cantidad }).map((_, i) => (
        <EsqueletoNegocio key={i} />
      ))}
    </View>
  );
}

/** Fila de carga con la forma de "Cerca de ti" en Inicio: fotos verticales con nombre y distancia. */
export function EsqueletoFilaVitrina({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <View
      style={{ flexDirection: "row", gap: espaciado.sm + 2, paddingHorizontal: espaciado.lg }}
      accessibilityLabel="Cargando negocios cercanos"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: cantidad }).map((_, i) => (
        <View key={i} style={{ width: 128, gap: 7 }}>
          <Hueso style={{ width: 128, height: 156, borderRadius: 8 }} />
          <Hueso style={{ height: 11, width: "85%", borderRadius: 6 }} />
          <Hueso style={{ height: 9, width: "55%", borderRadius: 5 }} />
        </View>
      ))}
    </View>
  );
}
