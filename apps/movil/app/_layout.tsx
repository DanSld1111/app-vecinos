import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
  SchibstedGrotesk_800ExtraBold,
} from "@expo-google-fonts/schibsted-grotesk";
import { queryClient } from "../src/datos/queryClient";
import { useColores } from "../src/disenio";
import { useTema } from "../src/estado/useTema";
import { BannerSinConexion } from "../src/componentes/BannerSinConexion";
import { FlujoLogin } from "../src/componentes/FlujoLogin";
import { FundidoTema } from "../src/componentes/transicion/FundidoTema";
import { Onboarding } from "../src/componentes/Onboarding";
import { useSesion } from "../src/estado/useSesion";
import { useOnboarding } from "../src/estado/useOnboarding";

export default function LayoutRaiz() {
  const colores = useColores();
  const modoOscuro = useTema((estado) => estado.modo === "oscuro");
  const [fuentesListas] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
  });
  const autenticado = useSesion((estado) => estado.autenticado);
  const onboardingVisto = useOnboarding((estado) => estado.visto);

  if (!fuentesListas) {
    return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;
  }

  return (
    // SafeAreaProvider: sin esto, useSafeAreaInsets() (usado en (tabs)/_layout.tsx para que la
    // barra de tabs no quede tapada por la barrita de inicio del iPhone) siempre devuelve 0 —
    // ver decisión 0058.
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={modoOscuro ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: colores.fondo }}>
          <BannerSinConexion />
          {!autenticado ? (
            <FlujoLogin />
          ) : !onboardingVisto ? (
            <Onboarding />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colores.fondo },
                // Sin esto, cada pantalla nueva aparece de golpe en vez de deslizarse — se nota
                // sobre todo en la versión web (el nativo ya trae una transición por defecto,
                // pero no tan consistente entre iOS/Android como fijarla explícita acá).
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="(tabs)" />
              {/* Sin header nativo: trae su propio encabezado (flecha + buscador + favorito + ⋮)
                  dentro del componente — mismo criterio que servicios/_layout.tsx. */}
              {/* Si se abrió tocando una foto (ver abrirNegocio), la pantalla entra con un fundido
                  mientras esa foto crece hasta la portada; si no, el deslizamiento de siempre. */}
              <Stack.Screen
                name="negocio/[id]/index"
                options={({ route }) => ({
                  headerShown: false,
                  animation:
                    (route.params as { transicion?: string } | undefined)?.transicion === "foto" ? "fade" : "slide_from_right",
                })}
              />
              <Stack.Screen
                name="negocio/[id]/informacion"
                options={{
                  headerShown: true,
                  title: "",
                  headerStyle: { backgroundColor: colores.fondo },
                  headerTintColor: colores.texto,
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <Pressable
                      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                      hitSlop={10}
                      style={{ paddingRight: 12 }}
                    >
                      <Ionicons name="chevron-back" size={26} color={colores.texto} />
                    </Pressable>
                  ),
                }}
              />
              <Stack.Screen name="favoritos" options={{ presentation: "fullScreenModal" }} />
              {/* Desde el buscador de Inicio la pantalla entra con un fundido mientras el buscador
                  "sube" a su lugar (ver BuscadorEnVuelo); desde otros lados, como modal. */}
              <Stack.Screen
                name="buscar"
                options={({ route }) =>
                  (route.params as { transicion?: string } | undefined)?.transicion === "buscador"
                    ? { presentation: "fullScreenModal", animation: "fade" }
                    : { presentation: "fullScreenModal" }
                }
              />
              <Stack.Screen name="notificaciones" />
              <Stack.Screen name="cuenta/index" options={{ presentation: "fullScreenModal" }} />
            </Stack>
          )}
          <FundidoTema />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
