import { Image, StyleSheet, View } from "react-native";
import { ReproductorVideo, ReproductorYoutube } from "./ReproductorVideo";

/**
 * Celular (app nativa): la vista en vertical usa el reproductor del sistema dentro de una vista
 * web. La app se usa sobre todo como PWA, donde va VideoVertical.web.tsx.
 */
export function VideoVertical({
  url,
  portada,
  activo,
}: {
  url: string;
  portada?: string | null;
  activo: boolean;
  pausado: boolean;
  silenciado: boolean;
  onProgreso: (actual: number, total: number) => void;
}) {
  if (!activo) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>{portada ? <Image source={{ uri: portada }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}</View>;
  }
  return <ReproductorVideo url={url} portada={portada} autoplay style={StyleSheet.absoluteFill} />;
}

export function YoutubeVertical({ videoId, activo, miniatura }: { videoId: string; activo: boolean; silenciado: boolean; miniatura?: string | null }) {
  if (!activo) {
    return <Image source={{ uri: miniatura ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }} style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} resizeMode="contain" />;
  }
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "center", backgroundColor: "#000" }]}>
      <ReproductorYoutube videoId={videoId} style={{ width: "100%", aspectRatio: 16 / 9 }} />
    </View>
  );
}
