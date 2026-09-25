import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estaAbiertoAhora } from "../utilidades/horarios";
import { formatearDistancia, minutosCaminando } from "../utilidades/distancia";
import { urlCompleta } from "../utilidades/media";
import { AvatarNegocio } from "./AvatarNegocio";

export function TarjetaNegocio({
  negocio,
  popular = false,
  onPress,
}: {
  negocio: Negocio;
  /** Insignia "🔥 Popular" — la decide quien arma la lista (ej. Inicio, solo para el más
   * visitado real), no este componente. */
  popular?: boolean;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const abierto = estaAbiertoAhora(negocio.horarios);
  // Con distancia real del backend (Negocio.distanciaM, viene cuando Inicio pidió con GPS):
  // se muestra ella y los minutos que salen de ahí — no la aproximación desde el centro del
  // distrito que usa minutosCaminando() sin ubicación real. Ver docs/decisiones/0073.
  const tieneDistanciaReal = negocio.distanciaM != null;
  const minutos = tieneDistanciaReal
    ? Math.max(1, Math.round((negocio.distanciaM as number) / 80))
    : minutosCaminando(negocio.coordenada);

  return (
    <View style={styles.sombra}>
      <Pressable style={styles.contenedor} onPress={onPress}>
        {negocio.fotoPrincipalUrl ? (
          <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.miniatura} />
        ) : (
          <AvatarNegocio nombre={negocio.nombre} size={54} radio={radios.md} />
        )}
        <View style={styles.texto}>
          <View style={styles.filaNombre}>
            <Text style={styles.nombre} numberOfLines={1}>
              {negocio.nombre}
            </Text>
            {negocio.verificadoEn ? (
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            ) : null}
            {popular ? (
              <View style={styles.badgePopular}>
                <Text style={styles.badgePopularTexto}>🔥 Popular</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.direccion} numberOfLines={1}>
            {negocio.direccion}
          </Text>
          <View style={styles.filaTags}>
            <Text style={[styles.tag, abierto ? styles.tagAbierto : styles.tagCerrado]}>
              ● {abierto ? "Abierto" : "Cerrado"}
            </Text>
            {tieneDistanciaReal ? (
              <Text style={styles.tagDistancia}>
                📍 {formatearDistancia(negocio.distanciaM as number)} · {minutos} min
              </Text>
            ) : (
              <Text style={styles.tagDistancia}>🚶 {minutos} min</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colores.textoTenue} />
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    sombra: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    contenedor: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      borderRadius: radios.lg,
      overflow: "hidden",
      padding: espaciado.sm + 2,
    },
    miniatura: {
      width: 54,
      height: 54,
      borderRadius: radios.md,
    },
    texto: {
      flex: 1,
      gap: 3,
    },
    filaNombre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 14.5,
      color: colores.texto,
      flexShrink: 1,
    },
    tick: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: colores.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    direccion: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    badgePopular: {
      backgroundColor: colores.acentoSuave,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radios.completo,
    },
    badgePopularTexto: {
      ...tipografia.pie,
      fontSize: 9,
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: colores.acentoFuerte,
    },
    filaTags: {
      flexDirection: "row",
      gap: espaciado.sm,
      marginTop: 1,
    },
    tag: {
      ...tipografia.pie,
      fontSize: 11,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    tagAbierto: {
      color: colores.primarioFuerte,
    },
    tagCerrado: {
      color: colores.textoTenue,
    },
    tagDistancia: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoTenue,
      fontFamily: "PlusJakartaSans_600SemiBold",
    },
  });
}
