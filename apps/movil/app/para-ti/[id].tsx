import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { useSesion } from "../../src/estado/useSesion";
import { useModulos, usePublicacion } from "../../src/datos/hooks/useParaTi";
import { AccionesPublicacion, CabeceraAutor, Conteos, MediaPublicacion, formatearConteo } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { CajaComentario, ListaComentarios, useHiloComentarios } from "../../src/componentes/paraTi/Comentarios";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { Aviso } from "../../src/componentes/Aviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";

const ANCHO_MAXIMO = 640;

/** Una publicación de Para ti completa (decisiones 0091 y 0092): reproductor, texto entero y comentarios. */
export default function PublicacionParaTi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const modulos = useModulos();
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  const { data: p, isLoading } = usePublicacion(id);
  const acciones = useAccionesPublicacion();
  const h = useHiloComentarios(p);
  const ancho = Math.min(width, ANCHO_MAXIMO);

  if (modulos.cargado && !modulos.paraTi) return <Redirect href="/" />;

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/para-ti"));
  const alto = !p ? 0 : p.tipo === "youtube" ? Math.round((ancho * 9) / 16) / 0.75 : p.tipo === "video" ? Math.min(Math.round(ancho * 1.25), 640) : Math.min(Math.round(ancho * 1.25), 620);

  return (
    <KeyboardAvoidingView style={[styles.raiz, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.barra}>
        <Pressable onPress={volver} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={26} color={colores.texto} />
        </Pressable>
        <Text style={styles.barraTitulo}>Publicación</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: espaciado.xl }} color={colores.primario} />
      ) : !p ? (
        <EstadoVacio titulo="Esta publicación ya no está disponible." accionTexto="Ir a Para ti" onAccion={() => router.replace("/para-ti")} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: espaciado.xxl }} keyboardShouldPersistTaps="handled" style={styles.columna}>
            <View style={styles.bloque}>
              <CabeceraAutor p={p} />
            </View>
            {p.tipo === "texto" ? (
              <View style={styles.bloque}>
                <Text style={styles.textoGrande}>{p.texto}</Text>
              </View>
            ) : (
              <View style={{ marginTop: espaciado.sm }}>
                <MediaPublicacion p={p} reproducir alto={alto} plano />
              </View>
            )}
            <View style={{ paddingHorizontal: 6, marginTop: 4 }}>
              <AccionesPublicacion
                p={p}
                tieneCorazon={acciones.tieneCorazon(p.id)}
                onCorazon={() => acciones.corazon(p)}
                onCompartir={() => acciones.compartir(p)}
              />
            </View>
            <View style={[styles.bloque, { gap: 6 }]}>
              <Conteos p={p} />
              {p.texto && p.tipo !== "texto" ? (
                <Text style={styles.texto}>
                  <Text style={styles.textoAutor}>{p.autor} </Text>
                  {p.texto}
                </Text>
              ) : null}
            </View>

            {p.permiteComentarios ? (
              <View style={styles.comentarios}>
                <Text style={styles.tituloComentarios} accessibilityRole="header">
                  Comentarios <Text style={{ color: colores.textoSuave }}>· {formatearConteo(p.comentarios)}</Text>
                </Text>
                <ListaComentarios h={h} />
              </View>
            ) : (
              <View style={styles.cerrados}>
                <Ionicons name="lock-closed-outline" size={16} color={colores.textoSuave} />
                <Text style={styles.cerradosTexto}>Los comentarios están desactivados en esta publicación.</Text>
              </View>
            )}
          </ScrollView>

          {p.permiteComentarios ? (
            <View style={[styles.caja, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.columna}>
                <CajaComentario h={h} onIniciarSesion={cerrarSesion} />
              </View>
            </View>
          ) : null}
        </>
      )}
      <Aviso texto={acciones.aviso ?? h.aviso} onTerminar={() => (acciones.aviso ? acciones.setAviso(null) : h.setAviso(null))} />
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    columna: { width: "100%", maxWidth: ANCHO_MAXIMO, alignSelf: "center" },
    barra: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: espaciado.sm, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    botonVolver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    barraTitulo: { ...tipografia.subtitulo, color: colores.texto },
    bloque: { paddingHorizontal: espaciado.lg, paddingTop: espaciado.md },
    textoGrande: { ...tipografia.cuerpo, fontSize: 18, lineHeight: 26, fontFamily: "SchibstedGrotesk_500Medium", color: colores.texto },
    texto: { ...tipografia.cuerpo, fontSize: 15, lineHeight: 22, color: colores.texto },
    textoAutor: { fontFamily: "SchibstedGrotesk_800ExtraBold" },
    comentarios: { marginTop: espaciado.lg, paddingHorizontal: espaciado.lg, paddingTop: espaciado.md, borderTopWidth: 6, borderTopColor: colores.superficieHundida, gap: espaciado.md },
    tituloComentarios: { ...tipografia.subtitulo, color: colores.texto },
    cerrados: { flexDirection: "row", alignItems: "center", gap: 8, margin: espaciado.lg, padding: espaciado.md, borderRadius: radios.md, backgroundColor: colores.superficieHundida },
    cerradosTexto: { ...tipografia.cuerpo, fontSize: 13, color: colores.textoSuave, flex: 1 },
    caja: { paddingHorizontal: espaciado.md, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, backgroundColor: colores.fondo },
  });
}
