import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Coordenada, Horarios } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estadoHoyTexto, listaSemanaCompleta } from "../utilidades/horarios";
import { EntradaAnimada } from "./EntradaAnimada";

type Panel = "horario" | "mapa" | null;

/** Fila de dos botones (horario/ubicación) que despliegan su contenido ahí mismo, sin bajar a
 * otra sección — así la ficha no se satura de entrada. Reemplaza los bloques separados de
 * ResumenHorario/MiniMapaNegocio más abajo en la ficha. */
export function PanelHorarioMapa({
  horarios,
  coordenada,
  direccion,
}: {
  horarios: Horarios;
  coordenada: Coordenada;
  direccion: string;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [panel, setPanel] = useState<Panel>(null);
  const estado = estadoHoyTexto(horarios);

  function alternar(cual: Panel) {
    setPanel((actual) => (actual === cual ? null : cual));
  }

  function abrirGoogleMaps() {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coordenada.lat},${coordenada.lng}`);
  }

  const textoBotonHorario =
    panel === "horario" ? "Horario" : estado.abierto ? `Abierto · ${estado.detalle}` : `Cerrado · ${estado.detalle}`;

  return (
    <View>
      <View style={styles.fila}>
        <Pressable
          style={[styles.boton, panel === "horario" ? styles.botonActivo : styles.botonInactivo]}
          onPress={() => alternar("horario")}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={panel === "horario" ? "#ffffff" : colores.primarioFuerte}
          />
          <Text style={[styles.botonTexto, { color: panel === "horario" ? "#ffffff" : colores.primarioFuerte }]} numberOfLines={1}>
            {textoBotonHorario}
          </Text>
          <Ionicons
            name={panel === "horario" ? "chevron-up" : "chevron-down"}
            size={12}
            color={panel === "horario" ? "#ffffff" : colores.primarioFuerte}
          />
        </Pressable>
        <Pressable
          style={[styles.boton, panel === "mapa" ? styles.botonActivo : styles.botonInactivoNeutro]}
          onPress={() => alternar("mapa")}
        >
          <Ionicons name="location-outline" size={13} color={panel === "mapa" ? "#ffffff" : colores.textoSuave} />
          <Text style={[styles.botonTexto, { color: panel === "mapa" ? "#ffffff" : colores.textoSuave }]}>Ubicación</Text>
          <Ionicons name={panel === "mapa" ? "chevron-up" : "chevron-down"} size={12} color={panel === "mapa" ? "#ffffff" : colores.textoSuave} />
        </Pressable>
      </View>

      {panel === "horario" ? (
        <EntradaAnimada key="horario" style={styles.panel}>
          {listaSemanaCompleta(horarios).map((d) => (
            <View key={d.dia} style={[styles.filaDia, d.esHoy && styles.filaDiaHoy]}>
              <Text style={[styles.nombreDia, d.esHoy && styles.textoHoy]}>{d.nombre}</Text>
              <Text style={[styles.valorDia, d.esHoy && styles.textoHoy]}>{d.texto}</Text>
            </View>
          ))}
        </EntradaAnimada>
      ) : null}

      {panel === "mapa" ? (
        <EntradaAnimada key="mapa" style={styles.panel}>
          <Pressable onPress={abrirGoogleMaps}>
            <View style={styles.mapaPreview}>
              <View style={styles.pin}>
                <Ionicons name="location" size={18} color="#ffffff" />
              </View>
            </View>
            <View style={styles.filaDireccion}>
              <Text style={styles.direccionTexto} numberOfLines={1}>
                {direccion}
              </Text>
              <Text style={styles.enlaceMapa}>Google Maps ↗</Text>
            </View>
          </Pressable>
        </EntradaAnimada>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    fila: {
      flexDirection: "row",
      gap: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    boton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radios.md,
      paddingVertical: 9,
      paddingHorizontal: espaciado.sm,
    },
    botonActivo: {
      backgroundColor: colores.primario,
    },
    botonInactivo: {
      backgroundColor: colores.primarioSuave,
    },
    botonInactivoNeutro: {
      backgroundColor: colores.superficieHundida,
    },
    botonTexto: {
      ...tipografia.pie,
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      flexShrink: 1,
    },
    panel: {
      backgroundColor: colores.superficieHundida,
      borderRadius: radios.md,
      padding: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    filaDia: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      paddingHorizontal: espaciado.xs,
      borderRadius: radios.sm,
    },
    filaDiaHoy: {
      backgroundColor: colores.primarioSuave,
    },
    nombreDia: {
      ...tipografia.cuerpo,
      fontSize: 12,
      color: colores.textoSuave,
    },
    valorDia: {
      ...tipografia.cuerpo,
      fontSize: 12,
      color: colores.texto,
    },
    textoHoy: {
      color: colores.primarioFuerte,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    mapaPreview: {
      height: 100,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida2,
      alignItems: "center",
      justifyContent: "center",
    },
    pin: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colores.acento,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colores.superficieHundida2,
    },
    filaDireccion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: espaciado.xs,
      gap: espaciado.sm,
    },
    direccionTexto: {
      ...tipografia.pie,
      color: colores.textoSuave,
      flex: 1,
    },
    enlaceMapa: {
      ...tipografia.pie,
      fontSize: 10.5,
      fontFamily: "PlusJakartaSans_700Bold",
      color: colores.primarioFuerte,
    },
  });
}
