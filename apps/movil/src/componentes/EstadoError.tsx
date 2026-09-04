import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { textos } from "../i18n/es";
import { BotonPrimario } from "./BotonPrimario";

export function EstadoError({ onReintentar }: { onReintentar: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View style={styles.contenedor}>
      <Ionicons name="cloud-offline-outline" size={32} color={colores.textoTenue} />
      <Text style={styles.titulo}>{textos.comun.error}</Text>
      <BotonPrimario texto={textos.comun.reintentar} onPress={onReintentar} variante="fantasma" />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      paddingVertical: espaciado.xxl,
      alignItems: "center",
      gap: espaciado.md,
    },
    titulo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      textAlign: "center",
    },
  });
}
