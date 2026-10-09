import { StyleProp, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Celular (app nativa): el video dentro de una vista web con el reproductor del sistema. Evita
 * sumar una librería nativa de video solo para esto (la app se usa sobre todo como PWA, donde va
 * ReproductorVideo.web.tsx).
 */
export function ReproductorVideo({
  url,
  portada,
  style,
  autoplay = false,
}: {
  url: string;
  portada?: string | null;
  style?: StyleProp<ViewStyle>;
  autoplay?: boolean;
}) {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}video{width:100%;height:100%;object-fit:contain}</style></head><body><video src="${escapar(url)}" ${portada ? `poster="${escapar(portada)}"` : ""} controls playsinline preload="metadata" ${autoplay ? "autoplay muted" : ""}></video></body></html>`;
  return (
    <View style={[{ backgroundColor: "#000", overflow: "hidden" }, style]}>
      <WebView source={{ html }} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={!autoplay} style={{ backgroundColor: "#000" }} />
    </View>
  );
}

/** Celular: el reproductor de YouTube embebido. */
export function ReproductorYoutube({ videoId, style }: { videoId: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: "#000", overflow: "hidden" }, style]}>
      <WebView
        source={{ uri: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1` }}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        style={{ backgroundColor: "#000" }}
      />
    </View>
  );
}
