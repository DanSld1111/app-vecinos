import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

export function BarraBusqueda({ placeholder, onPress }: { placeholder: string; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable style={styles.contenedor} onPress={onPress}>
      <Ionicons name="search" size={18} color={colores.textoTenue} />
      <Text style={styles.texto}>{placeholder}</Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficie,
      borderRadius: radios.completo,
      paddingHorizontal: espaciado.md,
      height: 46,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    texto: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
    },
  });
}
