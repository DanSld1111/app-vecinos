import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Comunidad } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { useComunidadActiva } from "../estado/comunidadActiva";
import { useComunidadesActivas } from "../datos/hooks/useComunidades";

export function SelectorComunidad({ onSeleccionar }: { onSeleccionar: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const { comunidad, establecerComunidad } = useComunidadActiva();
  const { data: comunidades } = useComunidadesActivas();

  function elegir(item: Comunidad) {
    establecerComunidad(item);
    onSeleccionar();
  }

  return (
    <View>
      <Text style={styles.titulo}>Elige tu comunidad</Text>

      {(comunidades ?? []).map((item) => (
        <Pressable key={item.id} style={styles.fila} onPress={() => elegir(item)}>
          <View style={styles.icono}>
            <Ionicons name="location" size={16} color={colores.primario} />
          </View>
          <Text style={styles.nombre}>{item.nombre}</Text>
          {item.id === comunidad?.id ? (
            <Ionicons name="checkmark-circle" size={20} color={colores.primario} />
          ) : null}
        </Pressable>
      ))}

      <View style={[styles.fila, styles.filaInactiva]}>
        <View style={styles.icono}>
          <Ionicons name="add" size={16} color={colores.textoTenue} />
        </View>
        <Text style={[styles.nombre, styles.nombreInactivo]}>Agregar otra comunidad</Text>
        <Text style={styles.proximamente}>Próximamente</Text>
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    titulo: {
      ...tipografia.subtitulo,
      color: colores.texto,
      marginBottom: espaciado.md,
    },
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    filaInactiva: {
      opacity: 0.6,
      borderBottomWidth: 0,
      marginTop: espaciado.xs,
    },
    icono: {
      width: 32,
      height: 32,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    nombre: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      flex: 1,
    },
    nombreInactivo: {
      color: colores.textoTenue,
    },
    proximamente: {
      ...tipografia.pie,
      color: colores.textoTenue,
    },
  });
}
