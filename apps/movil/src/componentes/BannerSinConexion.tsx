import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { useConectividad } from "../estado/useConectividad";

export function BannerSinConexion() {
  const conectado = useConectividad();
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (conectado) return null;

  return (
    <View style={styles.contenedor}>
      <Ionicons name="cloud-offline-outline" size={14} color="#ffffff" />
      <Text style={styles.texto}>Sin conexión — mostrando información guardada</Text>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: espaciado.xs,
      backgroundColor: colores.texto,
      paddingVertical: 6,
    },
    texto: {
      ...tipografia.pie,
      fontSize: 11,
      color: "#ffffff",
    },
  });
}
