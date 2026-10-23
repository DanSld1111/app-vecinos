import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { espaciado, tipografia } from "../../disenio";
import { useAvisosMascotas } from "../../datos/hooks/useRescate";
import { urlCompleta } from "../../utilidades/media";
import { ROJO_AVISO, hace } from "./comun";

/** Días que un aviso de mascota perdida se destaca en el Inicio. */
const DIAS_EN_INICIO = 7;

/**
 * Arriba del Inicio, las mascotas perdidas de la comunidad (decisión 0097): las 2 más recientes de
 * la última semana mientras el aviso siga abierto. Sin avisos no ocupa lugar.
 */
export function BannerMascotasPerdidas({ estilo }: { estilo?: StyleProp<ViewStyle> }) {
  const { data } = useAvisosMascotas();
  const recientes = (data ?? [])
    .filter((a) => a.tipo === "perdido" && Date.now() - new Date(a.creadoEn).getTime() < DIAS_EN_INICIO * 86_400_000)
    .slice(0, 2);
  if (!recientes.length) return null;
  return (
    <View style={[estilo, { gap: 8 }]}>
      {recientes.map((a) => (
        <Pressable key={a.id} style={styles.banner} onPress={() => router.push(`/rescate/aviso/${a.id}`)} accessibilityRole="button" accessibilityLabel={`Se busca ${a.nombre}`}>
          {a.fotos[0] ? <Image source={{ uri: urlCompleta(a.fotos[0]) }} style={styles.foto} /> : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.etiqueta}>SE BUSCA · {hace(a.creadoEn).toUpperCase()}</Text>
            <Text style={styles.titulo} numberOfLines={1}>
              {a.nombre || "Mascota perdida"}
            </Text>
            <Text style={styles.texto} numberOfLines={1}>
              {a.lugar}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: ROJO_AVISO, borderRadius: 18, padding: 10, paddingRight: espaciado.md },
  foto: { width: 64, height: 64, borderRadius: 12 },
  etiqueta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, letterSpacing: 0.4, color: "#ffffff" },
  titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: "#ffffff" },
  texto: { ...tipografia.pie, fontSize: 12.5, color: "rgba(255,255,255,0.92)" },
});
