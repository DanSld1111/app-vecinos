import { StyleSheet, Text, View } from "react-native";
import { Comunidad } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";

export function SobreComunidad({ comunidad }: { comunidad: Comunidad }) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Sobre {comunidad.nombre}</Text>
      {comunidad.descripcion ? (
        <Text style={styles.texto}>{comunidad.descripcion}</Text>
      ) : (
        <Text style={styles.textoVacio}>
          Todavía no se cargó información sobre esta comunidad.
        </Text>
      )}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      gap: espaciado.sm,
      paddingBottom: espaciado.md,
    },
    titulo: {
      ...tipografia.display,
      color: colores.texto,
    },
    texto: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
      lineHeight: 22,
    },
    textoVacio: {
      ...tipografia.cuerpo,
      color: colores.textoTenue,
      fontStyle: "italic",
    },
  });
}
