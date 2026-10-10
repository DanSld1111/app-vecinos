import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Publicacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { useAlturaBarra } from "../../src/utilidades/useDesplazamiento";
import { registrarVisitaParaTi, useDestacadas, useModulos, usePublicacionesParaTi } from "../../src/datos/hooks/useParaTi";
import { useDestacadasVistas } from "../../src/estado/useDestacadasVistas";
import { useSesion } from "../../src/estado/useSesion";
import { TarjetaPublicacion, imagenDe } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { CuadroVideo } from "../../src/componentes/paraTi/ReproductorVideo";
import { HojaComentarios } from "../../src/componentes/paraTi/Comentarios";
import { MenuPublicacion } from "../../src/componentes/paraTi/MenuPublicacion";
import { urlCompleta } from "../../src/utilidades/media";
import { Aviso } from "../../src/componentes/Aviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";

const ANCHO_MAXIMO = 640;

/** Pestaña "Para ti" (decisiones 0091 y 0092): destacadas como historias y el muro a todo el ancho. */
export default function ParaTi() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const alturaBarra = useAlturaBarra();
  const modulos = useModulos();
  const activo = modulos.paraTi;
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const feed = usePublicacionesParaTi(activo, { q });
  const { data: destacadas } = useDestacadas(activo);
  const vistas = useDestacadasVistas((e) => e.vistas);
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  const acciones = useAccionesPublicacion();
  const [comentariosDe, setComentariosDe] = useState<Publicacion | null>(null);
  const [menuDe, setMenuDe] = useState<Publicacion | null>(null);
  const lista = useRef<FlatList<Publicacion>>(null);
  useScrollToTop(lista);
  const ancho = Math.min(width, ANCHO_MAXIMO);

  useFocusEffect(
    useCallback(() => {
      if (activo) registrarVisitaParaTi();
    }, [activo]),
  );

  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  if (modulos.cargado && !activo) return <Redirect href="/" />;

  const publicaciones = feed.data?.pages.flatMap((pg) => pg.items) ?? [];
  const abrir = (p: Publicacion) =>
    p.tipo === "video" || p.tipo === "youtube"
      ? router.push({ pathname: "/para-ti/videos", params: { inicio: p.id } })
      : router.push({ pathname: "/para-ti/[id]", params: { id: p.id } });
  const abrirCompleta = (p: Publicacion) => router.push({ pathname: "/para-ti/[id]", params: { id: p.id } });

  function cerrarBusqueda() {
    setBuscando(false);
    setBusqueda("");
    setQ("");
  }

  const cabecera = (
    <View>
      <View style={styles.encabezado}>
        <Text style={styles.titulo} accessibilityRole="header">
          Para ti
        </Text>
        <View style={styles.botonesEncabezado}>
          <Pressable style={styles.botonRedondo} onPress={() => router.push("/para-ti/videos")} accessibilityRole="button" accessibilityLabel="Ver solo videos">
            <Ionicons name="play-circle-outline" size={22} color={colores.texto} />
          </Pressable>
          <Pressable
            style={[styles.botonRedondo, buscando && { backgroundColor: colores.texto }]}
            onPress={() => (buscando ? cerrarBusqueda() : setBuscando(true))}
            accessibilityRole="button"
            accessibilityLabel={buscando ? "Cerrar búsqueda" : "Buscar"}
          >
            <Ionicons name={buscando ? "close" : "search"} size={20} color={buscando ? colores.fondo : colores.texto} />
          </Pressable>
        </View>
      </View>

      {buscando ? (
        <View style={styles.buscador}>
          <Ionicons name="search" size={18} color={colores.textoTenue} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar en Para ti…"
            placeholderTextColor={colores.textoTenue}
            style={styles.entradaBuscar}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Buscar en Para ti"
          />
        </View>
      ) : destacadas && destacadas.length ? (
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
                onPress={() => router.push({ pathname: "/para-ti/destacadas", params: { inicio: item.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Destacada${vista ? "" : " nueva"}: ${item.texto || item.enlaceTitulo || "publicación"}`}
              >
                <LinearGradient
                  colors={vista ? [colores.bordeFuerte, colores.bordeFuerte] : [colores.acento, colores.primario]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.anilloDestacada}
                >
                  <View style={[styles.destacada, { backgroundColor: imagen || cuadro ? "#2b2420" : colores.primarioFuerte }]}>
                    {imagen ? <Image source={{ uri: imagen }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : cuadro ? <CuadroVideo url={cuadro} /> : null}
                    <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
                    {item.tipo === "video" || item.tipo === "youtube" ? (
                      <View style={styles.iconoVideo}>
                        <Ionicons name="play" size={10} color="#ffffff" />
                      </View>
                    ) : null}
                    {/* El margen va en el contenedor: dentro del texto dejaba asomar la línea cortada. */}
                    <View style={styles.pieDestacada}>
                      <Text style={styles.tituloDestacada} numberOfLines={3}>
                        {item.texto || item.enlaceTitulo || "Ver publicación"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
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
        style={{ width: "100%", maxWidth: ANCHO_MAXIMO, alignSelf: "center" }}
        renderItem={({ item }) => (
          <TarjetaPublicacion
            p={item}
            ancho={ancho}
            tieneCorazon={acciones.tieneCorazon(item.id)}
            onCorazon={() => acciones.corazon(item)}
            onCompartir={() => acciones.compartir(item)}
            onAbrir={() => abrir(item)}
            onComentarios={() => setComentariosDe(item)}
            onMas={() => setMenuDe(item)}
          />
        )}
        ListEmptyComponent={
          feed.isLoading ? null : (
            <EstadoVacio titulo={q ? `No encontramos nada con «${q}».` : "Todavía no hay publicaciones. Vuelve pronto."} />
          )
        }
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colores.primario} />}
        contentContainerStyle={{ paddingBottom: alturaBarra + espaciado.xl }}
        keyboardShouldPersistTaps="handled"
      />
      <HojaComentarios
        p={comentariosDe ? publicaciones.find((x) => x.id === comentariosDe.id) ?? comentariosDe : null}
        visible={Boolean(comentariosDe)}
        onCerrar={() => setComentariosDe(null)}
        onIniciarSesion={cerrarSesion}
      />
      <MenuPublicacion
        p={menuDe}
        onCerrar={() => setMenuDe(null)}
        onAbrir={abrirCompleta}
        onComentarios={setComentariosDe}
        onCompartir={acciones.compartir}
        onAviso={acciones.setAviso}
      />
      <Aviso texto={acciones.aviso} onTerminar={() => acciones.setAviso(null)} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    encabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: espaciado.lg, paddingTop: espaciado.md, paddingBottom: espaciado.sm },
    titulo: { ...tipografia.titulo, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: colores.texto },
    botonesEncabezado: { flexDirection: "row", gap: 6 },
    botonRedondo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.superficieHundida, alignItems: "center", justifyContent: "center" },
    buscador: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: espaciado.lg,
      marginBottom: espaciado.md,
      paddingHorizontal: 14,
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: colores.superficieHundida,
    },
    entradaBuscar: { flex: 1, ...tipografia.cuerpo, fontSize: 16, color: colores.texto, paddingVertical: 10 },
    filaDestacadas: { paddingHorizontal: espaciado.lg, paddingTop: 4, paddingBottom: espaciado.md, gap: 10 },
    anilloDestacada: { width: 92, height: 140, borderRadius: 20, padding: 2.5 },
    destacada: { flex: 1, borderRadius: 17.5, borderWidth: 2, borderColor: colores.fondo, overflow: "hidden", justifyContent: "flex-end" },
    iconoVideo: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    tituloDestacada: { color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11.5, lineHeight: 14 },
    pieDestacada: { paddingHorizontal: 7, paddingBottom: 8 },
  });
}
