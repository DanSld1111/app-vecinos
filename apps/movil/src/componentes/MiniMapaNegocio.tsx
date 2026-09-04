import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Coordenada } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

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
    <Pressable style={styles.contenedor} onPress={abrirGoogleMaps}>
      <View style={styles.mapaPreview}>
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
    },
    pin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colores.acento,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colores.superficieHundida,
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
