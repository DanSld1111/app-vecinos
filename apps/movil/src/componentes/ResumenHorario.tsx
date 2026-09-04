import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Horarios } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estadoHoyTexto, listaSemanaCompleta, resumenSemana } from "../utilidades/horarios";

export function ResumenHorario({ horarios }: { horarios: Horarios }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [expandido, setExpandido] = useState(false);
  const estado = estadoHoyTexto(horarios);
  const semana = resumenSemana(horarios);

  return (
    <View>
      <View style={styles.filaEstado}>
        <View style={[styles.punto, estado.abierto ? styles.puntoAbierto : styles.puntoCerrado]} />
        <Text style={[styles.textoEstado, estado.abierto ? styles.textoAbierto : styles.textoCerrado]}>
          {estado.abierto ? "Abierto ahora" : "Cerrado ahora"}
        </Text>
        <Text style={styles.detalleEstado}>· {estado.detalle}</Text>
      </View>

      <Pressable style={styles.filaSemana} onPress={() => setExpandido((v) => !v)}>
        {semana.map((d) => (
          <View key={d.dia} style={[styles.diaCelda, d.esHoy && styles.diaCeldaHoy]}>
            <Text style={[styles.diaLetra, d.esHoy && styles.diaLetraHoy]}>{d.abreviatura}</Text>
            <View style={[styles.diaEstadoPunto, !d.abierto && styles.diaEstadoPuntoCerrado]} />
          </View>
        ))}
      </Pressable>

      <Pressable style={styles.botonExpandir} onPress={() => setExpandido((v) => !v)}>
        <Text style={styles.botonExpandirTexto}>
          {expandido ? "Ocultar horario completo" : "Ver horario completo"}
        </Text>
        <Ionicons
          name={expandido ? "chevron-up" : "chevron-down"}
          size={14}
          color={colores.primarioFuerte}
        />
      </Pressable>

      {expandido ? (
        <View style={styles.listaCompleta}>
          {listaSemanaCompleta(horarios).map((d) => (
            <View key={d.dia} style={[styles.filaCompleta, d.esHoy && styles.filaCompletaHoy]}>
              <Text style={[styles.nombreDia, d.esHoy && styles.nombreDiaHoy]}>{d.nombre}</Text>
              <Text style={[styles.valorDia, d.esHoy && styles.nombreDiaHoy]}>{d.texto}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    filaEstado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: espaciado.sm,
    },
    punto: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    puntoAbierto: {
      backgroundColor: colores.primario,
    },
    puntoCerrado: {
      backgroundColor: colores.textoTenue,
    },
    textoEstado: {
      ...tipografia.cuerpoDestacado,
      fontSize: 13,
    },
    textoAbierto: {
      color: colores.primarioFuerte,
    },
    textoCerrado: {
      color: colores.textoTenue,
    },
    detalleEstado: {
      ...tipografia.pie,
      color: colores.textoSuave,
    },
    filaSemana: {
      flexDirection: "row",
      gap: 5,
    },
    diaCelda: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      paddingVertical: espaciado.xs,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida,
    },
    diaCeldaHoy: {
      backgroundColor: colores.primarioSuave,
    },
    diaLetra: {
      ...tipografia.pie,
      fontSize: 10,
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: colores.textoTenue,
    },
    diaLetraHoy: {
      color: colores.primarioFuerte,
    },
    diaEstadoPunto: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colores.primario,
    },
    diaEstadoPuntoCerrado: {
      backgroundColor: colores.borde,
    },
    botonExpandir: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: espaciado.sm,
    },
    botonExpandirTexto: {
      ...tipografia.pie,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.primarioFuerte,
    },
    listaCompleta: {
      borderTopWidth: 1,
      borderTopColor: colores.borde,
      paddingTop: espaciado.xs,
    },
    filaCompleta: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      paddingHorizontal: espaciado.sm,
      borderRadius: radios.sm,
    },
    filaCompletaHoy: {
      backgroundColor: colores.primarioSuave,
    },
    nombreDia: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    nombreDiaHoy: {
      color: colores.primarioFuerte,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    valorDia: {
      ...tipografia.cuerpo,
      color: colores.texto,
    },
  });
}
