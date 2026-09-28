import { useEffect, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Anuncio } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { useAnuncios } from "../../datos/hooks/useAnuncios";
import { urlCompleta } from "../../utilidades/media";
import { useMovimientoReducido } from "../../utilidades/useMovimientoReducido";

const DURACION_MS = 4000;
const ALTO = 172;

/**
 * La oferta o anuncio del momento, a lo ancho y con la foto de fondo (antes un carrusel bajito
 * con puntos). Pasa sola cada 4 s con una barra de progreso tipo "historia", cambia con un
 * fundido, y se pausa mientras se mantiene el dedo encima. Con "reducir movimiento" no pasa
 * sola: se cambia tocando los segmentos de arriba.
 */
export function OfertaDestacada() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const reducido = useMovimientoReducido();
  const { data } = useAnuncios();
  const anuncios = (data ?? []).filter((a) => a.ubicaciones.includes("carrusel_inicio"));
  const [indice, setIndice] = useState(0);
  const progreso = useRef(new Animated.Value(0)).current;
  const fundido = useRef(new Animated.Value(1)).current;
  const animacionRef = useRef<Animated.CompositeAnimation | null>(null);
  const restanteRef = useRef(DURACION_MS);

  const total = anuncios.length;
  // Arrastre con el dedo: el contenido sigue un poco al dedo y, pasado el umbral, cambia de anuncio.
  const arrastre = useRef(new Animated.Value(0)).current;
  const estadoRef = useRef({ indice, total });
  estadoRef.current = { indice, total };
  const accionesRef = useRef({ pausar: () => {}, reanudar: () => {}, avanzar: (_a: number) => {} });

  const gestos = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => estadoRef.current.total > 1 && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => accionesRef.current.pausar(),
      onPanResponderMove: (_e, g) => arrastre.setValue(g.dx * 0.35),
      onPanResponderRelease: (_e, g) => {
        const { indice: i, total: n } = estadoRef.current;
        Animated.spring(arrastre, { toValue: 0, friction: 7, useNativeDriver: Platform.OS !== "web" }).start();
        if (g.dx < -40 || g.vx < -0.5) accionesRef.current.avanzar((i + 1) % n);
        else if (g.dx > 40 || g.vx > 0.5) accionesRef.current.avanzar((i - 1 + n) % n);
        else accionesRef.current.reanudar();
      },
      onPanResponderTerminate: () => {
        Animated.spring(arrastre, { toValue: 0, useNativeDriver: Platform.OS !== "web" }).start();
        accionesRef.current.reanudar();
      },
    }),
  ).current;

  function avanzar(a: number) {
    Animated.timing(fundido, { toValue: 0.2, duration: reducido ? 0 : 150, useNativeDriver: true }).start(() => {
      setIndice(a);
      Animated.timing(fundido, { toValue: 1, duration: reducido ? 120 : 300, useNativeDriver: true }).start();
    });
  }

  function correr(desde: number, duracion: number) {
    progreso.setValue(desde);
    animacionRef.current = Animated.timing(progreso, {
      toValue: 1,
      duration: duracion,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animacionRef.current.start(({ finished }) => {
      if (finished && total > 1) avanzar((indice + 1) % total);
    });
  }

  useEffect(() => {
    if (total < 2 || reducido) return;
    restanteRef.current = DURACION_MS;
    correr(0, DURACION_MS);
    return () => animacionRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, total, reducido]);

  function pausar() {
    if (total < 2 || reducido) return;
    animacionRef.current?.stop();
    progreso.stopAnimation((v) => {
      restanteRef.current = (1 - v) * DURACION_MS;
    });
  }

  function reanudar() {
    if (total < 2 || reducido) return;
    progreso.stopAnimation((v) => correr(v, Math.max(200, restanteRef.current)));
  }

  accionesRef.current = { pausar, reanudar, avanzar };

  if (total === 0) return null;
  const anuncio: Anuncio = anuncios[Math.min(indice, total - 1)];
  const uri = urlCompleta(anuncio.imagenUrl);

  return (
    <Pressable
      onPress={() => anuncio.negocioId && router.push(`/negocio/${anuncio.negocioId}`)}
      onPressIn={pausar}
      onPressOut={reanudar}
      accessibilityRole={anuncio.negocioId ? "button" : "text"}
      accessibilityLabel={`${anuncio.nombre}. ${anuncio.detalle}`}
      style={styles.contenedor}
    >
      <Animated.View {...gestos.panHandlers} style={[StyleSheet.absoluteFill, { opacity: fundido, transform: [{ translateX: arrastre }] }]}>
        {uri ? (
          <>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.74)"]}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colores.primarioFuerte }]} />
        )}
        <View style={styles.texto}>
          <Text style={styles.ceja}>{anuncio.negocioId ? "Oferta de hoy" : "Para tu comunidad"}</Text>
          <Text style={styles.titulo} numberOfLines={2}>
            {anuncio.nombre}
          </Text>
          <Text style={styles.detalle} numberOfLines={1}>
            {anuncio.detalle}
          </Text>
        </View>
      </Animated.View>

      {total > 1 ? (
        <View style={styles.segmentos}>
          {anuncios.map((a, i) => (
            <Pressable
              key={a.id}
              style={styles.segmento}
              onPress={() => i !== indice && avanzar(i)}
              hitSlop={8}
              accessibilityLabel={`Anuncio ${i + 1} de ${total}`}
            >
              {i < indice ? (
                <View style={[styles.relleno, { width: "100%" }]} />
              ) : i === indice ? (
                <Animated.View
                  style={[
                    styles.relleno,
                    {
                      width: reducido
                        ? "100%"
                        : progreso.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      height: ALTO,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colores.superficieHundida2,
    },
    texto: { position: "absolute", left: espaciado.md, right: espaciado.md, bottom: espaciado.md - 1 },
    ceja: { ...tipografia.etiqueta, color: "rgba(255,255,255,0.92)", textTransform: "uppercase" },
    titulo: {
      fontFamily: "SchibstedGrotesk_800ExtraBold",
      fontSize: 21,
      lineHeight: 23,
      letterSpacing: -0.5,
      color: "#ffffff",
      marginVertical: 3,
    },
    detalle: { ...tipografia.pie, fontSize: 11.5, color: "rgba(255,255,255,0.92)" },
    segmentos: {
      position: "absolute",
      top: 10,
      left: espaciado.md,
      right: espaciado.md,
      flexDirection: "row",
      gap: 4,
    },
    segmento: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
    relleno: { height: "100%", backgroundColor: "#ffffff" },
  });
}
