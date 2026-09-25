import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
      <Text style={styles.nombre} numberOfLines={1}>
        {negocio.nombre}
      </Text>
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
    nombre: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      marginTop: espaciado.xs,
    },
    direccion: {
      ...tipografia.pie,
      color: colores.textoTenue,
    },
  });
}
