import { Image, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Clasificado } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { useClasificados } from "../../datos/hooks/useClasificados";
import { urlCompleta } from "../../utilidades/media";
import { CirculoCategoria } from "../vitrina/CirculoCategoria";
import { MiniClasificado, ROJO_SE_BUSCA, hace } from "./comun";

/** Días que una mascota perdida se destaca arriba del Inicio. */
const DIAS_SE_BUSCA = 7;

/**
 * Los avisos de la comunidad en el Inicio (decisión 0098). Se lee una sola lista y de ahí salen
 * los círculos, el «Se busca» y el carrusel.
 */
export function useAvisosInicio() {
  const { data } = useClasificados({ limite: 40 });
  const avisos = data ?? [];
  const seBusca = avisos.filter((c) => c.subtipo === "perdido" && c.publicadoEn && Date.now() - new Date(c.publicadoEn).getTime() < DIAS_SE_BUSCA * 86_400_000).slice(0, 2);
  return { avisos, seBusca };
}

const SECCIONES = [
  { id: "inmuebles", nombre: "Inmuebles" },
  { id: "mascotas", nombre: "Mascotas" },
  { id: "turismo", nombre: "Turismo" },
] as const;

/** Los tres círculos que encabezan la fila de rubros. La foto es la del aviso más reciente de la sección. */
export function CirculosAvisos({ avisos }: { avisos: Clasificado[] }) {
  return (
    <>
      {SECCIONES.map((s) => (
        <CirculoCategoria key={s.id} nombre={s.nombre} fotoUrl={avisos.find((c) => c.seccion === s.id && c.fotos[0])?.fotos[0] ?? null} onPress={() => router.push(`/avisos/${s.id}`)} />
      ))}
    </>
  );
}

/** Banner rojo con las mascotas perdidas de la última semana. Sin avisos no ocupa lugar. */
export function BannerSeBusca({ avisos, estilo }: { avisos: Clasificado[]; estilo?: StyleProp<ViewStyle> }) {
  if (!avisos.length) return null;
  return (
    <View style={[estilo, { gap: 8 }]}>
      {avisos.map((c) => (
        <Pressable key={c.id} style={estilosBanner.banner} onPress={() => router.push(`/avisos/aviso/${c.id}`)} accessibilityRole="button" accessibilityLabel={`Se busca ${c.datos.nombreMascota ?? c.titulo}`}>
          {c.fotos[0] ? <Image source={{ uri: urlCompleta(c.fotos[0]) }} style={estilosBanner.foto} /> : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={estilosBanner.etiqueta}>SE BUSCA · {hace(c.publicadoEn).toUpperCase()}</Text>
            <Text style={estilosBanner.titulo} numberOfLines={1}>
              {c.datos.nombreMascota || c.titulo}
            </Text>
            <Text style={estilosBanner.texto} numberOfLines={1}>
              {c.datos.lugar || c.referencia}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </Pressable>
      ))}
    </View>
  );
}

/** «Avisos de la comunidad»: carrusel con lo último y el acceso para enviar uno. */
export function CarruselAvisosComunidad({ avisos }: { avisos: Clasificado[] }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const ultimos = avisos.filter((c) => c.subtipo !== "perdido").slice(0, 8);
  return (
    <View style={{ gap: espaciado.sm }}>
      {ultimos.length ? (
        <>
          <View style={styles.filaTitulo}>
            <Text style={styles.subtitulo} accessibilityRole="header">
              Avisos de la comunidad
            </Text>
            <Pressable onPress={() => router.push("/comunidad")} hitSlop={8} accessibilityRole="link">
              <Text style={styles.verTodo}>Ver todo</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
            {ultimos.map((c) => (
              <MiniClasificado key={c.id} c={c} />
            ))}
          </ScrollView>
        </>
      ) : null}
      <Pressable onPress={() => router.push("/avisos/enviar")} style={styles.enviar} accessibilityRole="button" accessibilityLabel="Envíanos tu aviso">
        <View style={styles.mas}>
          <Ionicons name="add" size={20} color="#ffffff" />
        </View>
        <Text style={styles.enviarTexto}>¿Alquilas, vendes o perdiste a tu mascota?</Text>
        <Ionicons name="chevron-forward" size={18} color={colores.primario} />
      </Pressable>
    </View>
  );
}

const estilosBanner = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: ROJO_SE_BUSCA, borderRadius: 18, padding: 10, paddingRight: espaciado.md },
  foto: { width: 64, height: 64, borderRadius: 12 },
  etiqueta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, letterSpacing: 0.4, color: "#ffffff" },
  titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: "#ffffff" },
  texto: { ...tipografia.pie, fontSize: 12.5, color: "rgba(255,255,255,0.92)" },
});

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    filaTitulo: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: espaciado.lg },
    subtitulo: { ...tipografia.subtitulo, color: colores.texto },
    verTodo: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.primario },
    fila: { paddingHorizontal: espaciado.lg, gap: 10 },
    enviar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: espaciado.lg,
      minHeight: 52,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colores.primario,
      backgroundColor: colores.superficieHundida,
    },
    mas: { width: 28, height: 28, borderRadius: 14, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center" },
    enviarTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.primario, flex: 1 },
  });
}
