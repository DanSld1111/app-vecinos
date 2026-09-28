import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";

const ICONO_POR_RUBRO: Record<string, keyof typeof Ionicons.glyphMap> = {
  Pintura: "color-palette-outline",
  Electricidad: "flash-outline",
  Gasfitería: "water-outline",
  Herramientas: "hammer-outline",
  Cerrajería: "key-outline",
  Jardinería: "leaf-outline",
};

export function CategoriasRubroNegocio({
  rubros,
  titulo = "Qué encuentras aquí",
}: {
  rubros: string[];
  /** Título de la sección: el que configuró la categoría en el panel, o el de la ficha. */
  titulo?: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  if (rubros.length === 0) return null;

  return (
    <View>
      <Text style={styles.tituloSeccion}>{titulo}</Text>
      <View style={styles.grid}>
        {rubros.map((rubro) => (
          <View key={rubro} style={styles.tarjeta}>
            <View style={styles.icono}>
              <Ionicons name={ICONO_POR_RUBRO[rubro] ?? "pricetag-outline"} size={16} color={colores.primario} />
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
      ...tipografia.subtitulo,
      color: colores.texto,
      marginTop: espaciado.lg,
      marginBottom: espaciado.xs,
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
