import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Platform, Pressable, StyleSheet, Text, View, ViewToken, useWindowDimensions } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Publicacion, idYoutube } from "@app-vecinos/tipos";
import { useModulos, usePublicacion, usePublicacionesParaTi } from "../../src/datos/hooks/useParaTi";
import { useSesion } from "../../src/estado/useSesion";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { HojaComentarios } from "../../src/componentes/paraTi/Comentarios";
import { NombreOficial, formatearConteo, tiempoPublicacion } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { VideoVertical, YoutubeVertical } from "../../src/componentes/paraTi/VideoVertical";
import { urlCompleta } from "../../src/utilidades/media";
import { Aviso } from "../../src/componentes/Aviso";

const NATIVO = Platform.OS !== "web";

/** "2.0 mil" en la columna de botones, como en las redes. */
const corto = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")} mil` : formatearConteo(n));

const minutos = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

interface PropsItem {
  p: Publicacion;
  alto: number;
  activo: boolean;
  silenciado: boolean;
  tieneCorazon: boolean;
  insetAbajo: number;
  onCorazon: () => void;
  onDobleToque: () => void;
  onComentarios: () => void;
  onCompartir: () => void;
}

/** Un video a pantalla completa con la columna de botones a la derecha (decisión 0092). */
const ItemVideo = memo(function ItemVideo({ p, alto, activo, silenciado, tieneCorazon, insetAbajo, onCorazon, onDobleToque, onComentarios, onCompartir }: PropsItem) {
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [expandido, setExpandido] = useState(false);
  const ultimoToque = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latido = useRef(new Animated.Value(0)).current;
  const videoId = p.tipo === "youtube" ? idYoutube(p.enlaceUrl) : null;

  useEffect(() => {
    if (!activo) setPausado(false);
  }, [activo]);

  // Un toque pausa o sigue; dos toques dan corazón.
  function alTocar() {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300) {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = null;
      ultimoToque.current = 0;
      onDobleToque();
      latido.setValue(0);
      Animated.sequence([
        Animated.spring(latido, { toValue: 1, friction: 4, tension: 160, useNativeDriver: NATIVO }),
        Animated.timing(latido, { toValue: 0, duration: 260, delay: 380, useNativeDriver: NATIVO }),
      ]).start();
      return;
    }
    ultimoToque.current = ahora;
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      if (p.tipo === "video") setPausado((x) => !x);
    }, 300);
  }

  const fraccion = progreso.total ? progreso.actual / progreso.total : 0;

  return (
    <View style={[styles.item, { height: alto }]}>
      {p.tipo === "video" && p.videoUrl ? (
        <VideoVertical
          url={urlCompleta(p.videoUrl)!}
          portada={urlCompleta(p.portadaUrl)}
          activo={activo}
          pausado={pausado}
          silenciado={silenciado}
          onProgreso={(actual, total) => setProgreso({ actual, total })}
        />
      ) : videoId ? (
        <YoutubeVertical videoId={videoId} activo={activo} silenciado={silenciado} miniatura={p.enlaceMiniatura} />
      ) : null}

      {/* En YouTube los toques van al reproductor; en el video subido, a pausar y al doble toque. */}
      {p.tipo === "video" ? <Pressable style={StyleSheet.absoluteFill} onPress={alTocar} accessibilityLabel={pausado ? "Reproducir" : "Pausar"} /> : null}

      <LinearGradient colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0)"]} style={styles.veloArriba} pointerEvents="none" />
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]} style={styles.veloAbajo} pointerEvents="none" />

      {pausado ? (
        <View style={styles.centro} pointerEvents="none">
          <View style={styles.botonPlay}>
            <Ionicons name="play" size={34} color="#ffffff" />
          </View>
        </View>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[styles.centro, { opacity: latido, transform: [{ scale: latido.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}
      >
        <Ionicons name="heart" size={110} color="#ffffff" />
      </Animated.View>

      <View style={[styles.columna, { bottom: insetAbajo + 120 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>EL</Text>
        </View>
        <Pressable onPress={onCorazon} style={styles.botonColumna} accessibilityRole="button" accessibilityLabel={`${tieneCorazon ? "Quitar corazón" : "Dar corazón"}, ${p.corazones}`}>
          <Ionicons name="heart" size={34} color={tieneCorazon ? "#ff4d4d" : "#ffffff"} />
          <Text style={styles.textoColumna}>{corto(p.corazones)}</Text>
        </Pressable>
        {p.permiteComentarios ? (
          <Pressable onPress={onComentarios} style={styles.botonColumna} accessibilityRole="button" accessibilityLabel={`Comentarios, ${p.comentarios}`}>
            <Ionicons name="chatbubble-ellipses" size={31} color="#ffffff" />
            <Text style={styles.textoColumna}>{corto(p.comentarios)}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onCompartir} style={styles.botonColumna} accessibilityRole="button" accessibilityLabel={`Compartir, ${p.compartidos}`}>
          <Ionicons name="arrow-redo" size={31} color="#ffffff" />
          <Text style={styles.textoColumna}>{p.compartidos ? corto(p.compartidos) : "Compartir"}</Text>
        </Pressable>
      </View>

      <View style={[styles.pie, { bottom: insetAbajo + 34 }]}>
        <View style={styles.filaAutor}>
          <NombreOficial nombre={p.autor} color="#ffffff" tamano={15} />
          <Text style={styles.tiempo}>· {tiempoPublicacion(p.publicadoEn)}</Text>
        </View>
        {p.texto || p.enlaceTitulo ? (
          <Pressable onPress={() => setExpandido(!expandido)} accessibilityRole="button" accessibilityLabel={expandido ? "Ver menos" : "Ver texto completo"}>
            <Text style={styles.texto} numberOfLines={expandido ? 8 : 2}>
              {p.texto || p.enlaceTitulo}
            </Text>
          </Pressable>
        ) : null}
        {!p.permiteComentarios ? (
          <View style={styles.chip}>
            <Ionicons name="lock-closed" size={12} color="#ffffff" />
            <Text style={styles.chipTexto}>Comentarios cerrados</Text>
          </View>
        ) : null}
      </View>

      {p.tipo === "video" && progreso.total ? (
        <View style={[styles.progreso, { bottom: insetAbajo + 12 }]} pointerEvents="none">
          <Text style={styles.tiempoVideo}>{minutos(progreso.actual)}</Text>
          <View style={styles.pista}>
            <View style={[styles.relleno, { width: `${Math.min(100, fraccion * 100)}%` }]} />
          </View>
          <Text style={styles.tiempoVideo}>{minutos(progreso.total)}</Text>
        </View>
      ) : null}
    </View>
  );
});

/** Videos de Para ti en vertical: se pasa al siguiente deslizando hacia arriba (decisión 0092). */
export default function VideosParaTi() {
  const { inicio } = useLocalSearchParams<{ inicio?: string }>();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const modulos = useModulos();
  const feed = usePublicacionesParaTi(modulos.paraTi, { videos: true });
  const { data: inicial, isLoading: cargandoInicial } = usePublicacion(inicio);
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  const acciones = useAccionesPublicacion();
  const [activoId, setActivoId] = useState<string | null>(inicio ?? null);
  const [silenciado, setSilenciado] = useState(true);
  const [comentariosDe, setComentariosDe] = useState<Publicacion | null>(null);
  const [pista, setPista] = useState(true);

  const items = feed.data?.pages.flatMap((pg) => pg.items) ?? [];
  const lista = inicial && (inicial.tipo === "video" || inicial.tipo === "youtube") && !items.some((x) => x.id === inicial.id) ? [inicial, ...items] : items;
  const indiceInicial = Math.max(0, lista.findIndex((x) => x.id === inicio));

  useEffect(() => {
    const t = setTimeout(() => setPista(false), 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!activoId && lista[0]) setActivoId(lista[0].id);
  }, [activoId, lista]);

  const alCambiarVisibles = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const primero = viewableItems.find((v) => v.isViewable);
    if (primero?.item) setActivoId((primero.item as Publicacion).id);
  }).current;

  const obtenerLayout = useCallback((_: unknown, i: number) => ({ length: height, offset: height * i, index: i }), [height]);

  if (modulos.cargado && !modulos.paraTi) return <Redirect href="/" />;

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/para-ti"));
  const cargando = feed.isLoading || (Boolean(inicio) && cargandoInicial);

  return (
    <View style={styles.raiz}>
      {cargando ? (
        <ActivityIndicator color="#ffffff" style={{ flex: 1 }} />
      ) : lista.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="videocam-outline" size={40} color="#ffffff" />
          <Text style={styles.vacioTexto}>Todavía no hay videos en Para ti.</Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => p.id}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={indiceInicial}
          getItemLayout={obtenerLayout}
          onViewableItemsChanged={alCambiarVisibles}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
          onEndReachedThreshold={1.5}
          renderItem={({ item }) => (
            <ItemVideo
              p={item}
              alto={height}
              activo={item.id === activoId && !comentariosDe}
              silenciado={silenciado}
              tieneCorazon={acciones.tieneCorazon(item.id)}
              insetAbajo={insets.bottom}
              onCorazon={() => acciones.corazon(item)}
              onDobleToque={() => !acciones.tieneCorazon(item.id) && acciones.corazon(item)}
              onComentarios={() => setComentariosDe(item)}
              onCompartir={() => acciones.compartir(item)}
            />
          )}
          style={{ width }}
        />
      )}

      <View style={[styles.barra, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable onPress={volver} style={styles.botonBarra} accessibilityRole="button" accessibilityLabel="Volver al muro">
          <Ionicons name="chevron-back" size={26} color="#ffffff" />
        </Pressable>
        <View style={styles.pestanas}>
          <Pressable onPress={volver} accessibilityRole="tab" accessibilityState={{ selected: false }} style={styles.pestana}>
            <Text style={styles.pestanaTexto}>Muro</Text>
          </Pressable>
          <View accessibilityRole="tab" accessibilityState={{ selected: true }} style={[styles.pestana, styles.pestanaActiva]}>
            <Text style={[styles.pestanaTexto, { color: "#ffffff" }]}>Videos</Text>
          </View>
        </View>
        <Pressable onPress={() => setSilenciado(!silenciado)} style={styles.botonBarra} accessibilityRole="button" accessibilityLabel={silenciado ? "Activar sonido" : "Quitar sonido"}>
          <Ionicons name={silenciado ? "volume-mute" : "volume-high"} size={24} color="#ffffff" />
        </Pressable>
      </View>

      {pista && lista.length > 1 && !cargando ? (
        <View style={styles.deslizar} pointerEvents="none">
          <Ionicons name="chevron-up" size={22} color="#ffffff" />
          <Text style={styles.pistaTexto}>Desliza hacia arriba para el siguiente</Text>
        </View>
      ) : null}

      <HojaComentarios
        p={comentariosDe ? lista.find((x) => x.id === comentariosDe.id) ?? comentariosDe : null}
        visible={Boolean(comentariosDe)}
        onCerrar={() => setComentariosDe(null)}
        onIniciarSesion={cerrarSesion}
      />
      <Aviso texto={acciones.aviso} onTerminar={() => acciones.setAviso(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: "#000000" },
  item: { width: "100%", backgroundColor: "#000000", overflow: "hidden" },
  veloArriba: { position: "absolute", left: 0, right: 0, top: 0, height: 140 },
  veloAbajo: { position: "absolute", left: 0, right: 0, bottom: 0, height: 360 },
  centro: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  botonPlay: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingLeft: 4 },
  columna: { position: "absolute", right: 8, alignItems: "center", gap: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#1a531a", borderWidth: 2, borderColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13 },
  botonColumna: { minWidth: 52, alignItems: "center", gap: 2 },
  textoColumna: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 12.5, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 },
  pie: { position: "absolute", left: 16, right: 84, gap: 6 },
  filaAutor: { flexDirection: "row", alignItems: "center", gap: 6 },
  tiempo: { color: "rgba(255,255,255,0.85)", fontFamily: "SchibstedGrotesk_500Medium", fontSize: 13.5 },
  texto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_400Regular", fontSize: 14.5, lineHeight: 20 },
  chip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  chipTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 12 },
  progreso: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  tiempoVideo: { color: "rgba(255,255,255,0.85)", fontFamily: "SchibstedGrotesk_500Medium", fontSize: 11.5 },
  pista: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  relleno: { height: 3, backgroundColor: "#ffffff" },
  barra: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 },
  botonBarra: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pestanas: { flexDirection: "row", gap: 18 },
  pestana: { paddingVertical: 8, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  pestanaActiva: { borderBottomColor: "#ffffff" },
  pestanaTexto: { color: "rgba(255,255,255,0.75)", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 16 },
  vacio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  vacioTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 16, textAlign: "center" },
  deslizar: { position: "absolute", left: 0, right: 0, top: "42%", alignItems: "center", gap: 4 },
  pistaTexto: { color: "rgba(255,255,255,0.85)", fontFamily: "SchibstedGrotesk_500Medium", fontSize: 13 },
});
