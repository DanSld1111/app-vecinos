import { Animated, StyleSheet, View } from "react-native";
import { PaletaColores, espaciado, radios, useColores } from "../disenio";
import { usePulso } from "./EsqueletoNegocio";

export function EsqueletoAviso() {
  const opacidad = usePulso();
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Animated.View style={[styles.tarjeta, { opacity: opacidad }]}>
      <View style={styles.encabezado}>
        <View style={styles.avatar} />
        <View style={styles.encabezadoTexto}>
          <View style={[styles.linea, { width: "55%" }]} />
          <View style={[styles.linea, { width: "30%", height: 6 }]} />
        </View>
      </View>
      <View style={styles.cuerpo}>
        <View style={[styles.linea, { width: "80%", height: 10 }]} />
        <View style={[styles.linea, { width: "95%" }]} />
        <View style={[styles.linea, { width: "60%" }]} />
      </View>
    </Animated.View>
  );
}

export function EsqueletoListaAvisos({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <View style={{ gap: espaciado.md }}>
      {Array.from({ length: cantidad }).map((_, i) => (
        <EsqueletoAviso key={i} />
      ))}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.md,
      gap: espaciado.md,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 2,
    },
    encabezado: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: radios.md,
      backgroundColor: colores.superficieHundida2,
    },
    encabezadoTexto: {
      flex: 1,
      gap: 6,
    },
    cuerpo: {
      gap: 6,
    },
    linea: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colores.superficieHundida2,
    },
  });
}
