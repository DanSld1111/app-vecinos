import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { PaletaColores, espaciado, radios, useColores } from "../disenio";

export function usePulso() {
  const opacidad = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacidad, {
          toValue: 0.5,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad]);

  return opacidad;
}

export function EsqueletoNegocio() {
  const opacidad = usePulso();
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Animated.View style={[styles.contenedor, { opacity: opacidad }]}>
      <View style={styles.miniatura} />
      <View style={styles.texto}>
        <View style={[styles.linea, { width: "70%" }]} />
        <View style={[styles.linea, { width: "45%" }]} />
        <View style={[styles.linea, { width: "30%" }]} />
      </View>
    </Animated.View>
  );
}

export function EsqueletoListaNegocios({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <View>
      {Array.from({ length: cantidad }).map((_, i) => (
        <EsqueletoNegocio key={i} />
      ))}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      gap: espaciado.md,
      paddingVertical: espaciado.sm,
    },
    miniatura: {
      width: 56,
      height: 56,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida2,
    },
    texto: {
      flex: 1,
      justifyContent: "center",
      gap: 6,
    },
    linea: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colores.superficieHundida2,
    },
  });
}
