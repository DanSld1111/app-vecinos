import { StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { BotonPrimario } from "./BotonPrimario";

export function EstadoVacio({
  titulo,
  accionTexto,
  onAccion,
}: {
  titulo: string;
  accionTexto?: string;
  onAccion?: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>{titulo}</Text>
      {accionTexto && onAccion ? (
        <BotonPrimario texto={accionTexto} onPress={onAccion} variante="fantasma" style={styles.boton} />
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      paddingVertical: espaciado.xxl,
      alignItems: "center",
      gap: espaciado.md,
    },
    titulo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      textAlign: "center",
    },
    boton: {
      marginTop: espaciado.xs,
    },
  });
}
