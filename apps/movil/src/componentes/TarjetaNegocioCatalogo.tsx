import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";

/** Tarjeta de vitrina — plantilla "Catálogo" (Market Space, Turismo, Inmobiliaria): grilla de
 * 2 columnas, foto cuadrada al frente. Ver docs/decisiones/0072-servicio-dueno-de-categoria.md. */
export function TarjetaNegocioCatalogo({ negocio, onPress }: { negocio: Negocio; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable style={styles.tarjeta} onPress={onPress}>
      {negocio.fotoPrincipalUrl ? (
        <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.foto} />
      ) : (
        <SinFoto icono="storefront-outline" tamanoIcono={26} style={styles.foto} />
      )}
      <View style={styles.filaNombre}>
        <Text style={styles.nombre} numberOfLines={1}>
          {negocio.nombre}
        </Text>
        {negocio.calificacionTotal > 0 ? (
          <View style={styles.filaCalificacion}>
            <Ionicons name="star" size={10} color="#e0a835" />
            <Text style={styles.calificacionTexto}>{negocio.calificacionPromedio}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.direccion} numberOfLines={1}>
        {negocio.direccion}
      </Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      flex: 1,
    },
    foto: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: radios.lg,
      backgroundColor: colores.superficieHundida,
    },
    filaNombre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: espaciado.xs,
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
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
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.texto,
    },
    direccion: {
      ...tipografia.pie,
      color: colores.textoTenue,
    },
  });
}
