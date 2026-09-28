import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Linking, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calificacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { textos } from "../../../src/i18n/es";
import { repositorioNegocios } from "../../../src/datos/fabricaRepositorios";
import { useNegocio } from "../../../src/datos/hooks/useNegocios";
import { useCategorias } from "../../../src/datos/hooks/useCategorias";
import { useFavoritosIds, useInvalidarFavoritos, alternarFavorito } from "../../../src/datos/hooks/useFavoritos";
import { useMiCalificacion, useInvalidarCalificacion, calificar } from "../../../src/datos/hooks/useCalificacion";
import { useSesion } from "../../../src/estado/useSesion";
import { useComunidadActiva } from "../../../src/estado/comunidadActiva";
import { BotonPrimario } from "../../../src/componentes/BotonPrimario";
import { EstadoError } from "../../../src/componentes/EstadoError";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";
import { Hueso } from "../../../src/componentes/EsqueletoNegocio";
import { MenuNegocio } from "../../../src/componentes/MenuNegocio";
import { CatalogoNegocio } from "../../../src/componentes/CatalogoNegocio";
import { ServiciosNegocio } from "../../../src/componentes/ServiciosNegocio";
import { CategoriasRubroNegocio } from "../../../src/componentes/CategoriasRubroNegocio";
import { OfertasPasillosNegocio } from "../../../src/componentes/OfertasPasillosNegocio";
import { GaleriaNegocio } from "../../../src/componentes/GaleriaNegocio";
import { MenuAccionesNegocio } from "../../../src/componentes/MenuAccionesNegocio";
import { HojaCalificar } from "../../../src/componentes/HojaCalificar";
import { MiniMapaNegocio } from "../../../src/componentes/MiniMapaNegocio";
import { FotoNegocio } from "../../../src/componentes/FotoNegocio";
import { Aviso } from "../../../src/componentes/Aviso";
import { FotoEnVuelo } from "../../../src/componentes/transicion/FotoEnVuelo";
import { OrigenFoto, useTransicionFoto } from "../../../src/estado/useTransicionFoto";
import { useProductosPorNegocio } from "../../../src/datos/hooks/useProductos";
import { resolverFicha } from "../../../src/utilidades/fichaNegocio";
import { estadoHoyTexto, resumenSemana } from "../../../src/utilidades/horarios";
import { formatearDistancia, minutosCaminando } from "../../../src/utilidades/distancia";
import { vibrarLigero } from "../../../src/utilidades/haptico";
import { useMovimientoReducido } from "../../../src/utilidades/useMovimientoReducido";
import { marca } from "../../../src/config/marca";

const ALTO_PORTADA = 290;
// En web, el navegador dibuja su propio contorno al enfocar un TextInput que ya tiene borde.
const sinContornoWeb = Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {};
const ANIM_NATIVA = Platform.OS !== "web";

function EsqueletoFicha() {
  return (
    <View accessibilityLabel="Cargando negocio" accessibilityRole="progressbar">
      <Hueso style={{ height: ALTO_PORTADA }} />
      <View style={{ padding: espaciado.lg, gap: espaciado.sm }}>
        <Hueso style={{ height: 12, width: "35%", borderRadius: 6 }} />
        <Hueso style={{ height: 26, width: "75%", borderRadius: 8 }} />
        <Hueso style={{ height: 12, width: "60%", borderRadius: 6 }} />
        <Hueso style={{ height: 44, width: "100%", borderRadius: 10, marginTop: espaciado.md }} />
      </View>
    </View>
  );
}

/** Botón redondo blanco sobre la foto (volver, favorito, más opciones). */
function BotonSobreFoto({
  icono,
  onPress,
  etiqueta,
  color,
  escala,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  etiqueta: string;
  color: string;
  escala?: Animated.Value;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={etiqueta}>
      <Animated.View style={[estilosFijos.botonFoto, escala ? { transform: [{ scale: escala }] } : null]}>
        <Ionicons name={icono} size={19} color={color} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Envoltorio: la foto que llega "volando" desde la tarjeta vive aquí, fuera de los estados de
 * carga/error/lista de la ficha, para que el vuelo no se reinicie cuando termina de cargar.
 */
export default function FichaNegocio() {
  const { id, transicion } = useLocalSearchParams<{ id: string; transicion?: string }>();
  const reducido = useMovimientoReducido();
  const [fotoEnVuelo, setFotoEnVuelo] = useState<OrigenFoto | null>(() => {
    const origen = useTransicionFoto.getState().origen;
    return transicion === "foto" && origen?.negocioId === id ? origen : null;
  });

  function llegoLaFoto() {
    setFotoEnVuelo(null);
    useTransicionFoto.getState().limpiar();
  }

  useEffect(() => {
    if (reducido && fotoEnVuelo) llegoLaFoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducido]);

  return (
    <View style={{ flex: 1 }}>
      <FichaContenido fotoEnVuelo={fotoEnVuelo} />
      {fotoEnVuelo ? <FotoEnVuelo origen={fotoEnVuelo} altoDestino={ALTO_PORTADA} onLlegar={llegoLaFoto} /> : null}
    </View>
  );
}

function FichaContenido({ fotoEnVuelo }: { fotoEnVuelo: OrigenFoto | null }) {
  // Se fija al montar: si la portada llegó volando, no hace su propio fundido al aparecer.
  const [llegoVolando] = useState(fotoEnVuelo !== null);
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const reducido = useMovimientoReducido();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: negocio, isLoading, isError, refetch } = useNegocio(id);
  const { data: productos } = useProductosPorNegocio(negocio?.id);
  const { data: categorias } = useCategorias();
  const token = useSesion((estado) => estado.token);
  const { comunidad } = useComunidadActiva();
  const { data: idsFavoritos } = useFavoritosIds();
  const invalidarFavoritos = useInvalidarFavoritos();
  const { data: miCalificacion } = useMiCalificacion(id);
  const invalidarCalificacion = useInvalidarCalificacion(id);
  const [busqueda, setBusqueda] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [calificarVisible, setCalificarVisible] = useState(false);
  const [favoritoOptimista, setFavoritoOptimista] = useState<boolean | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(0)).current;
  const latido = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (negocio?.id) void repositorioNegocios.registrarVisita(negocio.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocio?.id]);

  useEffect(() => {
    setFavoritoOptimista(null);
  }, [id]);

  // La portada entra acercándose (de 1.06 a 1) mientras el resto aparece: la foto es lo que se
  // mueve, así el ojo no pierde el hilo al pasar de la tarjeta a la ficha.
  useEffect(() => {
    if (!negocio) return;
    entrada.setValue(reducido ? 1 : 0);
    if (!reducido) {
      Animated.timing(entrada, {
        toValue: 1,
        duration: 420,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: ANIM_NATIVA,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocio?.id, reducido]);

  if (isLoading) {
    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ headerShown: false }} />
        <EsqueletoFicha />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.contenedor, { paddingTop: insets.top }]}>
        <EstadoError onReintentar={() => refetch()} />
      </View>
    );
  }

  if (!negocio) {
    return (
      <View style={[styles.contenedor, { paddingTop: insets.top }]}>
        <EstadoVacio titulo="No encontramos este negocio." />
      </View>
    );
  }

  const esFavorito = favoritoOptimista ?? idsFavoritos?.includes(negocio.id) ?? false;
  const estadoHoy = estadoHoyTexto(negocio.horarios);
  const semana = resumenSemana(negocio.horarios);
  const rubro = categorias?.find((c) => negocio.categoriaIds.includes(c.id))?.nombre;
  // Sin distancia real ni comunidad cargada (ej. abrir la ficha directo desde un enlace) no hay
  // desde dónde medir: se omite en vez de mostrar minutos medidos desde el centro de Lima.
  const distancia =
    negocio.distanciaM != null
      ? formatearDistancia(negocio.distanciaM)
      : comunidad
        ? `${minutosCaminando(negocio.coordenada)} min a pie`
        : null;

  function volver() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function abrirWhatsapp() {
    if (negocio!.whatsapp) Linking.openURL(`https://wa.me/${negocio!.whatsapp}`);
  }

  function llamar() {
    if (negocio!.telefono) Linking.openURL(`tel:${negocio!.telefono}`);
  }

  async function compartir() {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `${negocio!.nombre}\n\n${negocio!.descripcion}\n\nEncuéntralo en ${marca.nombreApp}: https://dawan.dev`,
      });
    } catch {
      // Cancelado o sin soporte de compartir nativo — no es un error real.
    }
  }

  function verInformacion() {
    setMenuVisible(false);
    router.push(`/negocio/${negocio!.id}/informacion`);
  }

  function abrirCalificar() {
    setMenuVisible(false);
    if (!token) {
      Alert.alert("Inicia sesión para calificar", "Necesitas tu cuenta de vecino: el modo invitado no puede calificar negocios.");
      return;
    }
    setCalificarVisible(true);
  }

  async function alCalificar(valor: Calificacion) {
    if (!token) return;
    await calificar(negocio!.id, valor, token);
    invalidarCalificacion();
  }

  async function tocarFavorito() {
    if (!token) {
      Alert.alert("Inicia sesión para guardar favoritos", "Necesitas tu cuenta de vecino: el modo invitado no guarda favoritos.");
      return;
    }
    const anterior = esFavorito;
    setFavoritoOptimista(!anterior);
    if (!anterior) {
      vibrarLigero();
      if (!reducido) {
        latido.setValue(1);
        Animated.sequence([
          Animated.timing(latido, { toValue: 1.28, duration: 120, useNativeDriver: ANIM_NATIVA }),
          Animated.spring(latido, { toValue: 1, friction: 4, tension: 180, useNativeDriver: ANIM_NATIVA }),
        ]).start();
      }
    }
    setAviso(anterior ? "Quitado de favoritos" : "Guardado en favoritos");
    try {
      await alternarFavorito(negocio!.id, token, anterior);
      invalidarFavoritos();
    } catch {
      setFavoritoOptimista(anterior);
      setAviso("No se pudo guardar. Intenta de nuevo.");
    }
  }

  // La ficha (y su título y campos extra) se configura por servicio y categoría en el panel — ver
  // docs/decisiones/0080-fichas.md. Si el negocio no cargó el contenido de su ficha, se cae a lo
  // que sí tenga (productos o fotos), con el título propio de ese bloque.
  const fichaNegocio = resolverFicha(negocio, categorias);
  const arquetipo = fichaNegocio?.ficha ?? null;
  const tituloDe = (ficha: string) => (arquetipo === ficha ? fichaNegocio?.titulo : undefined);
  const camposExtra = fichaNegocio?.campos ?? [];
  const tieneBuscador =
    (arquetipo === "servicios" && !!negocio.serviciosOfrecidos?.length) ||
    (arquetipo === "ofertas" && !!(negocio.ofertas?.length || negocio.pasillos?.length)) ||
    (!!productos && productos.length > 0 && arquetipo !== "rubros");

  let contenido;
  if (arquetipo === "servicios" && negocio.serviciosOfrecidos?.length) {
    contenido = (
      <ServiciosNegocio
        servicios={negocio.serviciosOfrecidos}
        moneda={negocio.moneda}
        busqueda={busqueda}
        titulo={tituloDe("servicios")}
      />
    );
  } else if (arquetipo === "rubros" && negocio.rubrosDisponibles?.length) {
    contenido = <CategoriasRubroNegocio rubros={negocio.rubrosDisponibles} titulo={tituloDe("rubros")} />;
  } else if (arquetipo === "ofertas" && (negocio.ofertas?.length || negocio.pasillos?.length)) {
    contenido = (
      <OfertasPasillosNegocio
        titulo={tituloDe("ofertas")}
        ofertas={negocio.ofertas ?? []}
        pasillos={negocio.pasillos ?? []}
        negocioFotoUrl={negocio.fotoPrincipalUrl}
        moneda={negocio.moneda}
        busqueda={busqueda}
      />
    );
  } else if (arquetipo === "catalogo" && productos && productos.length > 0) {
    contenido = (
      <CatalogoNegocio
        productos={productos}
        moneda={negocio.moneda}
        whatsapp={negocio.whatsapp}
        busqueda={busqueda}
        titulo={tituloDe("catalogo")}
        campos={camposExtra}
      />
    );
  } else if (productos && productos.length > 0) {
    contenido = (
      <MenuNegocio
        productos={productos}
        moneda={negocio.moneda}
        busqueda={busqueda}
        titulo={tituloDe("menu")}
        campos={arquetipo === "menu" ? camposExtra : []}
      />
    );
  } else {
    contenido = <GaleriaNegocio fotos={negocio.fotosGaleria} titulo={tituloDe("galeria")} />;
  }

  // Parallax: la portada baja a 0.45× mientras se desplaza (parece moverse más lento que el
  // contenido). Con "reducir movimiento" se queda quieta.
  const portadaY = reducido
    ? 0
    : scrollY.interpolate({
        inputRange: [-200, 0, ALTO_PORTADA],
        outputRange: [-100, 0, ALTO_PORTADA * 0.45],
        extrapolateRight: "clamp",
      });
  const portadaEscalaScroll = reducido
    ? 1
    : scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.6, 1], extrapolateRight: "clamp" });
  // Si la foto llega volando, la portada no hace además su propio acercamiento.
  const portadaEscalaEntrada = fotoEnVuelo ? 1 : entrada.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] });
  const cuerpoOpacidad = entrada.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.4, 1] });
  const cuerpoY = entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const barraOpacidad = scrollY.interpolate({
    inputRange: [ALTO_PORTADA - 110, ALTO_PORTADA - 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: ANIM_NATIVA })}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: espaciado.xxl + insets.bottom }}
      >
        <View style={styles.portadaMarco}>
          <Animated.View
            style={{
              opacity: fotoEnVuelo ? 0 : 1,
              transform: [{ translateY: portadaY }, { scale: portadaEscalaScroll }, { scale: portadaEscalaEntrada }],
            }}
          >
            <FotoNegocio
              nombre={negocio.nombre}
              url={negocio.fotoPrincipalUrl}
              style={{ height: ALTO_PORTADA, width: "100%" }}
              tamanoIniciales={72}
              avisoSinFoto
              fundido={!llegoVolando}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.cuerpo, { opacity: cuerpoOpacidad, transform: [{ translateY: cuerpoY }] }]}>
          {rubro ? <Text style={styles.rubro}>{rubro}</Text> : null}
          <View style={styles.filaNombre}>
            <Text style={styles.nombre} accessibilityRole="header">
              {negocio.nombre}
            </Text>
            {negocio.verificadoEn ? (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colores.primario}
                accessibilityLabel="Verificado"
                style={{ marginLeft: 6, marginTop: 4 }}
              />
            ) : null}
          </View>

          <View style={styles.filaMeta}>
            <Pressable
              onPress={abrirCalificar}
              hitSlop={10}
              style={styles.calificacion}
              accessibilityRole="button"
              accessibilityLabel="Calificar este negocio"
            >
              <Ionicons name="star" size={13} color={colores.calificacion} />
              {negocio.calificacionTotal > 0 ? (
                <Text style={styles.metaFuerte}>
                  {negocio.calificacionPromedio} <Text style={styles.meta}>({negocio.calificacionTotal})</Text>
                </Text>
              ) : (
                <Text style={styles.metaFuerte}>Califica</Text>
              )}
            </Pressable>
            <Text style={styles.meta}> · {distancia ? `${distancia} · ` : ""}</Text>
            <View style={[styles.punto, { backgroundColor: estadoHoy.abierto ? colores.abierto : colores.textoTenue }]} />
            <Text style={styles.meta}>
              {estadoHoy.abierto ? "Abierto" : "Cerrado"}, {estadoHoy.detalle}
            </Text>
          </View>

          {negocio.descripcion ? <Text style={styles.descripcion}>{negocio.descripcion}</Text> : null}

          {negocio.whatsapp || negocio.telefono ? (
            <View style={styles.filaAcciones}>
              {negocio.whatsapp ? (
                <BotonPrimario texto={textos.ficha.whatsapp} icono="logo-whatsapp" onPress={abrirWhatsapp} style={{ flex: 1 }} />
              ) : null}
              {negocio.telefono ? (
                <BotonPrimario
                  texto={textos.ficha.llamar}
                  icono="call-outline"
                  onPress={llamar}
                  variante={negocio.whatsapp ? "fantasma" : "primario"}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          ) : null}

          {tieneBuscador ? (
            <View style={styles.buscador}>
              <Ionicons name="search" size={15} color={colores.textoSuave} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar en este negocio"
                placeholderTextColor={colores.textoTenue}
                style={styles.entradaBuscador}
                accessibilityLabel={`Buscar en ${negocio.nombre}`}
              />
              {busqueda ? (
                <Pressable onPress={() => setBusqueda("")} hitSlop={8} accessibilityLabel="Borrar búsqueda">
                  <Ionicons name="close-circle" size={16} color={colores.textoTenue} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={{ marginTop: espaciado.sm }}>{contenido}</View>

          <Text style={styles.seccion} accessibilityRole="header">
            Ubicación
          </Text>
          <MiniMapaNegocio coordenada={negocio.coordenada} direccion={negocio.direccion} />

          <Text style={styles.seccion} accessibilityRole="header">
            Horario
          </Text>
          <View style={[styles.filaMeta, { marginTop: 0 }]}>
            <View style={[styles.punto, { backgroundColor: estadoHoy.abierto ? colores.abierto : colores.textoTenue }]} />
            <Text style={styles.metaFuerte}>{estadoHoy.abierto ? "Abierto ahora" : "Cerrado ahora"}</Text>
            <Text style={styles.meta}> · {estadoHoy.detalle}</Text>
          </View>
          <View style={styles.dias}>
            {semana.map((d) => (
              <View
                key={d.dia}
                style={[styles.dia, d.esHoy && { backgroundColor: colores.texto }, !d.abierto && { opacity: 0.45 }]}
                accessibilityLabel={`${d.dia}${d.esHoy ? ", hoy" : ""}: ${d.abierto ? "abre" : "cerrado"}`}
              >
                <Text style={[styles.diaTexto, d.esHoy && { color: colores.fondo }]}>{d.abreviatura}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={verInformacion} hitSlop={8} style={{ marginTop: espaciado.md }} accessibilityRole="link">
            <Text style={styles.enlace}>Ver horario completo e información</Text>
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>

      {/* Barra con el nombre: aparece cuando la portada ya salió de la pantalla. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.barraNombre, { paddingTop: insets.top, height: insets.top + 58, opacity: barraOpacidad }]}
      >
        <Text style={styles.barraNombreTexto} numberOfLines={1}>
          {negocio.nombre}
        </Text>
      </Animated.View>

      <View style={[styles.botonesFlotantes, { top: insets.top + 10 }]}>
        <BotonSobreFoto icono="chevron-back" onPress={volver} etiqueta="Volver" color="#141a16" />
        <View style={{ flexDirection: "row", gap: espaciado.sm }}>
          <BotonSobreFoto
            icono={esFavorito ? "heart" : "heart-outline"}
            onPress={tocarFavorito}
            etiqueta={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            color={esFavorito ? "#c8322e" : "#141a16"}
            escala={latido}
          />
          <BotonSobreFoto icono="ellipsis-vertical" onPress={() => setMenuVisible(true)} etiqueta="Más opciones" color="#141a16" />
        </View>
      </View>

      <Aviso texto={aviso} onTerminar={() => setAviso(null)} />

      <MenuAccionesNegocio
        visible={menuVisible}
        nombreNegocio={negocio.nombre}
        onCerrar={() => setMenuVisible(false)}
        onVerInformacion={verInformacion}
        onCalificar={abrirCalificar}
        onCompartir={compartir}
      />

      <HojaCalificar
        visible={calificarVisible}
        nombreNegocio={negocio.nombre}
        valorInicial={miCalificacion?.calificacion ?? null}
        onCerrar={() => setCalificarVisible(false)}
        onCalificar={alCalificar}
      />
    </View>
  );
}

const estilosFijos = StyleSheet.create({
  botonFoto: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
});

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    portadaMarco: { height: ALTO_PORTADA, overflow: "hidden", backgroundColor: colores.superficieHundida },
    cuerpo: { paddingHorizontal: espaciado.lg, paddingTop: espaciado.lg, backgroundColor: colores.fondo },
    rubro: { ...tipografia.etiqueta, color: colores.textoSuave, textTransform: "uppercase", marginBottom: 4 },
    filaNombre: { flexDirection: "row", alignItems: "flex-start" },
    nombre: { ...tipografia.titulo, fontSize: 28, lineHeight: 31, color: colores.texto, flexShrink: 1 },
    filaMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: espaciado.sm },
    calificacion: { flexDirection: "row", alignItems: "center", gap: 3 },
    metaFuerte: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    meta: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave },
    punto: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
    descripcion: { ...tipografia.cuerpo, color: colores.textoSuave, marginTop: espaciado.sm },
    filaAcciones: { flexDirection: "row", gap: espaciado.sm, marginTop: espaciado.lg },
    buscador: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: espaciado.lg,
      height: 40,
      paddingHorizontal: espaciado.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colores.bordeFuerte,
    },
    entradaBuscador: { flex: 1, ...tipografia.cuerpo, fontSize: 13.5, color: colores.texto, padding: 0, ...sinContornoWeb },
    seccion: { ...tipografia.subtitulo, color: colores.texto, marginTop: espaciado.xl, marginBottom: espaciado.sm },
    dias: { flexDirection: "row", gap: 4, marginTop: espaciado.sm },
    dia: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 7,
      borderRadius: 6,
      backgroundColor: colores.superficieHundida,
    },
    diaTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11.5, color: colores.textoSuave },
    enlace: { ...tipografia.cuerpoDestacado, fontSize: 13, color: colores.primario },
    barraNombre: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colores.fondo,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.bordeFuerte,
      justifyContent: "center",
      paddingHorizontal: 64,
    },
    barraNombreTexto: { ...tipografia.subtitulo, fontSize: 15, color: colores.texto, textAlign: "center" },
    botonesFlotantes: {
      position: "absolute",
      left: espaciado.md,
      right: espaciado.md,
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
}
