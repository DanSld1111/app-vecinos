import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Pressable } from "react-native";
import { useColores } from "../../../src/disenio";

export default function LayoutServicios() {
  const colores = useColores();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
        animation: "slide_from_right",
        // Botón de volver propio, en vez del nativo por defecto: en algunos builds de iOS el
        // header nativo queda sin flecha visible cuando la pantalla anterior (el índice de
        // Servicios) tiene headerShown:false — no tiene título del que heredar el back button.
        // Mismo patrón que ya usan buscar.tsx y cuenta/index.tsx en el resto de la app.
        headerLeft: () => (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/servicios"))}
            hitSlop={10}
            style={{ paddingRight: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={colores.texto} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="negocios" options={{ title: "Guía de negocios" }} />
      <Stack.Screen name="productos" options={{ title: "Guía de productos" }} />
      <Stack.Screen name="restaurantes" options={{ title: "Guía de restaurantes" }} />
      <Stack.Screen name="supermarket" options={{ title: "Supermarket" }} />
    </Stack>
  );
}
