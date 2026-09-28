import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PaletaColores, useColores } from "../disenio";
import { useTema } from "../estado/useTema";
import { useBarraPestanas } from "../estado/useBarraPestanas";
import { useComunidadActiva } from "../estado/comunidadActiva";
import { useAvisos } from "../datos/hooks/useAvisos";
import { useMovimientoReducido } from "../utilidades/useMovimientoReducido";

const ICONOS: Record<string, { activo: keyof typeof Ionicons.glyphMap; inactivo: keyof typeof Ionicons.glyphMap }> = {
  index: { activo: "home", inactivo: "home-outline" },
  servicios: { activo: "grid", inactivo: "grid-outline" },
  comunidad: { activo: "megaphone", inactivo: "megaphone-outline" },
  perfil: { activo: "person", inactivo: "person-outline" },
};

const ANCHO_RAYA = 34;
const NATIVO = Platform.OS !== "web";
// En Android el desenfoque de expo-blur todavía es experimental y se ve sucio: ahí la barra es
// casi opaca. En iOS y web se ve el contenido pasar por detrás, desenfocado.
const USA_DESENFOQUE = Platform.OS !== "android";

function Pestana({
  titulo,
  icono,
  enfocada,
  conPunto,
  onPress,
  reducido,
}: {
  titulo: string;
  icono: { activo: keyof typeof Ionicons.glyphMap; inactivo: keyof typeof Ionicons.glyphMap };
  enfocada: boolean;
  conPunto: boolean;
  onPress: () => void;
  reducido: boolean;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const escala = useRef(new Animated.Value(1)).current;
  const primeraVez = useRef(true);

  // Al quedar elegida, el ícono pasa a relleno con un rebote leve (se hunde y vuelve un poco más grande).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    if (!enfocada || reducido) return;
    escala.setValue(0.82);
    Animated.spring(escala, { toValue: 1, friction: 4, tension: 220, useNativeDriver: NATIVO }).start();
  }, [enfocada, reducido, escala]);

  const color = enfocada ? colores.texto : colores.textoTenue;

  return (
    <Pressable
      onPress={onPress}
      style={styles.pestana}
      accessibilityRole="tab"
      accessibilityState={{ selected: enfocada }}
      accessibilityLabel={conPunto ? `${titulo}, hay una alerta nueva` : titulo}
    >
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons name={enfocada ? icono.activo : icono.inactivo} size={22} color={color} />
        {conPunto ? <View style={styles.punto} /> : null}
      </Animated.View>
      <Text style={[styles.etiqueta, { color }, enfocada && styles.etiquetaActiva]}>{titulo}</Text>
    </Pressable>
  );
}

/**
 * Barra inferior propia. Flota sobre el contenido (las listas dejan su alto de espacio abajo, ver
 * useAlturaBarra) para poder esconderse al bajar y mostrarse al subir. Rayita que se desliza a la
 * pestaña elegida, ícono que rebota, vibración corta al cambiar y punto en Comunidad cuando hay
 * una alerta de seguridad que el vecino todavía no vio.
 */
export function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const oscuro = useTema((e) => e.modo === "oscuro");
  const insets = useSafeAreaInsets();
  const reducido = useMovimientoReducido();
  const [ancho, setAncho] = useState(0);
  const posicion = useRef(new Animated.Value(state.index)).current;
  const ocultar = useRef(new Animated.Value(0)).current;
  const oculta = useBarraPestanas((e) => e.oculta);
  const altura = useBarraPestanas((e) => e.altura);
  const setAltura = useBarraPestanas((e) => e.setAltura);
  const comunidadVistaHasta = useBarraPestanas((e) => e.comunidadVistaHasta);
  const { comunidad } = useComunidadActiva();
  const { data: avisos } = useAvisos(comunidad?.id);

  const hayAlertaNueva = (avisos ?? []).some(
    (a) => a.categoria === "seguridad" && (!comunidadVistaHasta || a.publicadoEn > comunidadVistaHasta),
  );

  useEffect(() => {
    Animated.timing(posicion, {
      toValue: state.index,
      duration: reducido ? 0 : 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: NATIVO,
    }).start();
  }, [state.index, reducido, posicion]);

  useEffect(() => {
    Animated.timing(ocultar, {
      toValue: oculta ? 1 : 0,
      duration: reducido ? 0 : oculta ? 220 : 260,
      easing: oculta ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: NATIVO,
    }).start();
  }, [oculta, reducido, ocultar]);

  const anchoPestana = ancho / Math.max(1, state.routes.length);
  const traslado = posicion.interpolate({
    inputRange: state.routes.map((_r, i) => i),
    outputRange: state.routes.map((_r, i) => i * anchoPestana + anchoPestana / 2 - ANCHO_RAYA / 2),
  });

  const fondo = USA_DESENFOQUE ? (
    <BlurView intensity={60} tint={oscuro ? "dark" : "light"} style={StyleSheet.absoluteFill} />
  ) : null;

  return (
    <Animated.View
      style={[
        styles.barra,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: USA_DESENFOQUE
            ? oscuro
              ? "rgba(18,19,22,0.72)"
              : "rgba(255,255,255,0.78)"
            : colores.fondo,
          transform: [{ translateY: ocultar.interpolate({ inputRange: [0, 1], outputRange: [0, altura + 2] }) }],
        },
      ]}
      onLayout={(e) => {
        setAncho(e.nativeEvent.layout.width);
        setAltura(e.nativeEvent.layout.height);
      }}
      accessibilityRole="tablist"
    >
      {fondo}
      {ancho > 0 && state.routes.length > 1 ? (
        <Animated.View style={[styles.raya, { transform: [{ translateX: traslado }] }]} />
      ) : null}
      {state.routes.map((ruta, i) => {
        const { options } = descriptors[ruta.key];
        const enfocada = state.index === i;
        const titulo = (options.title ?? ruta.name) as string;

        function alTocar() {
          const evento = navigation.emit({ type: "tabPress", target: ruta.key, canPreventDefault: true });
          if (!enfocada && !evento.defaultPrevented) {
            if (Platform.OS !== "web") void Haptics.selectionAsync().catch(() => {});
            navigation.navigate(ruta.name, ruta.params);
          }
        }

        return (
          <Pestana
            key={ruta.key}
            titulo={titulo}
            icono={ICONOS[ruta.name] ?? { activo: "ellipse", inactivo: "ellipse-outline" }}
            enfocada={enfocada}
            conPunto={ruta.name === "comunidad" && hayAlertaNueva && !enfocada}
            onPress={alTocar}
            reducido={reducido}
          />
        );
      })}
    </Animated.View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    barra: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colores.bordeFuerte,
      paddingTop: 8,
      overflow: "hidden",
    },
    raya: {
      position: "absolute",
      top: 0,
      left: 0,
      width: ANCHO_RAYA,
      height: 2.5,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: colores.texto,
    },
    pestana: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      paddingVertical: 2,
    },
    punto: {
      position: "absolute",
      top: -1,
      right: -3,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colores.error,
      borderWidth: 1.5,
      borderColor: colores.fondo,
    },
    etiqueta: {
      fontFamily: "SchibstedGrotesk_600SemiBold",
      fontSize: 11,
      lineHeight: 13,
    },
    etiquetaActiva: {
      fontFamily: "SchibstedGrotesk_700Bold",
    },
  });
}
