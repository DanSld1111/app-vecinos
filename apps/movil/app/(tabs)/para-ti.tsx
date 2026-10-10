import { useRef } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Publicacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useAlturaBarra } from "../../src/utilidades/useDesplazamiento";
import { useDestacadas, useModulos, usePublicacionesParaTi } from "../../src/datos/hooks/useParaTi";
import { useDestacadasVistas } from "../../src/estado/useDestacadasVistas";
import { TarjetaPublicacion, imagenDe } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { CuadroVideo } from "../../src/componentes/paraTi/ReproductorVideo";
import { urlCompleta } from "../../src/utilidades/media";
import { Aviso } from "../../src/componentes/Aviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";

/** Pestaña "Para ti" (decisión 0091): destacadas arriba, como estados, y el muro debajo. */
export default function ParaTi() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const alturaBarra = useAlturaBarra();
  const modulos = useModulos();
  const activo = modulos.paraTi;
  const feed = usePublicacionesParaTi(activo);
  const { data: destacadas } = useDestacadas(activo);
  const vistas = useDestacadasVistas((e) => e.vistas);
  const acciones = useAccionesPublicacion();
  const lista = useRef<FlatList<Publicacion>>(null);
  useScrollToTop(lista);

  if (modulos.cargado && !activo) return <Redirect href="/" />;

  const publicaciones = feed.data?.pages.flatMap((pg) => pg.items) ?? [];
  const abrir = (p: Publicacion) => router.push({ pathname: "/para-ti/[id]", params: { id: p.id } });

  const cabecera = (
    <View>
      <Text style={styles.titulo} accessibilityRole="header">
        Para ti
      </Text>
      {destacadas && destacadas.length ? (
        <FlatList
          horizontal
          data={destacadas}
          keyExtractor={(d) => d.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaDestacadas}
          renderItem={({ item }) => {
            const imagen = imagenDe(item);
            const vista = vistas.includes(item.id);
            const cuadro = !imagen && item.tipo === "video" && item.videoUrl ? urlCompleta(item.videoUrl) : null;
            return (
              <Pressable
                style={[styles.destacada, { backgroundColor: imagen || cuadro ? colores.superficieHundida : colores.primarioFuerte }]}
                onPress={() => router.push({ pathname: "/para-ti/destacadas", params: { inicio: item.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Destacada: ${item.texto || item.enlaceTitulo || "publicación"}`}
              >
                {imagen ? <Image source={{ uri: imagen }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : cuadro ? <CuadroVideo url={cuadro} /> : null}
                <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
                <View style={[styles.anillo, { borderColor: vista ? "rgba(255,255,255,0.6)" : colores.acento }]}>
                  <Text style={styles.anilloTexto}>EL</Text>
                </View>
                {item.tipo === "video" || item.tipo === "youtube" ? (
                  <View style={styles.iconoVideo}>
                    <Ionicons name="play" size={11} color="#ffffff" />
                  </View>
                ) : null}
                {/* El margen va en el contenedor: dentro del texto dejaba asomar la línea cortada. */}
                <View style={styles.pieDestacada}>
                  <Text style={styles.tituloDestacada} numberOfLines={3}>
                    {item.texto || item.enlaceTitulo || "Ver publicación"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.raiz, { paddingTop: insets.top }]}>
      <FlatList
        ref={lista}
        data={publicaciones}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={cabecera}
        renderItem={({ item }) => (
          <TarjetaPublicacion
            p={item}
            tieneCorazon={acciones.tieneCorazon(item.id)}
            onCorazon={() => acciones.corazon(item)}
            onCompartir={() => acciones.compartir(item)}
            onAbrir={() => abrir(item)}
          />
        )}
        ListEmptyComponent={
          feed.isLoading ? null : <EstadoVacio titulo="Todavía no hay publicaciones. Vuelve pronto." />
        }
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colores.primario} />}
        contentContainerStyle={{ paddingBottom: alturaBarra + espaciado.xl }}
      />
      <Aviso texto={acciones.aviso} onTerminar={() => acciones.setAviso(null)} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    titulo: { ...tipografia.titulo, fontSize: 28, lineHeight: 32, color: colores.texto, paddingHorizontal: espaciado.lg, paddingTop: espaciado.md, paddingBottom: espaciado.sm },
    filaDestacadas: { paddingHorizontal: espaciado.lg, paddingBottom: espaciado.md, gap: 8 },
    destacada: { width: 104, height: 178, borderRadius: 14, overflow: "hidden", justifyContent: "space-between" },
    anillo: {
      margin: 8,
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 3,
      backgroundColor: colores.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    anilloTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 10 },
    iconoVideo: {
      position: "absolute",
      top: 12,
      right: 9,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    pieDestacada: { padding: 9 },
    tituloDestacada: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 12.5, lineHeight: 15.5 },
  });
}
