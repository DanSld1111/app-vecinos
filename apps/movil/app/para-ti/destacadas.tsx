import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDestacadas, useModulos } from "../../src/datos/hooks/useParaTi";
import { useDestacadasVistas } from "../../src/estado/useDestacadasVistas";
import { NombreOficial, imagenDe, tiempoPublicacion } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { CuadroVideo } from "../../src/componentes/paraTi/ReproductorVideo";
import { urlCompleta } from "../../src/utilidades/media";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { Aviso } from "../../src/componentes/Aviso";

const DURACION_MS = 6000;

/** El título en etiquetas blancas, como en las historias: hasta 3 renglones de unas 4 palabras. */
function etiquetas(texto: string): string[] {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    if ((actual + " " + p).trim().length > 18 && actual) {
      lineas.push(actual);
      actual = p;
    } else actual = (actual + " " + p).trim();
    if (lineas.length === 3) break;
  }
  if (actual && lineas.length < 3) lineas.push(actual);
  const usadas = lineas.join(" ").split(/\s+/).length;
  if (usadas < palabras.length && lineas.length) lineas[lineas.length - 1] += "…";
  return lineas;
}

/**
 * Destacadas a pantalla completa, como las historias (decisiones 0091 y 0092): barritas de avance,
 * tocar a los lados para pasar, pausa, el título en etiquetas y "Ver publicación completa".
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
  const cuadro = !imagen && actual.tipo === "video" && actual.videoUrl ? urlCompleta(actual.videoUrl) : null;
  const esVideo = actual.tipo === "video" || actual.tipo === "youtube";
  const titulo = etiquetas(actual.texto || actual.enlaceTitulo || "");
  const verCompleta = () =>
    esVideo
      ? router.replace({ pathname: "/para-ti/videos", params: { inicio: actual.id } })
      : router.replace({ pathname: "/para-ti/[id]", params: { id: actual.id } });
  const ancho = avance.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={[styles.raiz, { backgroundColor: "#2b2420" }]}>
      {imagen ? <Image source={{ uri: imagen }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : cuadro ? <CuadroVideo url={cuadro} /> : null}
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
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <NombreOficial nombre={actual.autor} color="#ffffff" />
            <Text style={styles.autorMeta}>· {tiempoPublicacion(actual.publicadoEn)}</Text>
          </View>
          <Pressable onPress={() => setPausa(!pausa)} style={styles.cerrar} accessibilityRole="button" accessibilityLabel={pausa ? "Seguir" : "Pausar"}>
            <Ionicons name={pausa ? "play" : "pause"} size={22} color="#ffffff" />
          </Pressable>
          <Pressable onPress={cerrar} style={styles.cerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={26} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.abajo, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
        {titulo.length ? (
          <View style={styles.etiquetas} accessibilityRole="header" accessibilityLabel={actual.texto || actual.enlaceTitulo || ""}>
            {titulo.map((l, i) => (
              <Text key={i} style={styles.etiqueta}>
                {l}
              </Text>
            ))}
            {esVideo ? (
              <View style={styles.chipVideo}>
                <Ionicons name="play" size={13} color="#141a16" />
                <Text style={styles.chipVideoTexto}>Video</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.fila}>
          <Pressable style={styles.verCompleta} onPress={verCompleta} accessibilityRole="button">
            <Text style={styles.verCompletaTexto}>{esVideo ? "Ver el video" : "Ver publicación completa"}</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.redondo} onPress={() => acciones.corazon(actual)} accessibilityRole="button" accessibilityLabel={acciones.tieneCorazon(actual.id) ? "Quitar corazón" : "Dar corazón"}>
            <Ionicons name={acciones.tieneCorazon(actual.id) ? "heart" : "heart-outline"} size={28} color={acciones.tieneCorazon(actual.id) ? "#ff5a4e" : "#ffffff"} />
          </Pressable>
          <Pressable style={styles.redondo} onPress={() => acciones.compartir(actual)} accessibilityRole="button" accessibilityLabel="Compartir">
            <Ionicons name="paper-plane-outline" size={26} color="#ffffff" />
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
  autorMeta: { color: "#e6e9e7", fontFamily: "SchibstedGrotesk_500Medium", fontSize: 13 },
  cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  abajo: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, gap: 26 },
  etiquetas: { alignItems: "flex-start", gap: 6, paddingHorizontal: 8 },
  etiqueta: {
    backgroundColor: "#ffffff",
    color: "#141a16",
    fontFamily: "SchibstedGrotesk_800ExtraBold",
    fontSize: 26,
    lineHeight: 31,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  chipVideo: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, backgroundColor: "#ef7148", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  chipVideoTexto: { color: "#141a16", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14 },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  verCompleta: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  verCompletaTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14.5 },
  redondo: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
});
