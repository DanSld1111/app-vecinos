import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDestacadas, useModulos } from "../../src/datos/hooks/useParaTi";
import { useDestacadasVistas } from "../../src/estado/useDestacadasVistas";
import { imagenDe, tiempoPublicacion } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { Aviso } from "../../src/componentes/Aviso";

const DURACION_MS = 6000;

/**
 * Destacadas a pantalla completa, como los estados (decisión 0091): barritas de avance arriba,
 * tocar a los lados para pasar, y "Ver publicación completa" para el video, el texto y los comentarios.
 */
export default function DestacadasParaTi() {
  const { inicio } = useLocalSearchParams<{ inicio?: string }>();
  const insets = useSafeAreaInsets();
  const modulos = useModulos();
  const { data: destacadas } = useDestacadas(modulos.paraTi);
  const marcar = useDestacadasVistas((e) => e.marcar);
  const acciones = useAccionesPublicacion();
  const [indice, setIndice] = useState(0);
  const [pausa, setPausa] = useState(false);
  const avance = useRef(new Animated.Value(0)).current;
  const lista = destacadas ?? [];
  const actual = lista[indice];

  // Arranca en la destacada que se tocó.
  useEffect(() => {
    if (!inicio || !lista.length) return;
    const i = lista.findIndex((d) => d.id === inicio);
    if (i >= 0) setIndice(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, lista.length]);

  const cerrar = () => (router.canGoBack() ? router.back() : router.replace("/para-ti"));
  const siguiente = () => (indice < lista.length - 1 ? setIndice(indice + 1) : cerrar());
  const anterior = () => setIndice(Math.max(0, indice - 1));

  useEffect(() => {
    if (!actual) return;
    marcar(actual.id);
    avance.setValue(0);
    if (pausa) return;
    const anim = Animated.timing(avance, { toValue: 1, duration: DURACION_MS, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => finished && siguiente());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.id, pausa]);

  if (modulos.cargado && !modulos.paraTi) return <Redirect href="/" />;
  if (!actual) return <View style={[styles.raiz, { backgroundColor: "#0f1210" }]} />;

  const imagen = imagenDe(actual);
  const ancho = avance.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={[styles.raiz, { backgroundColor: "#2b2420" }]}>
      {imagen ? <Image source={{ uri: imagen }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.22, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Mitad izquierda: anterior. Mitad derecha: siguiente. Mantener presionado: pausa. */}
      <View style={styles.zonas}>
        <Pressable style={{ flex: 1 }} onPress={anterior} onLongPress={() => setPausa(true)} onPressOut={() => setPausa(false)} accessibilityLabel="Destacada anterior" />
        <Pressable style={{ flex: 1 }} onPress={siguiente} onLongPress={() => setPausa(true)} onPressOut={() => setPausa(false)} accessibilityLabel="Siguiente destacada" />
      </View>

      <View style={[styles.arriba, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.barras}>
          {lista.map((d, i) => (
            <View key={d.id} style={styles.barra}>
              {i < indice ? <View style={[styles.relleno, { width: "100%" }]} /> : i === indice ? <Animated.View style={[styles.relleno, { width: ancho }]} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.autor}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>EL</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.autorNombre}>{actual.autor}</Text>
            <Text style={styles.autorMeta}>Destacada · {tiempoPublicacion(actual.publicadoEn)}</Text>
          </View>
          <Pressable onPress={cerrar} style={styles.cerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={26} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.abajo, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
        {actual.texto || actual.enlaceTitulo ? (
          <Text style={styles.texto} numberOfLines={5}>
            {actual.texto || actual.enlaceTitulo}
          </Text>
        ) : null}
        <View style={styles.fila}>
          <Pressable
            style={styles.verCompleta}
            onPress={() => router.replace({ pathname: "/para-ti/[id]", params: { id: actual.id } })}
            accessibilityRole="button"
          >
            {actual.tipo === "video" || actual.tipo === "youtube" ? <Ionicons name="play" size={16} color="#141a16" /> : null}
            <Text style={styles.verCompletaTexto}>{actual.tipo === "video" || actual.tipo === "youtube" ? "Ver video" : "Ver publicación completa"}</Text>
          </Pressable>
          <Pressable style={styles.redondo} onPress={() => acciones.corazon(actual)} accessibilityRole="button" accessibilityLabel="Dar corazón">
            <Ionicons name={acciones.tieneCorazon(actual.id) ? "heart" : "heart-outline"} size={22} color={acciones.tieneCorazon(actual.id) ? "#ff5a4e" : "#ffffff"} />
          </Pressable>
          <Pressable style={styles.redondo} onPress={() => acciones.compartir(actual)} accessibilityRole="button" accessibilityLabel="Compartir">
            <Ionicons name="share-outline" size={21} color="#ffffff" />
          </Pressable>
        </View>
      </View>
      <Aviso texto={acciones.aviso} onTerminar={() => acciones.setAviso(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  zonas: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row" },
  arriba: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 10, gap: 10 },
  barras: { flexDirection: "row", gap: 4 },
  barra: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  relleno: { height: 3, backgroundColor: "#ffffff" },
  autor: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#1a531a", alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11 },
  autorNombre: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14 },
  autorMeta: { color: "#e6e9e7", fontFamily: "SchibstedGrotesk_400Regular", fontSize: 12 },
  cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  abajo: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, gap: 14 },
  texto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 18, lineHeight: 24 },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  verCompleta: { flex: 1, height: 46, borderRadius: 23, backgroundColor: "#ffffff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  verCompletaTexto: { color: "#141a16", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14.5 },
  redondo: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)", backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" },
});
