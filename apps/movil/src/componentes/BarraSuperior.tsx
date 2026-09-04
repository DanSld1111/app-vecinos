import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, tipografia, useColores } from "../disenio";
import { IlustracionSaludo } from "./IlustracionSaludo";
import { saludoSegunHora } from "../utilidades/saludo";

export function BarraSuperior({
  nombreComunidad,
  hayAvisosNuevos = true,
  onAbrirComunidad,
  onAbrirAvisos,
}: {
  nombreComunidad: string;
  hayAvisosNuevos?: boolean;
  onAbrirComunidad: () => void;
  onAbrirAvisos: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);

  return (
    <View style={styles.contenedor}>
      <Pressable style={styles.saludoBloque} onPress={onAbrirComunidad}>
        <IlustracionSaludo />
        <View>
          <Text style={styles.hora}>{saludoSegunHora()}</Text>
          <Text style={styles.nombre}>{nombreComunidad} hoy ▾</Text>
        </View>
      </Pressable>

      <Pressable style={styles.campana} onPress={onAbrirAvisos}>
        <Ionicons name="notifications-outline" size={20} color={colores.texto} />
        {hayAvisosNuevos ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: espaciado.lg,
      paddingTop: espaciado.sm,
      paddingBottom: espaciado.xs,
    },
    saludoBloque: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      flexShrink: 1,
    },
    hora: {
      ...tipografia.etiqueta,
      fontSize: 11,
      color: colores.textoTenue,
      textTransform: "uppercase",
    },
    nombre: {
      ...tipografia.displaySeccion,
      fontSize: 18,
      color: colores.texto,
    },
    campana: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    badge: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colores.acento,
      borderWidth: 1.5,
      borderColor: colores.superficieHundida,
    },
  });
}
