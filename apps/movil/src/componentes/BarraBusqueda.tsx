import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { Tocable } from "./Tocable";

/** Buscador "falso" que abre la pantalla de búsqueda: borde firme en el color del texto, sin sombra. */
export function BarraBusqueda({ placeholder, onPress }: { placeholder: string; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Tocable
      style={styles.contenedor}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      escala={0.985}
    >
      <Ionicons name="search" size={17} color={colores.textoSuave} />
      <Text style={styles.texto} numberOfLines={1}>
        {placeholder}
      </Text>
    </Tocable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.fondo,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colores.texto,
      paddingHorizontal: espaciado.md,
      height: 44,
    },
    texto: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      flex: 1,
    },
  });
}
