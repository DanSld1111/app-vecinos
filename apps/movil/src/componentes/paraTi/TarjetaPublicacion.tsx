import { useRef, useState } from "react";
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Publicacion, idYoutube } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { urlCompleta } from "../../utilidades/media";
import { CuadroVideo, ReproductorVideo, ReproductorYoutube } from "./ReproductorVideo";

const NATIVO = Platform.OS !== "web";

export function tiempoPublicacion(iso: string | null): string {
  if (!iso) return "";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

/** La imagen que representa una publicación (primera foto, portada del video o miniatura de YouTube). */
export function imagenDe(p: Publicacion): string | null {
  if (p.tipo === "fotos") return urlCompleta(p.fotos[0]) ?? null;
  if (p.tipo === "video") return urlCompleta(p.portadaUrl) ?? null;
  if (p.tipo === "youtube") return p.enlaceMiniatura;
  return null;
}

export const formatearConteo = (n: number) => n.toLocaleString("en-US");

/** ELISUR con la insignia de cuenta oficial. */
export function NombreOficial({ nombre, color, tamano = 14 }: { nombre: string; color?: string; tamano?: number }) {
  const colores = useColores();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: tamano, color: color ?? colores.texto }}>{nombre}</Text>
      <Ionicons name="checkmark-circle" size={tamano + 1} color={color ?? colores.primario} accessibilityLabel="Cuenta oficial" />
    </View>
  );
}

export function CabeceraAutor({ p, colorTexto, onMas }: { p: Publicacion; colorTexto?: string; onMas?: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.cabecera}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>EL</Text>
      </View>
      <View style={{ flex: 1 }}>
        <NombreOficial nombre={p.autor} color={colorTexto} />
        <Text style={[styles.meta, colorTexto ? { color: colorTexto, opacity: 0.85 } : null]}>{tiempoPublicacion(p.publicadoEn)} · para todos los distritos</Text>
      </View>
      {onMas ? (
        <Pressable onPress={onMas} style={styles.mas} accessibilityRole="button" accessibilityLabel="Más opciones">
          <Ionicons name="ellipsis-horizontal" size={20} color={colorTexto ?? colores.texto} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Fotos deslizables (con "2/5" y puntos), video o YouTube. `reproducir` = el reproductor real; si
 * no, una vista previa. `onToque` recibe cada toque (la tarjeta lo usa para el doble toque).
 */
export function MediaPublicacion({
  p,
  reproducir,
  alto = 300,
  plano = false,
  onToque,
  onPagina,
}: {
  p: Publicacion;
  reproducir: boolean;
  alto?: number;
  plano?: boolean;
  onToque?: () => void;
  onPagina?: (pagina: number) => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [ancho, setAncho] = useState(0);
  const [pagina, setPagina] = useState(0);
  const forma = [styles.media, plano && styles.plano];

  if (p.tipo === "fotos" && p.fotos.length) {
    const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!ancho) return;
      const n = Math.round(e.nativeEvent.contentOffset.x / ancho);
      if (n !== pagina) {
        setPagina(n);
        onPagina?.(n);
      }
    };
    return (
      <View style={[forma, { height: alto }]} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={alDesplazar} scrollEventThrottle={32}>
          {p.fotos.map((f, i) => (
            <Pressable key={f} onPress={onToque} accessibilityLabel={`Foto ${i + 1} de ${p.fotos.length}`}>
              <Image source={{ uri: urlCompleta(f) }} style={{ width: ancho || 1, height: alto }} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
        {p.fotos.length > 1 ? (
          <Text style={styles.contadorFotos}>
            {pagina + 1}/{p.fotos.length}
          </Text>
        ) : null}
        {p.fotos.length > 1 && !onPagina ? (
          <View style={styles.puntosSobre}>
            {p.fotos.map((f, i) => (
              <View key={f} style={[styles.punto, styles.puntoClaro, i === pagina && styles.puntoClaroActivo]} />
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (p.tipo === "video" && p.videoUrl) {
    if (reproducir) return <ReproductorVideo url={urlCompleta(p.videoUrl)!} portada={urlCompleta(p.portadaUrl)} style={[forma, { height: alto }]} />;
    return (
      <Pressable onPress={onToque} style={[forma, styles.mediaOscura, { height: alto }]} accessibilityLabel="Ver video">
        {p.portadaUrl ? <Image source={{ uri: urlCompleta(p.portadaUrl) }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <CuadroVideo url={urlCompleta(p.videoUrl)!} />}
        <View style={styles.play}>
          <Ionicons name="play" size={26} color="#141a16" />
        </View>
      </Pressable>
    );
  }

  const videoId = p.tipo === "youtube" ? idYoutube(p.enlaceUrl) : null;
  if (videoId) {
    if (reproducir) return <ReproductorYoutube videoId={videoId} style={[forma, { height: Math.round(alto * 0.75) }]} />;
    return (
      <Pressable onPress={onToque} style={[plano ? null : styles.tarjetaYt]} accessibilityLabel={`Ver video: ${p.enlaceTitulo ?? "YouTube"}`}>
        <View style={[styles.media, styles.mediaOscura, { height: alto, borderRadius: 0 }]}>
          {p.enlaceMiniatura ? <Image source={{ uri: p.enlaceMiniatura }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <View style={styles.playYt}>
            <Ionicons name="play" size={20} color="#ffffff" />
          </View>
        </View>
        <View style={[styles.pieYt, plano && { paddingHorizontal: espaciado.lg }]}>
          <Text style={styles.dominio}>youtube.com</Text>
          {p.enlaceTitulo ? (
            <Text style={styles.tituloYt} numberOfLines={2}>
              {p.enlaceTitulo}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }
  return null;
}

/** Corazón, comentar y compartir (fila de íconos, como en las redes). */
export function AccionesPublicacion({
  p,
  tieneCorazon,
  onCorazon,
  onCompartir,
  onComentarios,
  centro,
}: {
  p: Publicacion;
  tieneCorazon: boolean;
  onCorazon: () => void;
  onCompartir: () => void;
  onComentarios?: () => void;
  centro?: React.ReactNode;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.acciones}>
      <Pressable onPress={onCorazon} style={styles.accion} accessibilityRole="button" accessibilityLabel={tieneCorazon ? "Quitar corazón" : "Dar corazón"}>
        <Ionicons name={tieneCorazon ? "heart" : "heart-outline"} size={27} color={tieneCorazon ? colores.error : colores.texto} />
      </Pressable>
      {p.permiteComentarios ? (
        <Pressable onPress={onComentarios} style={styles.accion} accessibilityRole="button" accessibilityLabel={`Comentarios: ${p.comentarios}`}>
          <Ionicons name="chatbubble-outline" size={24} color={colores.texto} />
        </Pressable>
      ) : null}
      <Pressable onPress={onCompartir} style={styles.accion} accessibilityRole="button" accessibilityLabel="Compartir">
        <Ionicons name="paper-plane-outline" size={24} color={colores.texto} />
      </Pressable>
      <View style={styles.centroAcciones}>{centro}</View>
      {!p.permiteComentarios ? (
        <View style={styles.cerrados}>
          <Ionicons name="lock-closed-outline" size={13} color={colores.textoTenue} />
          <Text style={styles.cerradosTexto}>Comentarios cerrados</Text>
        </View>
      ) : null}
    </View>
  );
}

/** "1,248 corazones · 312 veces compartido". */
export function Conteos({ p }: { p: Publicacion }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const partes = [
    p.corazones ? `${formatearConteo(p.corazones)} ${p.corazones === 1 ? "corazón" : "corazones"}` : null,
    p.compartidos ? `${formatearConteo(p.compartidos)} ${p.compartidos === 1 ? "vez compartido" : "veces compartido"}` : null,
  ].filter(Boolean);
  if (!partes.length) return null;
  return <Text style={styles.conteos}>{partes.join(" · ")}</Text>;
}

/**
 * Una publicación en el muro (decisión 0092): a todo el ancho, doble toque para dar corazón, el
 * texto en dos líneas con "más" y acceso directo a los comentarios.
 */
export function TarjetaPublicacion({
  p,
  ancho,
  tieneCorazon,
  onCorazon,
  onCompartir,
  onAbrir,
  onComentarios,
  onMas,
}: {
  p: Publicacion;
  ancho: number;
  tieneCorazon: boolean;
  onCorazon: () => void;
  onCompartir: () => void;
  /** Tocar el contenido (una vez). */
  onAbrir: () => void;
  onComentarios: () => void;
  onMas: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [expandido, setExpandido] = useState(false);
  const [pagina, setPagina] = useState(0);
  const ultimoToque = useRef(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latido = useRef(new Animated.Value(0)).current;

  const alto = p.tipo === "youtube" ? Math.round((ancho * 9) / 16) : Math.min(Math.round(ancho * 1.25), 620);

  // Un toque abre; dos toques seguidos dan corazón (y nunca lo quitan), como en las redes.
  function alTocar() {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300) {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = null;
      ultimoToque.current = 0;
      if (!tieneCorazon) onCorazon();
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
      onAbrir();
    }, 300);
  }

  const largo = p.texto.length > 90 || p.texto.includes("\n");
  const puntos =
    p.tipo === "fotos" && p.fotos.length > 1 ? (
      <View style={styles.puntos}>
        {p.fotos.map((f, i) => (
          <View key={f} style={[styles.punto, i === pagina && styles.puntoActivo]} />
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.tarjeta}>
      <View style={styles.relleno}>
        <CabeceraAutor p={p} onMas={onMas} />
      </View>
      {p.tipo === "texto" ? (
        <Pressable onPress={alTocar} style={styles.relleno} accessibilityRole="button" accessibilityLabel="Abrir publicación">
          <Text style={styles.textoGrande}>{p.texto}</Text>
        </Pressable>
      ) : (
        <View>
          <MediaPublicacion p={p} reproducir={false} alto={alto} plano onToque={alTocar} onPagina={setPagina} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.latido,
              { top: alto / 2 - 48, opacity: latido, transform: [{ scale: latido.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
            ]}
          >
            <Ionicons name="heart" size={96} color="#ffffff" />
          </Animated.View>
        </View>
      )}
      <View style={styles.rellenoAcciones}>
        <AccionesPublicacion p={p} tieneCorazon={tieneCorazon} onCorazon={onCorazon} onCompartir={onCompartir} onComentarios={onComentarios} centro={puntos} />
      </View>
      <View style={[styles.relleno, { gap: 4 }]}>
        <Conteos p={p} />
        {p.texto && p.tipo !== "texto" ? (
          <Pressable
            onPress={() => setExpandido(!expandido)}
            disabled={!largo}
            accessibilityRole={largo ? "button" : undefined}
            accessibilityLabel={largo ? (expandido ? "Ver menos" : "Ver texto completo") : undefined}
          >
            <Text style={styles.pie} numberOfLines={expandido ? undefined : 2}>
              <Text style={styles.pieAutor}>{p.autor} </Text>
              {p.texto}
            </Text>
            {largo && !expandido ? <Text style={styles.verMas}>más</Text> : null}
          </Pressable>
        ) : null}
        {p.permiteComentarios ? (
          <Pressable onPress={onComentarios} accessibilityRole="button" hitSlop={6}>
            <Text style={styles.verComentarios}>
              {p.comentarios === 0 ? "Sé el primero en comentar" : p.comentarios === 1 ? "Ver 1 comentario" : `Ver los ${formatearConteo(p.comentarios)} comentarios`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, paddingTop: 10, paddingBottom: espaciado.lg, gap: 8 },
    relleno: { paddingHorizontal: espaciado.lg },
    rellenoAcciones: { paddingHorizontal: 6 },
    cabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center" },
    avatarTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12.5 },
    meta: { ...tipografia.pie, color: colores.textoSuave },
    mas: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
    textoGrande: { ...tipografia.cuerpo, fontSize: 18, lineHeight: 26, fontFamily: "SchibstedGrotesk_500Medium", color: colores.texto },
    media: { width: "100%", borderRadius: radios.md, overflow: "hidden", backgroundColor: colores.superficieHundida },
    plano: { borderRadius: 0 },
    mediaOscura: { backgroundColor: "#2b2420", alignItems: "center", justifyContent: "center" },
    play: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
    playYt: { width: 58, height: 40, borderRadius: 11, backgroundColor: "#d93025", alignItems: "center", justifyContent: "center" },
    tarjetaYt: { borderRadius: radios.md, borderWidth: 1, borderColor: colores.borde, overflow: "hidden" },
    pieYt: { padding: espaciado.sm + 2, gap: 2, backgroundColor: colores.superficie },
    dominio: { ...tipografia.pie, color: colores.textoTenue },
    tituloYt: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    contadorFotos: {
      position: "absolute",
      top: 12,
      right: 12,
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 3,
      fontFamily: "SchibstedGrotesk_700Bold",
      fontSize: 12,
      overflow: "hidden",
    },
    puntos: { flexDirection: "row", justifyContent: "center", gap: 5 },
    puntosSobre: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
    punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.bordeFuerte },
    puntoActivo: { backgroundColor: colores.primario },
    puntoClaro: { backgroundColor: "rgba(255,255,255,0.55)" },
    puntoClaroActivo: { backgroundColor: "#ffffff" },
    latido: { position: "absolute", left: 0, right: 0, alignItems: "center" },
    acciones: { flexDirection: "row", alignItems: "center" },
    accion: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    centroAcciones: { flex: 1, alignItems: "center" },
    cerrados: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 10 },
    cerradosTexto: { ...tipografia.pie, color: colores.textoTenue },
    conteos: { ...tipografia.cuerpoDestacado, fontSize: 14, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    pie: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 20.5, color: colores.texto },
    pieAutor: { fontFamily: "SchibstedGrotesk_800ExtraBold" },
    verMas: { ...tipografia.cuerpo, fontSize: 14, color: colores.textoSuave },
    verComentarios: { ...tipografia.cuerpo, fontSize: 14, color: colores.textoSuave, paddingVertical: 2 },
  });
}
