import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

export function BotonPrimario({
  texto,
  onPress,
  variante = "primario",
  style,
}: {
  texto: string;
  onPress: () => void;
  variante?: "primario" | "fantasma";
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, variante === "primario" ? styles.primario : styles.fantasma, style]}
    >
      <Text style={variante === "primario" ? styles.textoPrimario : styles.textoFantasma}>
        {texto}
      </Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    base: {
      height: 46,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: espaciado.lg,
    },
    primario: {
      backgroundColor: colores.primario,
    },
    fantasma: {
      borderWidth: 1,
      borderColor: colores.bordeFuerte,
    },
    textoPrimario: {
      ...tipografia.cuerpoDestacado,
      color: colores.fondo,
    },
    textoFantasma: {
      ...tipografia.cuerpoDestacado,
      color: colores.textoSuave,
    },
  });
}
