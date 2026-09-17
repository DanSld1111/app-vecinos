import { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColores } from "../../src/disenio";
import { useTema } from "../../src/estado/useTema";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useComunidadesActivas } from "../../src/datos/hooks/useComunidades";

type ColorTab = "verde" | "coral";

// Tintes más vivos que primarioSuave/acentoSuave, solo para el fondo del ícono
// inactivo de la barra de tabs — el resto de la app sigue usando los tokens de marca.
// Par claro/oscuro propio (no forma parte de PaletaColores, es un detalle de esta barra).
const VERDE_SUAVE_VIVO = { claro: "#bdeacd", oscuro: "#1d3527" };
const CORAL_SUAVE_VIVO = { claro: "#f9c9b6", oscuro: "#3d2418" };

function IconoTab({
  focused,
  etiqueta,
  color,
  activo,
  inactivo,
}: {
  focused: boolean;
  etiqueta: string;
  color: ColorTab;
  activo: keyof typeof Ionicons.glyphMap;
  inactivo: keyof typeof Ionicons.glyphMap;
}) {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = estilosTab;
  const esCoral = color === "coral";
  const suaveVivo = esCoral ? CORAL_SUAVE_VIVO : VERDE_SUAVE_VIVO;
  const fondo = focused ? (esCoral ? colores.acento : colores.primario) : modo === "oscuro" ? suaveVivo.oscuro : suaveVivo.claro;
  const tinte = focused ? "#ffffff" : esCoral ? colores.acentoFuerte : colores.primarioFuerte;
  const colorTexto = focused ? colores.texto : colores.textoTenue;

  const animacion = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animacion, {
      toValue: focused ? 1 : 0,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [focused, animacion]);

  const escala = animacion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const salto = animacion.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <View style={styles.tabContenedor}>
      <Animated.View
        style={[
          styles.iconoContenedor,
          { backgroundColor: fondo, transform: [{ scale: escala }, { translateY: salto }] },
        ]}
      >
        <Ionicons name={focused ? activo : inactivo} size={18} color={tinte} />
      </Animated.View>
      <Text style={[styles.etiqueta, { color: colorTexto, fontWeight: focused ? "700" : "500" }]}>
        {etiqueta}
      </Text>
    </View>
  );
}

export default function LayoutTabs() {
  const colores = useColores();
  const { comunidad, establecerComunidad } = useComunidadActiva();
  const { data: comunidades } = useComunidadesActivas();

  useEffect(() => {
    if (!comunidad && comunidades && comunidades.length > 0) {
      establecerComunidad(comunidades[0]);
    }
  }, [comunidad, comunidades, establecerComunidad]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // Sin "height"/"paddingBottom" fijos a propósito: @react-navigation/bottom-tabs ya
        // calcula esos dos solo, sumando insets.bottom automáticamente (ver
        // BottomTabBar.js::getTabBarHeight) — pero solo si el estilo que le pasamos NO los
        // pisa. Fijarlos acá (como estaba antes) siempre ganaba por encima de ese cálculo, con
        // o sin SafeAreaProvider en el árbol: por eso la barra terminaba antes del borde físico
        // del iPhone y esa franja se veía del color de lo que hubiera detrás (ver decisión
        // 0059). "paddingTop" sí es seguro fijarlo: el notch/Dynamic Island no le pega a la
        // barra de abajo.
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <IconoTab
              focused={focused}
              etiqueta="Inicio"
              color="verde"
              activo="home"
              inactivo="home-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: "Servicios",
          tabBarIcon: ({ focused }) => (
            <IconoTab
              focused={focused}
              etiqueta="Servicios"
              color="verde"
              activo="grid"
              inactivo="grid-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="comunidad"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ focused }) => (
            <IconoTab
              focused={focused}
              etiqueta="Comunidad"
              color="coral"
              activo="megaphone"
              inactivo="megaphone-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <IconoTab
              focused={focused}
              etiqueta="Perfil"
              color="verde"
              activo="person-circle"
              inactivo="person-circle-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Sin colores de la paleta (el fondo/tinte de cada ícono se calcula aparte, arriba) — estático.
const estilosTab = StyleSheet.create({
  tabContenedor: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconoContenedor: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: {
    fontSize: 10.5,
    lineHeight: 13,
  },
});
