import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { CategoriaNotificacion } from "../config/categoriasNotificacion";

export function TarjetaNotificacion({
  categoria,
  titulo,
  texto,
  tiempo,
  leida,
  onPress,
}: {
  categoria: CategoriaNotificacion;
  titulo: string;
  texto: string;
  tiempo?: string;
  leida: boolean;
  onPress?: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <Pressable style={styles.sombra} onPress={onPress}>
      <View style={styles.tarjeta}>
        <View style={[styles.icono, { backgroundColor: categoria.colorFondo }]}>
          <Text style={styles.emoji}>{categoria.emoji}</Text>
        </View>
        <View style={styles.cuerpo}>
          <View style={styles.filaTop}>
            <Text style={styles.titulo} numberOfLines={2}>
              {titulo}
            </Text>
            {tiempo ? <Text style={styles.tiempo}>{tiempo}</Text> : null}
          </View>
          <Text style={styles.texto} numberOfLines={2}>
            {texto}
          </Text>
          <View style={[styles.pill, { backgroundColor: categoria.colorFondo }]}>
            <Text style={[styles.pillTexto, { color: categoria.colorTexto }]}>{categoria.nombre}</Text>
          </View>
        </View>
        {!leida ? <View style={styles.puntoSinLeer} /> : null}
      </View>
    </Pressable>
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
    tarjeta: {
      flexDirection: "row",
      gap: espaciado.sm,
      borderRadius: radios.lg,
      overflow: "hidden",
      padding: espaciado.md,
    },
    icono: {
      width: 40,
      height: 40,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: {
      fontSize: 18,
    },
    cuerpo: {
      flex: 1,
      gap: 3,
    },
    filaTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: espaciado.sm,
    },
    titulo: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13.5,
      color: colores.texto,
      flex: 1,
    },
    tiempo: {
      ...tipografia.pie,
      fontSize: 10.5,
      color: colores.textoTenue,
    },
    texto: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 3,
      borderRadius: radios.completo,
      marginTop: 3,
    },
    pillTexto: {
      ...tipografia.etiqueta,
      fontSize: 9.5,
      textTransform: "uppercase",
    },
    puntoSinLeer: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colores.acentoFuerte,
      marginTop: 3,
    },
  });
}
