import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, tipografia, useColores } from "../src/disenio";
import { useSesion } from "../src/estado/useSesion";
import { useFavoritos } from "../src/datos/hooks/useFavoritos";
import { FotoNegocio } from "../src/componentes/FotoNegocio";
import { Tocable } from "../src/componentes/Tocable";
import { EntradaAnimada } from "../src/componentes/EntradaAnimada";
import { textoCercania } from "../src/componentes/vitrina/TarjetaVitrina";
import { EstadoVacio } from "../src/componentes/EstadoVacio";
import { EstadoError } from "../src/componentes/EstadoError";
import { EsqueletoListaNegocios } from "../src/componentes/EsqueletoNegocio";

export default function Favoritos() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((estado) => estado.token);
  const { data: favoritos, isLoading, isError, refetch } = useFavoritos();

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/perfil"));

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={[styles.barra, { paddingTop: espaciado.md + insets.top }]}>
        <Pressable style={styles.cerrar} onPress={volver} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={colores.texto} />
        </Pressable>
        <Text style={styles.titulo} accessibilityRole="header">
          Favoritos
        </Text>
      </View>

      {!token ? (
        <View style={styles.contenidoCentrado}>
          <EstadoVacio titulo="Inicia sesión con tu cuenta de vecino para ver tus favoritos. El modo invitado no los guarda." />
        </View>
      ) : isLoading ? (
        <View style={{ padding: espaciado.lg }}>
          <EsqueletoListaNegocios cantidad={4} />
        </View>
      ) : isError ? (
        <View style={styles.contenidoCentrado}>
          <EstadoError onReintentar={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={favoritos ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          numColumns={2}
          columnWrapperStyle={{ gap: espaciado.sm + 2 }}
          ListEmptyComponent={
            <View style={styles.contenidoCentrado}>
              <EstadoVacio titulo="Todavía no tienes favoritos. Toca el corazón en la ficha de un negocio para guardarlo aquí." />
            </View>
          }
          renderItem={({ item, index }) => {
            const { texto, abierto } = textoCercania(item);
            return (
              <EntradaAnimada retraso={Math.min(index, 8) * 40} style={{ flex: 1, maxWidth: "50%" }}>
                <Tocable
                  onPress={() => router.push(`/negocio/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nombre}, ${texto}`}
                  style={{ marginBottom: espaciado.lg }}
                >
                  <View>
                    <FotoNegocio nombre={item.nombre} url={item.fotoPrincipalUrl} style={styles.foto} tamanoIniciales={30} />
                    <View style={styles.corazon}>
                      <Ionicons name="heart" size={14} color="#c8322e" />
                    </View>
                  </View>
                  <Text style={styles.nombre} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {abierto ? <View style={styles.punto} /> : null}
                    <Text style={styles.meta} numberOfLines={1}>
                      {texto}
                    </Text>
                  </View>
                </Tocable>
              </EntradaAnimada>
            );
          }}
        />
      )}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    barra: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      paddingHorizontal: espaciado.lg,
      paddingBottom: espaciado.md,
    },
    cerrar: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      ...tipografia.titulo,
      fontSize: 22,
      color: colores.texto,
      flex: 1,
    },
    foto: { width: "100%", height: 160, borderRadius: 10 },
    corazon: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
    },
    nombre: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", fontSize: 13.5, lineHeight: 17, color: colores.texto, marginTop: 6 },
    meta: { ...tipografia.pie, color: colores.textoSuave, flexShrink: 1 },
    punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.abierto },
    lista: {
      padding: espaciado.lg,
      flexGrow: 1,
    },
    contenidoCentrado: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: espaciado.lg,
    },
  });
}
