import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Coordenada } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

/** Embed clásico de Google Maps (sin API key) — interactivo: se puede arrastrar, hacer zoom y
 * cambiar a vista satelital, igual que en cualquier sitio web que "incrusta" una ubicación.
 * Versión web: react-native-webview no soporta este plataforma, así que se usa un <iframe> real
 * (Metro resuelve este archivo .web.tsx en vez de MiniMapaNegocio.tsx solo para el build de web). */
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
        <iframe
          src={urlEmbedGoogleMaps(coordenada)}
          style={{ border: 0, width: "100%", height: "100%" }}
          loading="lazy"
          title="Ubicación del negocio"
        />
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
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.primarioFuerte,
    },
  });
}
