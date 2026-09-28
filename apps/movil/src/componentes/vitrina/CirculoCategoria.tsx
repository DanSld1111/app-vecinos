import { StyleSheet, Text } from "react-native";
import { PaletaColores, useColores } from "../../disenio";
import { FotoNegocio } from "../FotoNegocio";
import { Tocable } from "../Tocable";

/**
 * Categoría como foto redonda con su nombre debajo (reemplaza a los íconos en cuadrados pastel).
 * La foto es la que sube el admin en Categorías; si una categoría aún no tiene, se ven sus
 * iniciales en verde, igual que un negocio sin foto.
 */
export function CirculoCategoria({
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
    <Tocable style={styles.contenedor} onPress={onPress} accessibilityRole="button" accessibilityLabel={nombre}>
      <FotoNegocio nombre={nombre} url={fotoUrl} style={styles.foto} tamanoIniciales={18} />
      <Text style={styles.nombre} numberOfLines={1}>
        {nombre}
      </Text>
    </Tocable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { width: 78, alignItems: "center", gap: 6 },
    foto: { width: 56, height: 56, borderRadius: 28 },
    nombre: {
      fontFamily: "SchibstedGrotesk_600SemiBold",
      fontSize: 11.5,
      lineHeight: 14,
      color: colores.texto,
      textAlign: "center",
    },
  });
}
