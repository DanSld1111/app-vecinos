import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";

export function iniciales(nombre: string): string {
  const palabras = nombre.split(" ").filter(Boolean);
  return ((palabras[0]?.[0] ?? "") + (palabras[1]?.[0] ?? "")).toUpperCase();
}

/**
 * La foto de un negocio (o producto) en cualquier tamaño. La imagen entra con un fundido de
 * 250 ms en vez de aparecer de golpe. Si no hay foto, muestra las iniciales grandes en verde de
 * marca sobre gris verdoso, en vez de un recuadro vacío que parece imagen rota.
 * Con `avisoSinFoto` (la portada de la ficha) agrega debajo "Este negocio aún no subió fotos".
 */
export function FotoNegocio({
  nombre,
  url,
  style,
  tamanoIniciales,
  avisoSinFoto = false,
  posicion,
  fundido = true,
}: {
  nombre: string;
  url: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  /** Por defecto se calcula con la altura del estilo; pasarlo explícito si la altura es flexible. */
  tamanoIniciales?: number;
  avisoSinFoto?: boolean;
  /** Encuadre de la foto (ej. "top" para fachadas). */
  posicion?: "center" | "top" | "bottom";
  /** false cuando la foto ya viene "volando" a su lugar (ver FotoEnVuelo): aparecer con otro fundido la haría parpadear. */
  fundido?: boolean;
}) {
  const colores = useColores();
  const uri = urlCompleta(url);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { backgroundColor: colores.superficieHundida2 }, style as StyleProp<ImageStyle>]}
        contentFit="cover"
        contentPosition={posicion ?? "center"}
        transition={fundido ? 250 : 0}
        accessibilityLabel={`Foto de ${nombre}`}
      />
    );
  }

  const alto = StyleSheet.flatten(style)?.height;
  const tamano = tamanoIniciales ?? (typeof alto === "number" ? Math.max(14, Math.min(72, alto * 0.3)) : 20);

  return (
    <View
      style={[styles.base, styles.vacio, { backgroundColor: colores.superficieHundida }, style]}
      accessibilityLabel={`${nombre}, sin foto`}
    >
      <Text
        style={{
          fontFamily: "SchibstedGrotesk_800ExtraBold",
          fontSize: tamano,
          lineHeight: tamano * 1.1,
          letterSpacing: -tamano * 0.04,
          color: colores.primario,
        }}
      >
        {iniciales(nombre)}
      </Text>
      {avisoSinFoto ? (
        <Text style={{ fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 11, color: colores.textoTenue, marginTop: 2 }}>
          Este negocio aún no subió fotos
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
  vacio: { alignItems: "center", justifyContent: "center" },
});
