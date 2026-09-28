import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColores } from "../disenio";
import { iniciales } from "./FotoNegocio";

/**
 * "Este negocio no tiene foto todavía" en tarjetas y filas pequeñas: iniciales en verde de marca
 * sobre gris verdoso — el mismo tratamiento que `FotoNegocio` usa en grande, para que un negocio
 * sin foto se vea igual en todas las pantallas. (Antes eran iniciales blancas sobre un color
 * distinto por negocio; con el rediseño "Vitrina" el color lo ponen las fotos, no los avatares.)
 */
export function AvatarNegocio({
  nombre,
  size = 44,
  radio,
  style,
}: {
  nombre: string;
  size?: number;
  /** Por defecto, circular (size / 2). Pasar un valor para esquinas menos redondeadas (tarjetas cuadradas). */
  radio?: number;
  style?: ViewStyle;
}) {
  const colores = useColores();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radio ?? size / 2,
          backgroundColor: colores.superficieHundida,
        },
        style,
      ]}
    >
      <Text style={[styles.texto, { fontSize: size * 0.34, color: colores.primario, letterSpacing: -size * 0.012 }]}>
        {iniciales(nombre)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    fontFamily: "SchibstedGrotesk_800ExtraBold",
  },
});
