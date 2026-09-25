import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { HojaInferior } from "./HojaInferior";

function FilaAccion({
  icono,
  texto,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <Ionicons name={icono} size={19} color={colores.texto} />
      <Text style={styles.filaTexto}>{texto}</Text>
    </Pressable>
  );
}

export function MenuAccionesNegocio({
  visible,
  nombreNegocio,
  onCerrar,
  onVerInformacion,
  onCalificar,
  onCompartir,
}: {
  visible: boolean;
  nombreNegocio: string;
  onCerrar: () => void;
  onVerInformacion: () => void;
  onCalificar: () => void;
  onCompartir: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <Text style={styles.nombre}>{nombreNegocio}</Text>
      <View style={styles.separador} />
      <FilaAccion icono="information-circle-outline" texto="Información del negocio" onPress={onVerInformacion} />
      <FilaAccion icono="star-outline" texto="Calificar este negocio" onPress={onCalificar} />
      <FilaAccion icono="share-social-outline" texto="Compartir" onPress={onCompartir} />
    </HojaInferior>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 16,
      color: colores.texto,
    },
    separador: {
      height: 1,
      backgroundColor: colores.borde,
      marginVertical: espaciado.sm,
    },
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.sm + 2,
    },
    filaTexto: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
    },
  });
}
