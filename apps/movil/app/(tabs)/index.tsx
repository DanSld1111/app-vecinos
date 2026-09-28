import { useEffect, useRef, useState } from "react";
import { Negocio } from "@app-vecinos/tipos";
import { abrirNegocio } from "../../src/componentes/transicion/abrirNegocio";
import { TEXTO_BUSCADOR } from "../../src/componentes/transicion/BuscadorEnVuelo";
import { useTransicionBuscador } from "../../src/estado/useTransicionBuscador";
import { router } from "expo-router";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useScrollToTop } from "@react-navigation/native";
import { useAlturaBarra, useDesplazamiento } from "../../src/utilidades/useDesplazamiento";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { textos } from "../../src/i18n/es";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useUbicacionUsuario } from "../../src/estado/useUbicacionUsuario";
import { useCategorias } from "../../src/datos/hooks/useCategorias";
import { useNegocios } from "../../src/datos/hooks/useNegocios";
import { useAvisos } from "../../src/datos/hooks/useAvisos";
import { BarraBusqueda } from "../../src/componentes/BarraBusqueda";
import { HojaInferior } from "../../src/componentes/HojaInferior";
import { SelectorComunidad } from "../../src/componentes/SelectorComunidad";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";
import { EstadoError } from "../../src/componentes/EstadoError";
import { EsqueletoFilaVitrina } from "../../src/componentes/EsqueletoNegocio";
import { PermisoNotificaciones } from "../../src/componentes/PermisoNotificaciones";
import { EntradaAnimada } from "../../src/componentes/EntradaAnimada";
import { FotoNegocio } from "../../src/componentes/FotoNegocio";
import { Tocable } from "../../src/componentes/Tocable";
import { CirculoCategoria } from "../../src/componentes/vitrina/CirculoCategoria";
import { OfertaDestacada } from "../../src/componentes/vitrina/OfertaDestacada";
import { TarjetaVitrina } from "../../src/componentes/vitrina/TarjetaVitrina";
import { useNotificaciones } from "../../src/estado/useNotificaciones";
import { fechaCorta } from "../../src/utilidades/saludo";
import { tiempoRelativo } from "../../src/utilidades/tiempoRelativo";

function FilaRanking({
  negocio,
  puesto,
  styles,
}: {
  negocio: Negocio;
  puesto: number;
  styles: ReturnType<typeof crearEstilos>;
}) {
  const refFoto = useRef<View>(null);
  return (
    <Tocable
      style={styles.filaRanking}
      onPress={() => abrirNegocio(negocio.id, { vista: refFoto.current, url: negocio.fotoPrincipalUrl, radio: 8 })}
      accessibilityRole="button"
      accessibilityLabel={`Puesto ${puesto}: ${negocio.nombre}`}
      escala={0.985}
    >
      <Text style={styles.puesto}>{puesto}</Text>
      <View ref={refFoto} collapsable={false}>
        <FotoNegocio nombre={negocio.nombre} url={negocio.fotoPrincipalUrl} style={styles.miniRanking} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.nombreRanking} numberOfLines={1}>
          {negocio.nombre}
        </Text>
        <Text style={styles.metaRanking} numberOfLines={1}>
          {negocio.descripcion}
        </Text>
      </View>
    </Tocable>
  );
}

export default function Inicio() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const refScroll = useRef<ScrollView>(null);
  useScrollToTop(refScroll);
  const desplazamiento = useDesplazamiento();
  const alturaBarra = useAlturaBarra();
  const queryClient = useQueryClient();
  const refBuscador = useRef<View>(null);
  const [actualizando, setActualizando] = useState(false);
  const { comunidad } = useComunidadActiva();
  const [hojaComunidadVisible, setHojaComunidadVisible] = useState(false);
  const [permisoVisible, setPermisoVisible] = useState(false);
  const permisoDecidido = useNotificaciones((estado) => estado.permisoDecidido);
  const { data: categorias } = useCategorias();
  const { coordenada, permiso: permisoUbicacion, asegurarUbicacion } = useUbicacionUsuario();

  useEffect(() => {
    void asegurarUbicacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con ubicación, el backend ordena por distancia real y desempata por popularidad; sin ella,
  // cae a popularidad. Ver docs/decisiones/0073-inicio-orden-real.md.
  const {
    data: negocios,
    isLoading,
    isError,
    refetch,
  } = useNegocios({
    comunidadId: comunidad?.id ?? "",
    limite: 8,
    lat: coordenada?.lat,
    lng: coordenada?.lng,
  });
  const { data: avisos } = useAvisos(comunidad?.id);
  const avisoReciente = avisos?.[0];

  // Ranking real de la semana: solo negocios con visitas, nunca "el primero de la lista porque sí".
  const masVisitados = [...(negocios?.items ?? [])]
    .filter((n) => n.visitas7d > 0)
    .sort((a, b) => b.visitas7d - a.visitas7d)
    .slice(0, 3);

  // Arrastrar hacia abajo: vuelve a pedir todo lo que muestra Inicio (negocios, avisos, anuncios, categorías).
  async function actualizar() {
    setActualizando(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setActualizando(false);
    }
  }

  // Mide el buscador para que la pantalla Buscar lo haga "subir" desde aquí (ver BuscadorEnVuelo).
  function abrirBuscar() {
    const vista = refBuscador.current;
    if (!vista) {
      router.push("/buscar");
      return;
    }
    let listo = false;
    const respaldo = setTimeout(() => {
      if (!listo) {
        listo = true;
        router.push("/buscar");
      }
    }, 150);
    vista.measureInWindow((x, y, ancho, alto) => {
      if (listo) return;
      listo = true;
      clearTimeout(respaldo);
      if (!ancho || !alto) {
        router.push("/buscar");
        return;
      }
      useTransicionBuscador.getState().preparar({ x, y, ancho, alto });
      router.push({ pathname: "/buscar", params: { transicion: "buscador" } });
    });
  }

  function alTocarCampana() {
    if (!permisoDecidido) setPermisoVisible(true);
    else router.push("/notificaciones");
  }

  function alTocarCategoria(categoriaId: string) {
    router.push({ pathname: "/servicios/negocios", params: { categoriaId } });
  }

  return (
    <View style={styles.raiz}>
      <Animated.ScrollView
        ref={refScroll}
        onScroll={desplazamiento.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.contenido, { paddingTop: insets.top + espaciado.md, paddingBottom: alturaBarra + espaciado.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor={colores.primario}
            colors={[colores.primario]}
            progressBackgroundColor={colores.fondo}
          />
        }
      >
        <View style={styles.bloque}>
          <View style={styles.filaSuperior}>
            <Pressable
              onPress={() => setHojaComunidadVisible(true)}
              hitSlop={8}
              style={styles.comunidad}
              accessibilityRole="button"
              accessibilityLabel={`Comunidad ${comunidad?.nombre ?? ""}. Cambiar comunidad`}
            >
              <Text style={styles.comunidadTexto}>
                {comunidad?.nombre ?? "…"} · {fechaCorta()}
              </Text>
              <Ionicons name="chevron-down" size={13} color={colores.textoSuave} />
            </Pressable>
            <Pressable
              onPress={alTocarCampana}
              hitSlop={8}
              style={styles.campana}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <Ionicons name="notifications-outline" size={21} color={colores.texto} />
              <View style={styles.puntoCampana} />
            </Pressable>
          </View>
          <Text style={styles.titulo} accessibilityRole="header">
            ¿Qué buscas hoy?
          </Text>
          <View ref={refBuscador} collapsable={false}>
            <BarraBusqueda placeholder={TEXTO_BUSCADOR} onPress={abrirBuscar} />
          </View>
        </View>

        {categorias && categorias.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaCategorias}>
            {categorias.map((cat) => (
              <CirculoCategoria
                key={cat.id}
                nombre={cat.nombre}
                fotoUrl={cat.fotoUrl}
                onPress={() => alTocarCategoria(cat.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.bloque}>
          <OfertaDestacada />
        </View>

        {avisoReciente ? (
          <View style={styles.bloque}>
            <Tocable
              style={styles.aviso}
              onPress={() => router.push("/comunidad")}
              accessibilityRole="button"
              accessibilityLabel={`Aviso: ${avisoReciente.titulo}`}
              escala={0.985}
            >
              <Ionicons
                name={avisoReciente.categoria === "seguridad" ? "shield-outline" : "business-outline"}
                size={19}
                color={avisoReciente.categoria === "seguridad" ? colores.error : colores.primario}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.avisoTitulo} numberOfLines={1}>
                  {avisoReciente.titulo}
                </Text>
                <Text style={styles.avisoMeta} numberOfLines={1}>
                  {avisoReciente.fuenteNombre} · {tiempoRelativo(avisoReciente.publicadoEn)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colores.textoTenue} />
            </Tocable>
          </View>
        ) : null}

        <View style={[styles.bloque, styles.filaTitulo]}>
          <Text style={styles.subtitulo} accessibilityRole="header">
            {textos.inicio.cercaDeTi}
          </Text>
          <Pressable onPress={() => router.push("/servicios/negocios")} hitSlop={8} accessibilityRole="link">
            <Text style={styles.verTodo}>Ver todo</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <EsqueletoFilaVitrina />
        ) : isError ? (
          <EstadoError onReintentar={() => refetch()} />
        ) : negocios && negocios.items.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaVitrina}>
            {negocios.items.map((negocio, i) => (
              <EntradaAnimada key={negocio.id} retraso={i * 40}>
                <TarjetaVitrina negocio={negocio} />
              </EntradaAnimada>
            ))}
          </ScrollView>
        ) : (
          <EstadoVacio titulo={textos.buscar.sinResultados} />
        )}

        {masVisitados.length > 0 ? (
          <View style={styles.bloque}>
            <Text style={[styles.subtitulo, { marginBottom: espaciado.xs }]} accessibilityRole="header">
              Lo más visitado esta semana
            </Text>
            {masVisitados.map((negocio, i) => (
              <FilaRanking key={negocio.id} negocio={negocio} puesto={i + 1} styles={styles} />
            ))}
          </View>
        ) : null}
      </Animated.ScrollView>

      {permisoUbicacion === "denegado" ? (
        <View style={[styles.pieUbicacion, { bottom: alturaBarra + espaciado.sm }]}>
          <Ionicons name="location-outline" size={16} color={colores.texto} />
          <Text style={styles.pieUbicacionTexto}>
            Sin tu ubicación, ordenamos por popularidad y medimos desde el centro del distrito.
          </Text>
        </View>
      ) : null}

      <HojaInferior visible={hojaComunidadVisible} onCerrar={() => setHojaComunidadVisible(false)}>
        <SelectorComunidad onSeleccionar={() => setHojaComunidadVisible(false)} />
      </HojaInferior>

      <PermisoNotificaciones visible={permisoVisible} onCerrar={() => setPermisoVisible(false)} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    contenido: { paddingBottom: espaciado.xl, gap: espaciado.lg },
    bloque: { paddingHorizontal: espaciado.lg },
    filaSuperior: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    comunidad: { flexDirection: "row", alignItems: "center", gap: 3 },
    comunidadTexto: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    campana: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: -10 },
    puntoCampana: {
      position: "absolute",
      top: 9,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colores.acentoFuerte,
      borderWidth: 1.5,
      borderColor: colores.fondo,
    },
    titulo: { ...tipografia.titulo, fontSize: 27, lineHeight: 31, color: colores.texto, marginBottom: espaciado.md },
    filaCategorias: { paddingHorizontal: espaciado.sm, gap: 0 },
    aviso: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      borderRadius: 10,
      backgroundColor: colores.superficieHundida,
    },
    avisoTitulo: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", fontSize: 13.5, color: colores.texto },
    avisoMeta: { ...tipografia.pie, color: colores.textoSuave },
    filaTitulo: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: -espaciado.sm },
    subtitulo: { ...tipografia.subtitulo, color: colores.texto },
    verTodo: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.primario },
    filaVitrina: { paddingHorizontal: espaciado.lg, gap: espaciado.sm + 2 },
    filaRanking: { flexDirection: "row", alignItems: "center", gap: espaciado.md, paddingVertical: espaciado.sm },
    puesto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 18, width: 16, color: colores.textoTenue },
    miniRanking: { width: 48, height: 48, borderRadius: 8 },
    nombreRanking: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    metaRanking: { ...tipografia.pie, color: colores.textoSuave },
    pieUbicacion: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.sm,
      backgroundColor: colores.superficieHundida,
      marginHorizontal: espaciado.lg,
      paddingHorizontal: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      borderRadius: 10,
      position: "absolute",
      left: 0,
      right: 0,
    },
    pieUbicacionTexto: { ...tipografia.pie, color: colores.texto, flex: 1 },
  });
}
