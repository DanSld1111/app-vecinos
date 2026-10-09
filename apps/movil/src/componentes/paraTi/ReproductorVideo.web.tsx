import { createElement } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

/** Web (la PWA): el reproductor del navegador, con sus controles. */
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
  return (
    <View style={[{ backgroundColor: "#000", overflow: "hidden" }, style]}>
      {createElement("video", {
        src: url,
        poster: portada ?? undefined,
        controls: true,
        playsInline: true,
        preload: "metadata",
        autoPlay: autoplay,
        muted: autoplay,
        style: { width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000", display: "block" },
      })}
    </View>
  );
}

/** Web: el reproductor de YouTube embebido (dominio sin cookies de seguimiento). */
export function ReproductorYoutube({ videoId, style }: { videoId: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: "#000", overflow: "hidden" }, style]}>
      {createElement("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`,
        title: "Video de YouTube",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        style: { width: "100%", height: "100%", border: 0, display: "block" },
      })}
    </View>
  );
}
