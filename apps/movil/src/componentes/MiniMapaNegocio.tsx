import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Coordenada } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

/** Embed clásico de Google Maps (sin API key) — interactivo: se puede arrastrar, hacer zoom y
 * cambiar a vista satelital, igual que en cualquier sitio web que "incrusta" una ubicación. */
function urlEmbedGoogleMaps(coordenada: Coordenada) {
  return `https://www.google.com/maps?q=${coordenada.lat},${coordenada.lng}&z=16&output=embed`;
}

export function MiniMapaNegocio({
  coordenada,
  direccion,
}: {
  coordenada: Coordenada;
  direccion: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  function abrirGoogleMaps() {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordenada.lat},${coordenada.lng}`;
    Linking.openURL(url);
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.mapaPreview}>
        <WebView source={{ uri: urlEmbedGoogleMaps(coordenada) }} style={styles.mapaWebview} />
      </View>
      <Pressable style={styles.pieMapa} onPress={abrirGoogleMaps}>
        <Text style={styles.direccion} numberOfLines={1}>
          {direccion}
        </Text>
        <View style={styles.enlace}>
          <Ionicons name="navigate-outline" size={14} color={colores.primarioFuerte} />
          <Text style={styles.enlaceTexto}>Abrir en Google Maps</Text>
        </View>
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      borderRadius: radios.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colores.borde,
    },
    mapaPreview: {
      height: 180,
      backgroundColor: colores.superficieHundida,
    },
    mapaWebview: {
      flex: 1,
      backgroundColor: "transparent",
    },
    pieMapa: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: espaciado.sm,
      backgroundColor: colores.superficie,
    },
    direccion: {
      ...tipografia.pie,
      color: colores.textoSuave,
      flex: 1,
      marginRight: espaciado.sm,
    },
    enlace: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    enlaceTexto: {
      ...tipografia.pie,
      fontSize: 12,
      fontFamily: "SchibstedGrotesk_700Bold",
      color: colores.primarioFuerte,
    },
  });
}
