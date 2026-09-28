import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PaletaColores, useColores } from "../disenio";
import { useMovimientoReducido } from "../utilidades/useMovimientoReducido";

const ICONOS: Record<string, { activo: keyof typeof Ionicons.glyphMap; inactivo: keyof typeof Ionicons.glyphMap }> = {
  index: { activo: "home", inactivo: "home-outline" },
  servicios: { activo: "grid", inactivo: "grid-outline" },
  comunidad: { activo: "megaphone", inactivo: "megaphone-outline" },
  perfil: { activo: "person", inactivo: "person-outline" },
};

const ANCHO_RAYA = 34;

/**
 * Barra inferior propia: ícono + nombre, la pestaña activa en el color del texto y una rayita
 * arriba que se desliza hasta ella (280 ms). Reemplaza a los círculos de color por pestaña.
 */
export function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const reducido = useMovimientoReducido();
  const [ancho, setAncho] = useState(0);
  const posicion = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.timing(posicion, {
      toValue: state.index,
      duration: reducido ? 0 : 280,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [state.index, reducido, posicion]);

  const anchoPestana = ancho / Math.max(1, state.routes.length);
  const traslado = posicion.interpolate({
    inputRange: state.routes.map((_r, i) => i),
    outputRange: state.routes.map((_r, i) => i * anchoPestana + anchoPestana / 2 - ANCHO_RAYA / 2),
  });

  return (
    <View
      style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 6) }]}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {ancho > 0 && state.routes.length > 1 ? (
        <Animated.View style={[styles.raya, { transform: [{ translateX: traslado }] }]} />
      ) : null}
      {state.routes.map((ruta, i) => {
        const { options } = descriptors[ruta.key];
        const enfocada = state.index === i;
        const titulo = (options.title ?? ruta.name) as string;
        const icono = ICONOS[ruta.name] ?? { activo: "ellipse", inactivo: "ellipse-outline" };

        function alTocar() {
          const evento = navigation.emit({ type: "tabPress", target: ruta.key, canPreventDefault: true });
          if (!enfocada && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
        }

        return (
          <Pressable
            key={ruta.key}
            onPress={alTocar}
            style={styles.pestana}
            accessibilityRole="tab"
            accessibilityState={{ selected: enfocada }}
            accessibilityLabel={titulo}
          >
            <Ionicons
              name={enfocada ? icono.activo : icono.inactivo}
              size={21}
              color={enfocada ? colores.texto : colores.textoTenue}
            />
            <Text style={[styles.etiqueta, { color: enfocada ? colores.texto : colores.textoTenue }, enfocada && styles.etiquetaActiva]}>
              {titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    barra: {
      flexDirection: "row",
      backgroundColor: colores.fondo,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colores.bordeFuerte,
      paddingTop: 8,
    },
    raya: {
      position: "absolute",
      top: -1,
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
