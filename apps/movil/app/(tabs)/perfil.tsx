import { useState, useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ImageBackground, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { useAlturaBarra, useDesplazamiento } from "../../src/utilidades/useDesplazamiento";
import { BarraTituloFija } from "../../src/componentes/BarraTituloFija";
import { LinearGradient } from "expo-linear-gradient";
import { iniciales } from "../../src/componentes/FotoNegocio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { marca } from "../../src/config/marca";
import { textos } from "../../src/i18n/es";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useNotificaciones } from "../../src/estado/useNotificaciones";
import { useSesion } from "../../src/estado/useSesion";
import { useFavoritosIds } from "../../src/datos/hooks/useFavoritos";
import { useTema } from "../../src/estado/useTema";
import { HojaInferior } from "../../src/componentes/HojaInferior";
import { SelectorComunidad } from "../../src/componentes/SelectorComunidad";
import { SobreComunidad } from "../../src/componentes/SobreComunidad";
import { Interruptor } from "../../src/componentes/Interruptor";

const FOTO_INVITAR = require("../../assets/servicios/guia-negocios.jpg");

function Grupo({ children }: { children: React.ReactNode }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.grupoSombra}>
      <View style={styles.grupoCard}>{children}</View>
    </View>
  );
}

function FilaPerfil({
  icono,
  texto,
  peligro = false,
  proximamente = false,
  mostrarFlecha = true,
  primero = false,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  peligro?: boolean;
  proximamente?: boolean;
  mostrarFlecha?: boolean;
  primero?: boolean;
  onPress?: () => void;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <Pressable
      style={[styles.fila, primero && styles.filaSinBorde]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
    >
      <View style={[styles.filaIcono, peligro && styles.filaIconoPeligro]}>
        <Ionicons name={icono} size={19} color={peligro ? colores.acentoFuerte : colores.texto} />
      </View>
      <Text style={[styles.filaTexto, peligro && styles.filaTextoPeligro]}>
        {texto}
        {proximamente ? <Text style={styles.etiquetaProximamente}>  Próximamente</Text> : null}
      </Text>
      {mostrarFlecha && !proximamente ? (
        <Ionicons name="chevron-forward" size={18} color={colores.textoTenue} />
      ) : null}
    </Pressable>
  );
}

function FilaInterruptor({
  icono,
  texto,
  activo,
  onCambiar,
  proximamente = false,
  primero = false,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  activo: boolean;
  onCambiar: (valor: boolean) => void;
  proximamente?: boolean;
  primero?: boolean;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={[styles.fila, primero && styles.filaSinBorde]}>
      <View style={styles.filaIcono}>
        <Ionicons name={icono} size={19} color={colores.texto} />
      </View>
      <Text style={styles.filaTexto}>
        {texto}
        {proximamente ? <Text style={styles.etiquetaProximamente}>  Próximamente</Text> : null}
      </Text>
      <Interruptor activo={activo} onCambiar={onCambiar} deshabilitado={proximamente} />
    </View>
  );
}

export default function Perfil() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const refScroll = useRef<ScrollView>(null);
  useScrollToTop(refScroll);
  const desplazamiento = useDesplazamiento();
  const alturaBarra = useAlturaBarra();
  const { comunidad } = useComunidadActiva();
  const [hojaComunidadVisible, setHojaComunidadVisible] = useState(false);
  const [hojaSobreComunidadVisible, setHojaSobreComunidadVisible] = useState(false);
  const modoOscuro = useTema((estado) => estado.modo === "oscuro");
  const alternarTema = useTema((estado) => estado.alternar);
  const { activas: notificacionesActivas, decidir } = useNotificaciones();
  const cerrarSesion = useSesion((estado) => estado.cerrarSesion);
  const usuario = useSesion((estado) => estado.usuario);
  // usuario es null en "modo prueba" (continuarComoInvitado) — ahí no hay nombre real que mostrar.
  const nombreMostrado = usuario ? usuario.nombre : "Invitado";
  const { data: idsFavoritos } = useFavoritosIds();

  function compartirApp() {
    Share.share({
      message: `Estoy usando ${marca.nombreApp} para encontrar negocios y novedades de mi comunidad${comunidad ? ` en ${comunidad.nombre}` : ""}. ¡Pruébala tú también!`,
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={refScroll}
        onScroll={desplazamiento.onScroll}
        scrollEventThrottle={16}
        style={styles.contenedor}
        contentContainerStyle={[styles.contenido, { paddingTop: espaciado.lg + insets.top, paddingBottom: alturaBarra + espaciado.xl }]}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {usuario ? (
              <Text style={styles.avatarIniciales}>{iniciales(nombreMostrado)}</Text>
            ) : (
              <Ionicons name="person-outline" size={24} color={colores.primario} />
            )}
          </View>
          <View style={styles.headerTexto}>
            <Text style={styles.titulo} numberOfLines={1}>
              {nombreMostrado}
            </Text>
            <Text style={styles.vecinoDe}>
              {usuario ? "Vecino de " : "Modo invitado · "}
              {comunidad?.nombre ?? "…"}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.statCardAncha}
          onPress={() => router.push("/favoritos")}
          accessibilityRole="button"
          accessibilityLabel="Favoritos"
        >
          <Ionicons name="heart-outline" size={20} color={colores.texto} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statEtiquetaAncha}>Favoritos</Text>
            <Text style={styles.statSubtextoAncha}>
              {idsFavoritos
                ? `${idsFavoritos.length} negocio${idsFavoritos.length === 1 ? "" : "s"} guardado${idsFavoritos.length === 1 ? "" : "s"}`
                : "Negocios que guardaste"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colores.textoTenue} />
        </Pressable>

        <Text style={styles.etiquetaSeccion}>Preferencias</Text>
        <Grupo>
          <FilaInterruptor
            icono="notifications-outline"
            texto="Notificaciones"
            activo={notificacionesActivas}
            onCambiar={(valor) => decidir(valor)}
            primero
          />
          <FilaInterruptor
            icono="moon-outline"
            texto="Modo oscuro"
            activo={modoOscuro}
            onCambiar={alternarTema}
          />
          <FilaPerfil
            icono="location-outline"
            texto={textos.perfil.cambiarZona}
            onPress={() => setHojaComunidadVisible(true)}
          />
        </Grupo>

        <Text style={styles.etiquetaSeccion}>Soporte</Text>
        <Grupo>
          <FilaPerfil
            icono="information-circle-outline"
            texto={textos.perfil.sobreComunidad}
            primero
            onPress={() => setHojaSobreComunidadVisible(true)}
          />
          <FilaPerfil icono="help-circle-outline" texto={textos.perfil.ayuda} />
        </Grupo>

        <Text style={styles.etiquetaSeccion}>Gestión</Text>
        <Grupo>
          <FilaPerfil
            icono="briefcase-outline"
            texto="¿Diriges un negocio o la junta vecinal?"
            primero
            onPress={() => router.push("/cuenta")}
          />
        </Grupo>

        <Pressable onPress={compartirApp} accessibilityRole="button" accessibilityLabel="Invitar a vecinos">
          <ImageBackground source={FOTO_INVITAR} style={styles.ctaInvitar} imageStyle={{ borderRadius: 10 }} resizeMode="cover">
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]}
              locations={[0.2, 1]}
              style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
            />
            <Text style={styles.ctaTitulo}>Invita a tus vecinos</Text>
            <Text style={styles.ctaSubtitulo}>Comparte {marca.nombreApp} con tu comunidad</Text>
          </ImageBackground>
        </Pressable>

        <Grupo>
          <FilaPerfil
            icono="log-out-outline"
            texto={textos.perfil.cerrarSesion}
            peligro
            mostrarFlecha={false}
            primero
            onPress={cerrarSesion}
          />
        </Grupo>

        <Text style={styles.footerMarca}>
          {marca.nombreApp} · {comunidad?.nombre ?? "…"}
        </Text>

        <HojaInferior visible={hojaComunidadVisible} onCerrar={() => setHojaComunidadVisible(false)}>
          <SelectorComunidad onSeleccionar={() => setHojaComunidadVisible(false)} />
        </HojaInferior>

        <HojaInferior
          visible={hojaSobreComunidadVisible}
          onCerrar={() => setHojaSobreComunidadVisible(false)}
        >
          {comunidad ? <SobreComunidad comunidad={comunidad} /> : null}
        </HojaInferior>
      </Animated.ScrollView>
      <BarraTituloFija titulo={nombreMostrado} scrollY={desplazamiento.scrollY} desde={40} />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: espaciado.lg, gap: espaciado.sm, paddingBottom: espaciado.xxl },
    header: { flexDirection: "row", alignItems: "center", gap: espaciado.md, marginBottom: espaciado.sm },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarIniciales: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 21, color: colores.primario, letterSpacing: -0.5 },
    headerTexto: { flex: 1, minWidth: 0 },
    titulo: { ...tipografia.titulo, fontSize: 24, lineHeight: 28, color: colores.texto },
    vecinoDe: { ...tipografia.cuerpo, fontSize: 13, color: colores.textoSuave },
    statCardAncha: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      borderWidth: 1.5,
      borderColor: colores.borde,
      borderRadius: 10,
      padding: espaciado.md,
    },
    statEtiquetaAncha: { ...tipografia.cuerpoDestacado, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    statSubtextoAncha: { ...tipografia.pie, color: colores.textoSuave },
    etiquetaSeccion: { ...tipografia.subtitulo, fontSize: 14, color: colores.texto, marginTop: espaciado.md },
    grupoSombra: {},
    grupoCard: {},
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colores.bordeFuerte,
    },
    filaSinBorde: { borderTopWidth: 0 },
    filaIcono: { width: 22, alignItems: "center" },
    filaIconoPeligro: {},
    filaTexto: { ...tipografia.cuerpo, fontSize: 14.5, color: colores.texto, flex: 1 },
    filaTextoPeligro: { color: colores.acentoFuerte, fontFamily: "SchibstedGrotesk_600SemiBold" },
    etiquetaProximamente: { ...tipografia.pie, fontSize: 11.5, color: colores.textoTenue },
    ctaInvitar: { height: 128, borderRadius: 10, justifyContent: "flex-end", padding: espaciado.md, marginTop: espaciado.md, overflow: "hidden" },
    ctaTitulo: { ...tipografia.titulo, fontSize: 19, lineHeight: 22, color: "#ffffff" },
    ctaSubtitulo: { ...tipografia.pie, fontSize: 12.5, color: "rgba(255,255,255,0.92)" },
    footerMarca: { ...tipografia.pie, color: colores.textoTenue, textAlign: "center", marginTop: espaciado.md },
  });
}
