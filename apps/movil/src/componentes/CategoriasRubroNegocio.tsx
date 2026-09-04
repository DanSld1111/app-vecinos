import { StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

const EMOJI_POR_RUBRO: Record<string, string> = {
  Pintura: "🎨",
  Electricidad: "💡",
  Gasfitería: "🚰",
  Herramientas: "🔧",
  Cerrajería: "🔒",
  Jardinería: "🌱",
};

export function CategoriasRubroNegocio({ rubros }: { rubros: string[] }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (rubros.length === 0) return null;

  return (
    <View>
      <Text style={styles.tituloSeccion}>Qué encuentras aquí</Text>
      <View style={styles.grid}>
        {rubros.map((rubro) => (
          <View key={rubro} style={styles.tarjeta}>
            <View style={styles.icono}>
              <Text style={styles.emoji}>{EMOJI_POR_RUBRO[rubro] ?? "🏷️"}</Text>
            </View>
            <Text style={styles.nombre}>{rubro}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tituloSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.md,
      marginBottom: espaciado.sm,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    tarjeta: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.md,
      padding: espaciado.sm,
    },
    icono: {
      width: 30,
      height: 30,
      borderRadius: radios.sm,
      backgroundColor: colores.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: {
      fontSize: 15,
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      fontSize: 12.5,
      color: colores.texto,
      flexShrink: 1,
    },
  });
}
