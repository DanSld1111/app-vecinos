import { Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { espaciado, useColores } from "../../src/disenio";

export default function LayoutNotificaciones() {
  const colores = useColores();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        headerBackTitle: "Atrás",
        contentStyle: { backgroundColor: colores.fondo },
        // Botón de volver propio para "index": la pantalla anterior (un tab, headerShown:false)
        // no tiene título del que heredar el back button nativo, y en algunos builds de iOS eso
        // deja el header sin flecha visible. Ver servicios/_layout.tsx para el mismo caso.
        headerLeft: () => (
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 12 }}>
            <Ionicons name="chevron-back" size={26} color={colores.texto} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Notificaciones",
          headerRight: () => (
            <Pressable
              hitSlop={espaciado.sm}
              onPress={() => router.push("/notificaciones/ajustes")}
              style={{ paddingLeft: espaciado.sm }}
            >
              <Ionicons name="settings-outline" size={22} color={colores.texto} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="ajustes" options={{ title: "" }} />
    </Stack>
  );
}
