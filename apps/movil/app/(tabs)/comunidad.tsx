import { useState, useRef, useCallback } from "react";
import { Redirect } from "expo-router";
import { useModulos } from "../../src/datos/hooks/useParaTi";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import Reanimated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

// Al cambiar de filtro, los avisos que se quedan se deslizan a su nuevo lugar y los que entran o
// salen lo hacen con un fundido (Reanimated respeta solo "reducir movimiento" del teléfono).
const TRANSICION_LISTA = LinearTransition.duration(260);
const ENTRADA = FadeIn.duration(220);
const SALIDA = FadeOut.duration(140);
import { useBarraPestanas } from "../../src/estado/useBarraPestanas";
import { useAlturaBarra, useDesplazamiento } from "../../src/utilidades/useDesplazamiento";
import { BarraTituloFija } from "../../src/componentes/BarraTituloFija";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Aviso } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { useTema } from "../../src/estado/useTema";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useAvisos } from "../../src/datos/hooks/useAvisos";
import { ChipCategoria } from "../../src/componentes/ChipCategoria";
import { TarjetaAviso } from "../../src/componentes/TarjetaAviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { EstadoError } from "../../src/componentes/EstadoError";
import { EsqueletoListaAvisos } from "../../src/componentes/EsqueletoAviso";
import { agruparPorFecha } from "../../src/utilidades/agruparAvisos";
import { useClasificados } from "../../src/datos/hooks/useClasificados";
import { FilaClasificado, ROJO_SE_BUSCA, AZUL_TURISMO, TarjetaClasificado } from "../../src/componentes/avisos/comun";

type SeccionAviso = "inmuebles" | "mascotas" | "turismo";
type FiltroComunidad = "todo" | SeccionAviso | "municipal" | "junta_vecinal" | "seguridad";

/** Las secciones de los avisos de vecinos (decisión 0098) viven aquí junto a los avisos oficiales. */
const SECCIONES_AVISO: SeccionAviso[] = ["inmuebles", "mascotas", "turismo"];
const esSeccion = (f: FiltroComunidad): f is SeccionAviso => SECCIONES_AVISO.includes(f as SeccionAviso);

function filtros(colores: PaletaColores): { id: FiltroComunidad; etiqueta: string; colorPunto?: string }[] {
  return [
    { id: "todo", etiqueta: "Todo", colorPunto: colores.textoTenue },
    { id: "inmuebles", etiqueta: "Inmuebles", colorPunto: colores.primario },
    { id: "mascotas", etiqueta: "Mascotas", colorPunto: ROJO_SE_BUSCA },
    { id: "turismo", etiqueta: "Turismo", colorPunto: AZUL_TURISMO },
    { id: "municipal", etiqueta: "Municipal", colorPunto: colores.primario },
    { id: "junta_vecinal", etiqueta: "Junta vecinal", colorPunto: "#b8862e" },
    { id: "seguridad", etiqueta: "Seguridad", colorPunto: colores.error },
  ];
}

function filtrarAvisos(avisos: Aviso[], filtro: FiltroComunidad): Aviso[] {
  if (filtro === "todo") return avisos;
  if (esSeccion(filtro)) return [];
  return avisos.filter((a) => a.categoria === filtro);
}

function PantallaComunidad() {
  const colores = useColores();
  const modo = useTema((estado) => estado.modo);
  const styles = crearEstilos(colores, modo === "oscuro");
  const insets = useSafeAreaInsets();
  const refScroll = useRef<ScrollView>(null);
  useScrollToTop(refScroll);
  const desplazamiento = useDesplazamiento();
  const alturaBarra = useAlturaBarra();
  const marcarComunidadVista = useBarraPestanas((e) => e.marcarComunidadVista);
  // Mientras el vecino está en Comunidad, las alertas cuentan como vistas: se apaga el punto de la pestaña.
  useFocusEffect(
    useCallback(() => {
      marcarComunidadVista();
      return () => marcarComunidadVista();
    }, [marcarComunidadVista]),
  );
  const { comunidad } = useComunidadActiva();
  const [filtro, setFiltro] = useState<FiltroComunidad>("todo");
  const { data: avisos, isLoading, isError, isRefetching, refetch } = useAvisos(comunidad?.id);

  const avisosFiltrados = filtrarAvisos(avisos ?? [], filtro);
  const { width } = useWindowDimensions();
  const anchoPost = Math.min(width, 640);
  const { data: clasificados, isLoading: cargandoClasificados, refetch: refetchClasificados } = useClasificados(
    esSeccion(filtro) ? { seccion: filtro, limite: 30 } : { limite: 5 },
    filtro === "todo" || esSeccion(filtro),
  );

  // Las alertas de seguridad se fijan arriba del feed mientras estén vigentes, sin importar la fecha.
  const mostrarFijadas = filtro === "todo";
  const fijadas = mostrarFijadas ? avisosFiltrados.filter((a) => a.categoria === "seguridad") : [];
  const resto = mostrarFijadas
    ? avisosFiltrados.filter((a) => a.categoria !== "seguridad")
    : avisosFiltrados;
  const grupos = agruparPorFecha(resto);

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={refScroll}
        onScroll={desplazamiento.onScroll}
        scrollEventThrottle={16}
        style={styles.contenedor}
        contentContainerStyle={[styles.contenido, { paddingTop: espaciado.lg + insets.top, paddingBottom: alturaBarra + espaciado.xl + 64 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); refetchClasificados(); }} tintColor={colores.primario} />
        }
      >
        <View style={styles.filaTitulo}>
          <Text style={styles.titulo}>Comunidad</Text>
          <View style={styles.insigniaZona}>
            <Text style={styles.insigniaZonaTexto}>{comunidad?.nombre ?? "..."}</Text>
          </View>
        </View>

        <View style={styles.filaChips}>
          {filtros(colores).map((item) => (
            <ChipCategoria
              key={item.id}
              etiqueta={item.etiqueta}
              activo={filtro === item.id}
              onPress={() => setFiltro(item.id)}
              colorPunto={item.colorPunto}
            />
          ))}
        </View>

        {esSeccion(filtro) ? (
          cargandoClasificados ? (
            <EsqueletoListaAvisos cantidad={2} />
          ) : clasificados && clasificados.length ? (
            <View style={{ gap: 12, marginHorizontal: -espaciado.lg, marginTop: espaciado.sm }}>
              {clasificados.map((c) => (
                <View key={c.id} style={{ width: anchoPost, alignSelf: "center" }}>
                  <TarjetaClasificado c={c} ancho={anchoPost} />
                </View>
              ))}
            </View>
          ) : (
            <EstadoVacio titulo="Todavía no hay avisos aquí. ¿Tienes uno? Envíanoslo." />
          )
        ) : isLoading ? (
          <EsqueletoListaAvisos cantidad={3} />
        ) : isError ? (
          <EstadoError onReintentar={() => refetch()} />
        ) : avisosFiltrados.length > 0 ? (
          <>
            {fijadas.length > 0 ? (
              <View style={styles.grupo}>
                <View style={styles.encabezadoFijado}>
                  <Ionicons name="alert-circle" size={14} color={colores.error} />
                  <Text style={styles.tituloFijado}>Alertas activas</Text>
                </View>
                {fijadas.map((aviso) => (
                  <Reanimated.View key={aviso.id} layout={TRANSICION_LISTA} entering={ENTRADA} exiting={SALIDA}>
                    <TarjetaAviso aviso={aviso} />
                  </Reanimated.View>
                ))}
              </View>
            ) : null}

            {filtro === "todo" && clasificados && clasificados.length ? (
              <View style={styles.grupo}>
                <Text style={styles.tituloGrupo}>Avisos de vecinos</Text>
                {clasificados.map((c) => (
                  <FilaClasificado key={c.id} c={c} />
                ))}
              </View>
            ) : null}

            {grupos.map((grupo) => (
              <Reanimated.View key={grupo.etiqueta} style={styles.grupo} layout={TRANSICION_LISTA} entering={ENTRADA} exiting={SALIDA}>
                <Text style={styles.tituloGrupo}>{grupo.etiqueta}</Text>
                {grupo.avisos.map((aviso) => (
                  <Reanimated.View key={aviso.id} layout={TRANSICION_LISTA} entering={ENTRADA} exiting={SALIDA}>
                    <TarjetaAviso aviso={aviso} />
                  </Reanimated.View>
                ))}
              </Reanimated.View>
            ))}
          </>
        ) : (
          <EstadoVacio titulo="No hay nada por aquí todavía." />
        )}
      </Animated.ScrollView>
      <BarraTituloFija titulo="Comunidad" scrollY={desplazamiento.scrollY} />
      <Pressable
        onPress={() => router.push(esSeccion(filtro) ? `/avisos/enviar?seccion=${filtro}` : "/avisos/enviar")}
        style={[styles.botonEnviar, { bottom: alturaBarra + espaciado.md }]}
        accessibilityRole="button"
        accessibilityLabel="Envíanos tu aviso"
      >
        <Ionicons name="add" size={22} color="#ffffff" />
        <Text style={styles.botonEnviarTexto}>Envíanos tu aviso</Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(colores: PaletaColores, oscuro: boolean) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.sm,
    },
    filaTitulo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: espaciado.sm,
    },
    titulo: {
      ...tipografia.titulo,
      fontSize: 27,
      lineHeight: 31,
      color: colores.texto,
    },
    insigniaZona: {
      borderWidth: 1.5,
      borderColor: colores.bordeFuerte,
      paddingHorizontal: espaciado.md,
      paddingVertical: 5,
      borderRadius: radios.completo,
    },
    insigniaZonaTexto: {
      fontFamily: "SchibstedGrotesk_600SemiBold",
      fontSize: 12.5,
      color: colores.texto,
    },
    subtitulo: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    filaChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: espaciado.sm,
    },
    grupo: {
      marginTop: espaciado.md,
    },
    tituloGrupo: {
      ...tipografia.subtitulo,
      color: colores.texto,
    },
    encabezadoFijado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: oscuro ? "#3a201c" : "#fbe2de",
      alignSelf: "flex-start",
      paddingHorizontal: espaciado.sm,
      paddingVertical: 4,
      borderRadius: radios.completo,
    },
    botonEnviar: {
      position: "absolute",
      right: espaciado.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 50,
      paddingLeft: 14,
      paddingRight: 18,
      borderRadius: 25,
      backgroundColor: colores.primario,
      shadowColor: "#1a531a",
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    botonEnviarTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: "#ffffff" },
    tituloFijado: {
      ...tipografia.etiqueta,
      color: colores.error,
    },
  });
}

/** Si el super admin apagó Comunidad (decisión 0091), quien llegue por un enlace vuelve a Inicio. */
export default function Comunidad() {
  const modulos = useModulos();
  if (modulos.cargado && !modulos.comunidad) return <Redirect href="/" />;
  return <PantallaComunidad />;
}
