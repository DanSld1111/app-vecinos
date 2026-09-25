import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Categoria, Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estadoHoyTexto } from "../utilidades/horarios";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";

/** Tarjeta grande con foto — plantilla "Menú" (Restaurantes): la comida "habla" con la foto, en
 * vez de una fila compacta. Ver docs/decisiones/0072-servicio-dueno-de-categoria.md. */
export function TarjetaNegocioMenu({
  negocio,
  categorias,
  onPress,
}: {
  negocio: Negocio;
  /** Para el subtítulo de la tarjeta ("Criollo · Parrillas") — se resuelven por categoriaIds. */
  categorias?: Categoria[];
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const estado = estadoHoyTexto(negocio.horarios);
  const nombresCategorias = negocio.categoriaIds
    .map((id) => categorias?.find((c) => c.id === id)?.nombre)
    .filter((n): n is string => Boolean(n))
    .join(" · ");

  const contenidoTextos = (colorTexto: string, colorSubtitulo: string) => (
    <>
      <Text style={[styles.nombre, { color: colorTexto }]} numberOfLines={1}>
        {negocio.nombre}
      </Text>
      <Text style={[styles.subtitulo, { color: colorSubtitulo }]} numberOfLines={1}>
        {nombresCategorias || negocio.direccion}
      </Text>
    </>
  );

  return (
    <Pressable style={styles.sombra} onPress={onPress}>
      {negocio.fotoPrincipalUrl ? (
        <ImageBackground source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.tarjeta} imageStyle={styles.imagen}>
          <LinearGradient
            colors={["rgba(8,10,8,0.05)", "rgba(8,10,8,0.15)", "rgba(8,10,8,0.85)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.pill, estado.abierto ? styles.pillAbierto : styles.pillCerrado]}>
            <Text style={styles.pillTexto}>{estado.abierto ? `🟢 Abierto · ${estado.detalle}` : `⚪ Cerrado · ${estado.detalle}`}</Text>
          </View>
          <View style={styles.textos}>{contenidoTextos("#ffffff", "rgba(255,255,255,0.85)")}</View>
        </ImageBackground>
      ) : (
        <View style={styles.tarjeta}>
          <SinFoto tamanoIcono={28} style={StyleSheet.absoluteFill} />
          <View style={[styles.pill, estado.abierto ? styles.pillAbierto : styles.pillCerrado, styles.pillSinFoto]}>
            <Text style={styles.pillTexto}>{estado.abierto ? `🟢 Abierto · ${estado.detalle}` : `⚪ Cerrado · ${estado.detalle}`}</Text>
          </View>
          <View style={styles.textosSinFoto}>{contenidoTextos(colores.texto, colores.textoSuave)}</View>
        </View>
      )}
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    sombra: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 3,
    },
    tarjeta: {
      height: 150,
      borderRadius: radios.lg,
      overflow: "hidden",
      justifyContent: "space-between",
      padding: espaciado.md,
    },
    imagen: {
      borderRadius: radios.lg,
    },
    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    pillSinFoto: {
      backgroundColor: colores.superficieHundida2,
    },
    pillAbierto: {
      backgroundColor: colores.primario,
    },
    pillCerrado: {
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    pillTexto: {
      ...tipografia.pie,
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      color: "#ffffff",
    },
    textos: {
      gap: 2,
    },
    textosSinFoto: {
      gap: 2,
      marginTop: espaciado.lg,
    },
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: "#ffffff",
    },
    subtitulo: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
    },
  });
}
