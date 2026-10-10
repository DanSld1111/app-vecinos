import { useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Publicacion, idYoutube } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { urlCompleta } from "../../utilidades/media";
import { CuadroVideo, ReproductorVideo, ReproductorYoutube } from "./ReproductorVideo";

const TIPO: Record<Publicacion["tipo"], string> = { fotos: "Fotos", video: "Video", youtube: "YouTube", texto: "Noticia" };

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

export function CabeceraAutor({ p, colorTexto }: { p: Publicacion; colorTexto?: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.cabecera}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>EL</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.autor, colorTexto ? { color: colorTexto } : null]}>{p.autor}</Text>
        <Text style={[styles.meta, colorTexto ? { color: colorTexto, opacity: 0.85 } : null]}>
          {tiempoPublicacion(p.publicadoEn)} · {p.tipo === "fotos" && p.fotos.length > 1 ? `${p.fotos.length} fotos` : TIPO[p.tipo]}
        </Text>
      </View>
    </View>
  );
}

/** Fotos deslizables (con "2/5"), video o YouTube. `reproducir` = el reproductor real; si no, una vista previa que se toca. */
export function MediaPublicacion({ p, reproducir, alto = 300, onAbrir }: { p: Publicacion; reproducir: boolean; alto?: number; onAbrir?: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [ancho, setAncho] = useState(0);
  const [pagina, setPagina] = useState(0);

  if (p.tipo === "fotos" && p.fotos.length) {
    const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (ancho) setPagina(Math.round(e.nativeEvent.contentOffset.x / ancho));
    };
    return (
      <View style={[styles.media, { height: alto }]} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={alDesplazar} scrollEventThrottle={32}>
          {p.fotos.map((f, i) => (
            <Pressable key={f} onPress={onAbrir} accessibilityLabel={`Foto ${i + 1} de ${p.fotos.length}`}>
              <Image source={{ uri: urlCompleta(f) }} style={{ width: ancho || 1, height: alto }} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
        {p.fotos.length > 1 ? (
          <>
            <Text style={styles.contadorFotos}>
              {pagina + 1}/{p.fotos.length}
            </Text>
            <View style={styles.puntos}>
              {p.fotos.map((f, i) => (
                <View key={f} style={[styles.punto, i === pagina && styles.puntoActivo]} />
              ))}
            </View>
          </>
        ) : null}
      </View>
    );
  }

  if (p.tipo === "video" && p.videoUrl) {
    if (reproducir) return <ReproductorVideo url={urlCompleta(p.videoUrl)!} portada={urlCompleta(p.portadaUrl)} style={[styles.media, { height: alto }]} />;
    return (
      <Pressable onPress={onAbrir} style={[styles.media, styles.mediaOscura, { height: alto }]} accessibilityLabel="Reproducir video">
        {p.portadaUrl ? <Image source={{ uri: urlCompleta(p.portadaUrl) }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <CuadroVideo url={urlCompleta(p.videoUrl)!} />}
        <View style={styles.play}>
          <Ionicons name="play" size={26} color="#141a16" />
        </View>
      </Pressable>
    );
  }

  const videoId = p.tipo === "youtube" ? idYoutube(p.enlaceUrl) : null;
  if (videoId) {
    if (reproducir) return <ReproductorYoutube videoId={videoId} style={[styles.media, { height: Math.round(alto * 0.75) }]} />;
    return (
      <Pressable onPress={onAbrir} style={styles.tarjetaYt} accessibilityLabel={`Ver video: ${p.enlaceTitulo ?? "YouTube"}`}>
        <View style={[styles.media, styles.mediaOscura, { height: Math.round(alto * 0.62), borderRadius: 0 }]}>
          {p.enlaceMiniatura ? <Image source={{ uri: p.enlaceMiniatura }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <View style={styles.playYt}>
            <Ionicons name="play" size={20} color="#ffffff" />
          </View>
        </View>
        <View style={styles.pieYt}>
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

export function AccionesPublicacion({
  p,
  tieneCorazon,
  onCorazon,
  onCompartir,
  onComentarios,
}: {
  p: Publicacion;
  tieneCorazon: boolean;
  onCorazon: () => void;
  onCompartir: () => void;
  onComentarios?: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.acciones}>
      <Pressable onPress={onCorazon} style={styles.accion} accessibilityRole="button" accessibilityLabel={tieneCorazon ? "Quitar corazón" : "Dar corazón"} hitSlop={8}>
        <Ionicons name={tieneCorazon ? "heart" : "heart-outline"} size={22} color={tieneCorazon ? colores.error : colores.textoSuave} />
        <Text style={[styles.accionTexto, tieneCorazon && { color: colores.error, fontFamily: "SchibstedGrotesk_700Bold" }]}>{formatearConteo(p.corazones)}</Text>
      </Pressable>
      {p.permiteComentarios ? (
        <Pressable onPress={onComentarios} style={styles.accion} accessibilityRole="button" accessibilityLabel={`Comentarios: ${p.comentarios}`} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={20} color={colores.textoSuave} />
          <Text style={styles.accionTexto}>{formatearConteo(p.comentarios)}</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onCompartir} style={styles.accion} accessibilityRole="button" accessibilityLabel="Compartir" hitSlop={8}>
        <Ionicons name="share-outline" size={21} color={colores.textoSuave} />
        <Text style={styles.accionTexto}>{p.compartidos ? formatearConteo(p.compartidos) : "Compartir"}</Text>
      </Pressable>
      {!p.permiteComentarios ? (
        <View style={styles.cerrados}>
          <Ionicons name="lock-closed-outline" size={14} color={colores.textoTenue} />
          <Text style={styles.cerradosTexto}>Comentarios cerrados</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Una publicación en el muro de Para ti. Tocarla abre la publicación completa. */
export function TarjetaPublicacion({
  p,
  tieneCorazon,
  onCorazon,
  onCompartir,
  onAbrir,
}: {
  p: Publicacion;
  tieneCorazon: boolean;
  onCorazon: () => void;
  onCompartir: () => void;
  onAbrir: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.tarjeta}>
      <Pressable onPress={onAbrir} accessibilityRole="button" accessibilityLabel="Abrir publicación">
        <CabeceraAutor p={p} />
        {p.texto ? (
          <Text style={styles.texto} numberOfLines={4}>
            {p.texto}
          </Text>
        ) : null}
      </Pressable>
      <MediaPublicacion p={p} reproducir={false} alto={260} onAbrir={onAbrir} />
      <AccionesPublicacion p={p} tieneCorazon={tieneCorazon} onCorazon={onCorazon} onCompartir={onCompartir} onComentarios={onAbrir} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      borderTopWidth: 6,
      borderTopColor: colores.superficieHundida,
      paddingHorizontal: espaciado.lg,
      paddingTop: espaciado.md,
      paddingBottom: espaciado.sm,
      gap: espaciado.sm + 2,
    },
    cabecera: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center" },
    avatarTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12.5 },
    autor: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    meta: { ...tipografia.pie, color: colores.textoSuave },
    texto: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 20.5, color: colores.texto, marginTop: espaciado.sm },
    media: { width: "100%", borderRadius: radios.md, overflow: "hidden", backgroundColor: colores.superficieHundida },
    mediaOscura: { backgroundColor: "#2b2420", alignItems: "center", justifyContent: "center" },
    play: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
    playYt: { width: 58, height: 40, borderRadius: 11, backgroundColor: "#d93025", alignItems: "center", justifyContent: "center" },
    tarjetaYt: { borderRadius: radios.md, borderWidth: 1, borderColor: colores.borde, overflow: "hidden" },
    pieYt: { padding: espaciado.sm + 2, gap: 2, backgroundColor: colores.superficie },
    dominio: { ...tipografia.pie, color: colores.textoTenue },
    tituloYt: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    contadorFotos: {
      position: "absolute",
      top: 10,
      right: 10,
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontFamily: "SchibstedGrotesk_700Bold",
      fontSize: 12,
      overflow: "hidden",
    },
    puntos: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
    punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)" },
    puntoActivo: { backgroundColor: "#ffffff" },
    acciones: { flexDirection: "row", alignItems: "center", gap: espaciado.lg, paddingVertical: 4 },
    accion: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
    accionTexto: { ...tipografia.cuerpo, fontSize: 13.5, color: colores.textoSuave },
    cerrados: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
    cerradosTexto: { ...tipografia.pie, color: colores.textoTenue },
  });
}
