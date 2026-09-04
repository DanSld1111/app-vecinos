import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, ViewStyle } from "react-native";
import { PaletaColores, useColores } from "../disenio";

/**
 * Espacio grande sin foto todavía (la foto principal de la ficha de un negocio, la tarjeta
 * destacada) — un ícono pequeño centrado sobre una superficie hundida, nunca un bloque vacío
 * que se puede confundir con una imagen rota. Para miniaturas pequeñas de negocio (con nombre
 * de por medio) usar `AvatarNegocio` en su lugar. Ver docs/decisiones/0022-diseno-post-revision.md.
 */
export function SinFoto({
  icono = "storefront-outline",
  tamanoIcono = 26,
  style,
}: {
  icono?: keyof typeof Ionicons.glyphMap;
  tamanoIcono?: number;
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View style={[styles.contenedor, style]}>
      <Ionicons name={icono} size={tamanoIcono} color={colores.textoTenue} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
