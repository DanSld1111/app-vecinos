import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { marca } from "../../src/config/marca";
import { textos } from "../../src/i18n/es";
import { useComunidadActiva } from "../../src/estado/comunidadActiva";
import { useNotificaciones } from "../../src/estado/useNotificaciones";
import { useSesion } from "../../src/estado/useSesion";
import { useTema } from "../../src/estado/useTema";
import { HojaInferior } from "../../src/componentes/HojaInferior";
import { SelectorComunidad } from "../../src/componentes/SelectorComunidad";
import { SobreComunidad } from "../../src/componentes/SobreComunidad";
import { Interruptor } from "../../src/componentes/Interruptor";

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
    <Pressable style={[styles.fila, primero && styles.filaSinBorde]} onPress={onPress}>
      <View style={[styles.filaIcono, peligro && styles.filaIconoPeligro]}>
        <Ionicons name={icono} size={17} color={peligro ? colores.acentoFuerte : colores.primarioFuerte} />
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
        <Ionicons name={icono} size={17} color={colores.primarioFuerte} />
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
  const { comunidad } = useComunidadActiva();
  const [hojaComunidadVisible, setHojaComunidadVisible] = useState(false);
  const [hojaSobreComunidadVisible, setHojaSobreComunidadVisible] = useState(false);
  const modoOscuro = useTema((estado) => estado.modo === "oscuro");
  const alternarTema = useTema((estado) => estado.alternar);
  const { activas: notificacionesActivas, decidir } = useNotificaciones();
  const cerrarSesion = useSesion((estado) => estado.cerrarSesion);

  function compartirApp() {
    Share.share({
      message: `Estoy usando ${marca.nombreApp} para encontrar negocios y novedades de mi comunidad${comunidad ? ` en ${comunidad.nombre}` : ""}. ¡Pruébala tú también!`,
    });
  }

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colores.primarioFuerte} />
          </View>
          <View style={styles.avatarEditar}>
            <Ionicons name="pencil" size={10} color="#ffffff" />
          </View>
        </View>
        <View style={styles.headerTexto}>
          <Text style={styles.titulo}>{textos.perfil.titulo}</Text>
          <View style={styles.filaZona}>
            <Text style={styles.vecinoDe}>Vecino de</Text>
            <View style={styles.pillZona}>
              <Text style={styles.pillZonaTexto}>{comunidad?.nombre ?? "…"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsFila}>
        <View style={styles.statSombra}>
          <View style={styles.statCard}>
            <View style={[styles.statIcono, { backgroundColor: colores.acentoSuave }]}>
              <Ionicons name="star-outline" size={16} color={colores.acentoFuerte} />
            </View>
            <Text style={styles.statEtiqueta}>Reseñas</Text>
            <View style={styles.statPill}>
              <Text style={styles.statPillTexto}>Próximamente</Text>
            </View>
          </View>
        </View>
        <View style={styles.statSombra}>
          <View style={styles.statCard}>
            <View style={[styles.statIcono, { backgroundColor: colores.primarioSuave }]}>
              <Ionicons name="heart-outline" size={16} color={colores.primarioFuerte} />
            </View>
            <Text style={styles.statEtiqueta}>Favoritos</Text>
            <View style={styles.statPill}>
              <Text style={styles.statPillTexto}>Próximamente</Text>
            </View>
          </View>
        </View>
      </View>

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

      <Pressable style={styles.ctaSombra} onPress={compartirApp}>
        <View style={styles.ctaInvitar}>
          <View style={styles.ctaIcono}>
            <Ionicons name="people" size={20} color="#ffffff" />
          </View>
          <View style={styles.ctaTexto}>
            <Text style={styles.ctaTitulo}>Invitar a vecinos</Text>
            <Text style={styles.ctaSubtitulo}>Comparte {marca.nombreApp} con tu cuadra</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
        </View>
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
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.superficieHundida,
    },
    contenido: {
      padding: espaciado.lg,
      gap: espaciado.md,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.lg,
      padding: espaciado.lg,
    },
    avatarWrap: {
      position: "relative",
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radios.lg,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarEditar: {
      position: "absolute",
      bottom: -3,
      right: -3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colores.primario,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colores.primarioSuave,
    },
    headerTexto: {
      flex: 1,
      gap: 4,
    },
    titulo: {
      ...tipografia.display,
      color: colores.texto,
    },
    filaZona: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    vecinoDe: {
      ...tipografia.pie,
      color: colores.textoSuave,
      fontWeight: "600",
    },
    pillZona: {
      backgroundColor: colores.fondo,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 2,
      borderRadius: radios.completo,
    },
    pillZonaTexto: {
      ...tipografia.etiqueta,
      color: colores.primarioFuerte,
    },

    statsFila: {
      flexDirection: "row",
      gap: espaciado.sm,
    },
    statSombra: {
      flex: 1,
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    statCard: {
      borderRadius: radios.lg,
      overflow: "hidden",
      paddingVertical: espaciado.md,
      alignItems: "center",
      gap: 4,
      opacity: 0.85,
    },
    statIcono: {
      width: 32,
      height: 32,
      borderRadius: radios.md,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    statEtiqueta: {
      ...tipografia.pie,
      fontSize: 11,
      fontWeight: "700",
      color: colores.textoTenue,
      textTransform: "uppercase",
    },
    statPill: {
      backgroundColor: colores.superficieHundida,
      paddingHorizontal: espaciado.sm,
      paddingVertical: 2,
      borderRadius: radios.completo,
      marginTop: 2,
    },
    statPillTexto: {
      ...tipografia.pie,
      fontSize: 10,
      fontWeight: "700",
      color: colores.textoTenue,
    },

    etiquetaSeccion: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textTransform: "uppercase",
      marginTop: espaciado.xs,
    },
    grupoSombra: {
      borderRadius: radios.lg,
      backgroundColor: colores.superficie,
      shadowColor: "#0f1f16",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    grupoCard: {
      borderRadius: radios.lg,
      overflow: "hidden",
    },
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      paddingVertical: espaciado.sm + 2,
      paddingHorizontal: espaciado.md,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
    },
    filaSinBorde: {
      borderTopWidth: 0,
    },
    filaIcono: {
      width: 34,
      height: 34,
      borderRadius: radios.sm,
      backgroundColor: colores.superficieHundida,
      alignItems: "center",
      justifyContent: "center",
    },
    filaIconoPeligro: {
      backgroundColor: colores.acentoSuave,
    },
    filaTexto: {
      ...tipografia.cuerpoDestacado,
      color: colores.texto,
      flex: 1,
    },
    filaTextoPeligro: {
      color: colores.acentoFuerte,
    },
    etiquetaProximamente: {
      ...tipografia.pie,
      fontSize: 10,
      color: colores.textoTenue,
      fontWeight: "700",
    },

    ctaSombra: {
      borderRadius: radios.lg,
      shadowColor: colores.acentoFuerte,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 4,
    },
    ctaInvitar: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaciado.md,
      backgroundColor: colores.acentoFuerte,
      borderRadius: radios.lg,
      padding: espaciado.md,
    },
    ctaIcono: {
      width: 40,
      height: 40,
      borderRadius: radios.md,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    ctaTexto: {
      flex: 1,
      gap: 1,
    },
    ctaTitulo: {
      ...tipografia.displaySeccion,
      fontSize: 15,
      color: "#ffffff",
    },
    ctaSubtitulo: {
      ...tipografia.pie,
      color: "rgba(255,255,255,0.85)",
    },

    footerMarca: {
      ...tipografia.etiqueta,
      color: colores.textoTenue,
      textAlign: "center",
      marginTop: espaciado.xs,
    },
  });
}
