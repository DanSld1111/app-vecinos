import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
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
    <Pressable
      style={styles.fila}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${leida ? "" : "Sin leer. "}${titulo}. ${texto}`}
    >
      <View style={[styles.icono, { backgroundColor: categoria.colorFondo }]}>
        <Ionicons name={categoria.icono} size={17} color={categoria.colorTexto} />
      </View>
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>
          {titulo}
        </Text>
        <Text style={styles.texto} numberOfLines={2}>
          {texto}
        </Text>
        <Text style={styles.meta}>
          {categoria.nombre}
          {tiempo ? ` · ${tiempo}` : ""}
        </Text>
      </View>
      {!leida ? <View style={styles.puntoSinLeer} /> : null}
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fila: {
      flexDirection: "row",
      gap: espaciado.md,
      paddingVertical: espaciado.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.bordeFuerte,
    },
    icono: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    cuerpo: { flex: 1, gap: 2 },
    titulo: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    texto: { ...tipografia.pie, fontSize: 13, lineHeight: 18, color: colores.textoSuave },
    meta: { ...tipografia.pie, fontSize: 11.5, color: colores.textoTenue, marginTop: 2 },
    puntoSinLeer: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.acentoFuerte, marginTop: 6 },
  });
}
