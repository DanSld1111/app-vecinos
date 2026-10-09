import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AvisoFicha } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

/**
 * Aviso fijo de la categoría bajo la descripción del negocio (decisión 0088): "+18" en
 * Licorerías, receta en Veterinarias, o uno informativo. La primera oración va en negrita.
 */
export function AvisoFichaNegocio({ aviso }: { aviso: AvisoFicha }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const fondo =
    aviso.tipo === "mayores18" ? colores.acentoSuave : aviso.tipo === "receta" ? colores.primarioSuave : colores.superficieHundida;
  const corte = aviso.texto.indexOf(". ");
  const primera = corte > 0 ? aviso.texto.slice(0, corte + 1) : aviso.texto;
  const resto = corte > 0 ? aviso.texto.slice(corte + 1) : "";

  return (
    <View style={[styles.caja, { backgroundColor: fondo }]} accessibilityRole="text">
      <View style={styles.circulo}>
        {aviso.tipo === "mayores18" ? (
          <Text style={styles.mas18}>+18</Text>
        ) : (
          <Ionicons
            name={aviso.tipo === "receta" ? "medkit-outline" : "information-circle-outline"}
            size={18}
            color={aviso.tipo === "receta" ? colores.primarioFuerte : colores.textoSuave}
          />
        )}
      </View>
      <Text style={styles.texto}>
        <Text style={styles.negrita}>{primera}</Text>
        {resto}
      </Text>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    caja: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      borderRadius: radios.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginTop: espaciado.md,
    },
    circulo: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colores.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    mas18: {
      ...tipografia.pie,
      fontSize: 13,
      fontFamily: "SchibstedGrotesk_800ExtraBold",
      color: colores.acentoFuerte,
    },
    texto: {
      ...tipografia.pie,
      fontSize: 13,
      lineHeight: 18,
      color: colores.texto,
      flex: 1,
    },
    negrita: {
      fontFamily: "SchibstedGrotesk_700Bold",
    },
  });
}
