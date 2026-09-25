import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Aviso } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../disenio";
import { estiloCategoria } from "./TarjetaAviso";

const ANCHO_PANTALLA = Dimensions.get("window").width;
// Un poco angosta que el ancho completo, con separación a la derecha: así el siguiente aviso
// se asoma con espacio de por medio en vez de pegado al borde del actual.
const ESPACIO_ENTRE_TARJETAS = espaciado.sm;
const ANCHO_TARJETA = ANCHO_PANTALLA - espaciado.lg * 2 - ESPACIO_ENTRE_TARJETAS;
const INTERVALO_TOTAL = ANCHO_TARJETA + ESPACIO_ENTRE_TARJETAS;
const INTERVALO_MS = 4500;

// Degradado verde por tarjeta (más claro que el rojo de referencia, a tono con la marca) —
// se alterna por índice, no por categoría: todas las tarjetas comparten la misma familia de
// color, el ícono es lo que distingue de qué categoría es el aviso. Ver docs/decisiones/0033.
const DEGRADADOS: [string, string][] = [
  ["#4fb583", "#2f8f60"],
  ["#5fbd7f", "#3ba05e"],
  ["#3d8f6a", "#1f6e4c"],
];

export function CarruselAvisos({ avisos, onPress }: { avisos: Aviso[]; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const iconos = estiloCategoria(colores, false);
  const [indice, setIndice] = useState(0);
  const listaRef = useRef<FlashListRef<Aviso>>(null);

  useEffect(() => {
    if (avisos.length < 2) return;
    const temporizador = setInterval(() => {
      setIndice((actual) => {
        const siguiente = (actual + 1) % avisos.length;
        listaRef.current?.scrollToIndex({ index: siguiente, animated: true });
        return siguiente;
      });
    }, INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [avisos.length]);

  function alDesplazar(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / INTERVALO_TOTAL);
    if (nuevoIndice !== indice) setIndice(nuevoIndice);
  }

  if (avisos.length === 0) return null;

  return (
    <View>
      <View style={{ height: 120 }}>
        <FlashList
          ref={listaRef}
          horizontal
          snapToInterval={INTERVALO_TOTAL}
          decelerationRate="fast"
          data={avisos}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          onScroll={alDesplazar}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.tarjeta, { width: ANCHO_TARJETA, marginRight: ESPACIO_ENTRE_TARJETAS }]}
              onPress={onPress}
            >
              <LinearGradient
                colors={DEGRADADOS[index % DEGRADADOS.length]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.insignia}>
                <Ionicons name={iconos[item.categoria].icono} size={24} color="#ffffff" />
              </View>
              <Text style={styles.etiqueta}>Aviso de la comunidad</Text>
              <Text style={styles.titulo} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text style={styles.cuerpo} numberOfLines={2}>
                {item.cuerpo}
              </Text>
            </Pressable>
          )}
        />
      </View>
      <View style={styles.puntos}>
        {avisos.map((aviso, i) => (
          <View key={aviso.id} style={[styles.punto, i === indice && styles.puntoActivo]} />
        ))}
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      height: 112,
      borderRadius: radios.lg,
      padding: espaciado.md,
      justifyContent: "center",
      gap: 3,
      overflow: "hidden",
    },
    insignia: {
      position: "absolute",
      right: espaciado.md,
      bottom: espaciado.md,
      width: 48,
      height: 48,
      borderRadius: radios.md,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
    },
    etiqueta: {
      ...tipografia.etiqueta,
      color: "rgba(255,255,255,0.8)",
      maxWidth: "68%",
    },
    titulo: {
      ...tipografia.displaySeccion,
      fontSize: 17,
      color: "#ffffff",
      maxWidth: "68%",
    },
    cuerpo: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.9)",
      maxWidth: "68%",
    },
    puntos: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 5,
      marginTop: espaciado.xs,
    },
    punto: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colores.borde,
    },
    puntoActivo: {
      backgroundColor: colores.primario,
      width: 16,
    },
  });
}
