import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Coordenada } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

const ZOOM_MAPA = 16;

/** Tile de OpenStreetMap (tile.openstreetmap.org) que contiene la coordenada — servidor público
 * oficial, sin API key. Funciona igual en web y nativo con un <Image> normal. */
function urlTileMapa(coordenada: Coordenada) {
  const n = 2 ** ZOOM_MAPA;
  const latRad = (coordenada.lat * Math.PI) / 180;
  const x = Math.floor(((coordenada.lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return `https://tile.openstreetmap.org/${ZOOM_MAPA}/${x}/${y}.png`;
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
  const [mapaFallo, setMapaFallo] = useState(false);

  function abrirGoogleMaps() {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordenada.lat},${coordenada.lng}`;
    Linking.openURL(url);
  }

  return (
    <Pressable style={styles.contenedor} onPress={abrirGoogleMaps}>
      <View style={styles.mapaPreview}>
        {!mapaFallo ? (
          <Image
            source={{ uri: urlTileMapa(coordenada) }}
            style={styles.mapaImagen}
            resizeMode="cover"
            onError={() => setMapaFallo(true)}
          />
        ) : null}
        <View style={styles.pin}>
          <Ionicons name="location" size={20} color="#ffffff" />
        </View>
      </View>
      <View style={styles.pieMapa}>
        <Text style={styles.direccion} numberOfLines={1}>
          {direccion}
        </Text>
        <View style={styles.enlace}>
          <Ionicons name="navigate-outline" size={14} color={colores.primarioFuerte} />
          <Text style={styles.enlaceTexto}>Abrir en Google Maps</Text>
        </View>
      </View>
    </Pressable>
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
      height: 110,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    mapaImagen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    pin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colores.acento,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: "#ffffff",
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
