import { useRef } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
  /** Recibe la vista de la tarjeta, para que la foto pueda "volar" hasta la ficha. */
  onPress: (vistaFoto: View | null) => void;
}) {
  const refTarjeta = useRef<View>(null);
  const colores = useColores();
  const styles = crearEstilos(colores);
  const estado = estadoHoyTexto(negocio.horarios);
  const nombresCategorias = negocio.categoriaIds
    .map((id) => categorias?.find((c) => c.id === id)?.nombre)
    .filter((n): n is string => Boolean(n))
    .join(" · ");

  const contenidoTextos = (colorTexto: string, colorSubtitulo: string) => (
    <>
      <View style={styles.filaNombre}>
        <Text style={[styles.nombre, { color: colorTexto }]} numberOfLines={1}>
          {negocio.nombre}
        </Text>
        {negocio.calificacionTotal > 0 ? (
          <View style={styles.filaCalificacion}>
            <Ionicons name="star" size={11} color={colores.calificacion} />
            <Text style={[styles.calificacionTexto, { color: colorTexto }]}>{negocio.calificacionPromedio}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.subtitulo, { color: colorSubtitulo }]} numberOfLines={1}>
        {nombresCategorias || negocio.direccion}
      </Text>
    </>
  );

  return (
    <Pressable style={styles.sombra} onPress={() => onPress(refTarjeta.current)} accessibilityRole="button" accessibilityLabel={negocio.nombre}>
      <View ref={refTarjeta} collapsable={false}>
      {negocio.fotoPrincipalUrl ? (
        <ImageBackground source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.tarjeta} imageStyle={styles.imagen}>
          <LinearGradient
            colors={["rgba(8,10,8,0.05)", "rgba(8,10,8,0.15)", "rgba(8,10,8,0.85)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.pill, estado.abierto ? styles.pillAbierto : styles.pillCerrado]}>
            <Text style={styles.pillTexto}>{estado.abierto ? `● Abierto · ${estado.detalle}` : `○ Cerrado · ${estado.detalle}`}</Text>
          </View>
          <View style={styles.textos}>{contenidoTextos("#ffffff", "rgba(255,255,255,0.85)")}</View>
        </ImageBackground>
      ) : (
        <View style={styles.tarjeta}>
          <SinFoto tamanoIcono={28} style={StyleSheet.absoluteFill} />
          <View style={[styles.pill, estado.abierto ? styles.pillAbierto : styles.pillCerrado, styles.pillSinFoto]}>
            <Text style={styles.pillTexto}>{estado.abierto ? `● Abierto · ${estado.detalle}` : `○ Cerrado · ${estado.detalle}`}</Text>
          </View>
          <View style={styles.textosSinFoto}>{contenidoTextos(colores.texto, colores.textoSuave)}</View>
        </View>
      )}
      </View>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    sombra: {
      borderRadius: 10,
      backgroundColor: colores.superficie,

      elevation: 3,
    },
    tarjeta: {
      height: 150,
      borderRadius: 10,
      overflow: "hidden",
      justifyContent: "space-between",
      padding: espaciado.md,
    },
    imagen: {
      borderRadius: 10,
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
      fontFamily: "SchibstedGrotesk_700Bold",
      color: "#ffffff",
    },
    textos: {
      gap: 2,
    },
    textosSinFoto: {
      gap: 2,
      marginTop: espaciado.lg,
    },
    filaNombre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: "#ffffff",
      flexShrink: 1,
    },
    filaCalificacion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flexShrink: 0,
    },
    calificacionTexto: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "SchibstedGrotesk_700Bold",
    },
    subtitulo: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
    },
  });
}
