import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Negocio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estaAbiertoAhora } from "../utilidades/horarios";
import { minutosCaminando } from "../utilidades/distancia";
import { urlCompleta } from "../utilidades/media";
import { SinFoto } from "./SinFoto";

export function TarjetaDestacadoGrande({
  negocio,
  onPress,
}: {
  negocio: Negocio;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const abierto = estaAbiertoAhora(negocio.horarios);
  const minutos = minutosCaminando(negocio.coordenada);

  return (
    <Pressable style={styles.contenedor} onPress={onPress}>
      {negocio.fotoPrincipalUrl ? (
        <Image source={{ uri: urlCompleta(negocio.fotoPrincipalUrl) }} style={styles.imagen} />
      ) : (
        <SinFoto tamanoIcono={30} style={styles.imagen} />
      )}
      {negocio.verificadoEn ? (
        <View style={styles.badge}>
          <Ionicons name="ribbon" size={11} color={colores.primarioFuerte} />
          <Text style={styles.badgeTexto}>Verificado</Text>
        </View>
      ) : null}
      <View style={styles.cuerpo}>
        <Text style={styles.nombre}>{negocio.nombre}</Text>
        <Text style={styles.descripcion} numberOfLines={1}>
          {negocio.descripcion}
        </Text>
        <View style={styles.filaMeta}>
          <Text style={styles.meta}>🚶 {minutos} min caminando</Text>
          <Text style={styles.meta}>{abierto ? "🕐 Abierto ahora" : "🕐 Cerrado ahora"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      overflow: "hidden",
    },
    imagen: {
      width: "100%",
      height: 110,
    },
    badge: {
      position: "absolute",
      top: espaciado.sm,
      left: espaciado.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colores.superficie,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 4,
      borderRadius: radios.completo,
    },
    badgeTexto: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: colores.primarioFuerte,
    },
    cuerpo: {
      padding: espaciado.md,
      gap: 4,
    },
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 16,
      color: colores.texto,
    },
    descripcion: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    filaMeta: {
      flexDirection: "row",
      gap: espaciado.md,
      marginTop: 4,
    },
    meta: {
      ...tipografia.pie,
      fontSize: 11,
      color: colores.textoSuave,
    },
  });
}
