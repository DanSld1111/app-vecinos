import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { queryClient } from "../src/datos/queryClient";
import { useColores } from "../src/disenio";
import { useTema } from "../src/estado/useTema";
import { BannerSinConexion } from "../src/componentes/BannerSinConexion";
import { FlujoLogin } from "../src/componentes/FlujoLogin";
import { useSesion } from "../src/estado/useSesion";

export default function LayoutRaiz() {
  const colores = useColores();
  const modoOscuro = useTema((estado) => estado.modo === "oscuro");
  const [fuentesListas] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const autenticado = useSesion((estado) => estado.autenticado);

  if (!fuentesListas) {
    return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={modoOscuro ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <BannerSinConexion />
        {!autenticado ? (
          <FlujoLogin />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colores.fondo },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="negocio/[id]"
              options={{
                headerShown: true,
                title: "",
                headerBackTitle: "Atrás",
                headerStyle: { backgroundColor: colores.fondo },
                headerTintColor: colores.texto,
                headerShadowVisible: false,
                // Botón de volver propio — la pantalla anterior (un tab, headerShown:false)
                // no tiene título del que heredar el back button nativo, y en algunos builds
                // de iOS eso deja el header sin flecha visible. Ver servicios/_layout.tsx.
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
            <Stack.Screen name="buscar" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="notificaciones" />
            <Stack.Screen name="cuenta/index" options={{ presentation: "fullScreenModal" }} />
          </Stack>
        )}
      </View>
    </QueryClientProvider>
  );
}
