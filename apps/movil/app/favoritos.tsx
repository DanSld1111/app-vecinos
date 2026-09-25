import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, tipografia, useColores } from "../src/disenio";
import { useSesion } from "../src/estado/useSesion";
import { useFavoritos } from "../src/datos/hooks/useFavoritos";
import { TarjetaNegocio } from "../src/componentes/TarjetaNegocio";
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
        <Pressable style={styles.cerrar} onPress={volver} hitSlop={8}>
          <Ionicons name="close" size={20} color={colores.textoSuave} />
        </Pressable>
        <Text style={styles.titulo}>Favoritos</Text>
        <View style={{ width: 32 }} />
      </View>

      {!token ? (
        <View style={styles.contenidoCentrado}>
          <EstadoVacio titulo='Inicia sesión con tu cuenta de vecino para ver tus favoritos — "modo prueba" no los guarda.' />
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
          ItemSeparatorComponent={() => <View style={{ height: espaciado.sm }} />}
          ListEmptyComponent={
            <View style={styles.contenidoCentrado}>
              <EstadoVacio titulo="Todavía no tienes favoritos — toca el corazón en la ficha de un negocio para guardarlo acá." />
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaNegocio negocio={item} onPress={() => router.push(`/negocio/${item.id}`)} />
          )}
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
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    cerrar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      ...tipografia.displaySeccion,
      fontSize: 16,
      color: colores.texto,
      flex: 1,
      textAlign: "center",
    },
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
