import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

export function ChipCategoria({
  etiqueta,
  activo,
  onPress,
  colorPunto,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  /** Punto de color antes del texto (para diferenciar categorías de un vistazo, ej. en Comunidad). */
  colorPunto?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, activo && styles.chipActivo]}
    >
      {colorPunto ? (
        <View style={[styles.punto, { backgroundColor: activo ? colores.fondo : colorPunto }]} />
      ) : null}
      <Text style={[styles.texto, activo && styles.textoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.md,
      borderRadius: radios.completo,
      backgroundColor: colores.superficie,
      borderWidth: 1.5,
      borderColor: colores.borde,
    },
    punto: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chipActivo: {
      backgroundColor: colores.texto,
      borderColor: colores.texto,
    },
    texto: {
      ...tipografia.pie,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.textoSuave,
    },
    textoActivo: {
      color: colores.fondo,
    },
  });
}
