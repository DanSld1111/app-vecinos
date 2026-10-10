import { createElement, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Web (la PWA): un video de la vista en vertical (decisión 0092). Suena solo el que está en
 * pantalla; arranca sin sonido porque los navegadores no dejan reproducir con sonido sin un toque.
 */
export function VideoVertical({
  url,
  portada,
  activo,
  pausado,
  silenciado,
  onProgreso,
}: {
  url: string;
  portada?: string | null;
  activo: boolean;
  pausado: boolean;
  silenciado: boolean;
  onProgreso: (actual: number, total: number) => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ajuste, setAjuste] = useState<"cover" | "contain">("cover");

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = silenciado;
  }, [silenciado]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (activo && !pausado) v.play().catch(() => {});
    else v.pause();
  }, [activo, pausado]);

  useEffect(() => {
    const v = ref.current;
    if (!activo && v) v.currentTime = 0;
  }, [activo]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement("video", {
        ref,
        // "#t=0.1": sin portada, el navegador muestra ese cuadro en vez de negro.
        src: `${url}#t=0.1`,
        poster: portada ?? undefined,
        muted: true,
        loop: true,
        playsInline: true,
        preload: activo ? "auto" : "metadata",
        onLoadedMetadata: (e: { currentTarget: HTMLVideoElement }) => {
          const v = e.currentTarget;
          // Un video horizontal se ve entero; uno vertical llena la pantalla.
          setAjuste(v.videoWidth > v.videoHeight ? "contain" : "cover");
        },
        onTimeUpdate: (e: { currentTarget: HTMLVideoElement }) => onProgreso(e.currentTarget.currentTime, e.currentTarget.duration || 0),
        style: { width: "100%", height: "100%", objectFit: ajuste, backgroundColor: "#000", display: "block" },
      })}
    </View>
  );
}

/** Web: YouTube en la vista en vertical. Solo el que está en pantalla carga el reproductor. */
export function YoutubeVertical({ videoId, activo, silenciado, miniatura }: { videoId: string; activo: boolean; silenciado: boolean; miniatura?: string | null }) {
  if (!activo) {
    return createElement("img", {
      src: miniatura ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      alt: "",
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" },
    });
  }
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "center", backgroundColor: "#000" }]}>
      {createElement("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${silenciado ? 1 : 0}&playsinline=1&rel=0&loop=1&playlist=${videoId}`,
        title: "Video de YouTube",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        style: { width: "100%", aspectRatio: "16 / 9", border: 0, display: "block" },
      })}
    </View>
  );
}
