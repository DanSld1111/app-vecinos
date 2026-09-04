import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

/**
 * Versión grande de TarjetaCategoria — foto de fondo completa, igual que las tarjetas de
 * Servicios (ImageBackground + degradado). Se usa solo para 1-2 categorías destacadas arriba de
 * la fila normal de categorías chicas. Ver docs/decisiones/0030-categorias-destacadas-grandes.md.
 * Sin insignia de ícono encima de la foto — solo foto y nombre, a pedido del usuario.
 */
export function TarjetaCategoriaDestacada({
  nombre,
  fotoUrl,
  onPress,
}: {
  nombre: string;
  fotoUrl: string | null;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable style={styles.sombra} onPress={onPress}>
      {fotoUrl ? (
        <ImageBackground
          source={{ uri: fotoUrl }}
          style={styles.tarjeta}
          imageStyle={styles.imagen}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(8,10,8,0.05)", "rgba(8,10,8,0.15)", "rgba(8,10,8,0.75)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.nombre} numberOfLines={1}>
            {nombre}
          </Text>
        </ImageBackground>
      ) : (
        <View style={[styles.tarjeta, styles.tarjetaSinFoto]}>
          <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1}>
            {nombre}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    sombra: {
      flex: 1,
      borderRadius: radios.lg,
      overflow: "hidden",
    },
    tarjeta: {
      height: 100,
      justifyContent: "flex-end",
      padding: espaciado.sm + 2,
    },
    imagen: {
      width: "100%",
      height: "100%",
    },
    tarjetaSinFoto: {
      backgroundColor: colores.primarioSuave,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13.5,
      color: "#ffffff",
    },
  });
}
