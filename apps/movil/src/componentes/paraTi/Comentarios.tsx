import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { ComentarioPublicacion, MOTIVOS_REPORTE, MotivoReporte, Publicacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../disenio";
import { useSesion } from "../../estado/useSesion";
import {
  alternarCorazonComentario,
  comentar,
  reportarComentario,
  useActualizarPublicacionEnCache,
  useComentarios,
  useMisCorazonesEnComentarios,
} from "../../datos/hooks/useParaTi";
import { useMovimientoReducido } from "../../utilidades/useMovimientoReducido";
import { vibrarLigero } from "../../utilidades/haptico";
import { Aviso } from "../Aviso";
import { formatearConteo, tiempoPublicacion } from "./TarjetaPublicacion";

const COLORES_AVATAR = ["#8a4b2d", "#5b4a99", "#2f6b6b", "#7a5a1e", "#3f5f3a", "#2f4a5e", "#8a3b5c"];
function avatarDe(nombre: string) {
  const partes = nombre.replace(/\./g, "").trim().split(/\s+/);
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { iniciales: ((partes[0]?.[0] ?? "V") + (partes[1]?.[0] ?? "")).toUpperCase(), color: COLORES_AVATAR[h % COLORES_AVATAR.length] };
}

const MOTIVOS = Object.keys(MOTIVOS_REPORTE) as MotivoReporte[];

export interface Hilo {
  principal: ComentarioPublicacion;
  respuestas: ComentarioPublicacion[];
}

/**
 * Los comentarios de una publicación (decisión 0092): hilos de un nivel, el fijado arriba,
 * corazones, responder y reportar con motivo. Lo usan la hoja de comentarios y la publicación completa.
 */
export function useHiloComentarios(p: Publicacion | undefined | null) {
  const token = useSesion((e) => e.token);
  const usuario = useSesion((e) => e.usuario);
  const cliente = useQueryClient();
  const actualizar = useActualizarPublicacionEnCache();
  const { data, isLoading } = useComentarios(p?.id, Boolean(p?.permiteComentarios));
  const { data: misCorazones } = useMisCorazonesEnComentarios(p?.permiteComentarios ? p.id : undefined);
  const [locales, setLocales] = useState<Record<string, boolean>>({});
  const [respondiendoA, setRespondiendoA] = useState<ComentarioPublicacion | null>(null);
  const [reportando, setReportando] = useState<string | null>(null);
  const [reportados, setReportados] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const clave = ["para-ti", "comentarios", p?.id];

  const hilos: Hilo[] = useMemo(() => {
    const lista = data ?? [];
    const principales = lista.filter((c) => !c.respuestaA).sort((a, b) => Number(b.fijado) - Number(a.fijado));
    return principales.map((principal) => ({
      principal,
      respuestas: lista.filter((c) => c.respuestaA === principal.id).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)),
    }));
  }, [data]);

  const tieneCorazon = (id: string) => locales[id] ?? (misCorazones ?? []).includes(id);
  const cambiarEnCache = (id: string, cambio: (c: ComentarioPublicacion) => ComentarioPublicacion) =>
    cliente.setQueryData<ComentarioPublicacion[]>(clave, (l) => l?.map((c) => (c.id === id ? cambio(c) : c)));

  async function enviar() {
    if (!token || !p || !texto.trim()) return;
    setEnviando(true);
    try {
      const nuevo = await comentar(p.id, texto.trim(), token, respondiendoA?.id);
      cliente.setQueryData<ComentarioPublicacion[]>(clave, (l) => [nuevo, ...(l ?? [])]);
      actualizar(p.id, (x) => ({ ...x, comentarios: x.comentarios + 1 }));
      setTexto("");
      setRespondiendoA(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo comentar. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  async function corazon(c: ComentarioPublicacion) {
    if (!token) return setAviso("Inicia sesión con tu cuenta de vecino para dar corazón.");
    const antes = tieneCorazon(c.id);
    if (!antes) vibrarLigero();
    setLocales((l) => ({ ...l, [c.id]: !antes }));
    cambiarEnCache(c.id, (x) => ({ ...x, corazones: Math.max(0, x.corazones + (antes ? -1 : 1)) }));
    try {
      const total = await alternarCorazonComentario(c.id, token, antes);
      cambiarEnCache(c.id, (x) => ({ ...x, corazones: total }));
    } catch {
      setLocales((l) => ({ ...l, [c.id]: antes }));
      cambiarEnCache(c.id, (x) => ({ ...x, corazones: Math.max(0, x.corazones + (antes ? 1 : -1)) }));
      setAviso("No se pudo guardar. Intenta de nuevo.");
    }
  }

  async function reportar(c: ComentarioPublicacion, motivo: MotivoReporte) {
    if (!token) return setAviso("Inicia sesión para reportar un comentario.");
    setReportando(null);
    try {
      await reportarComentario(c.id, token, motivo);
      setReportados((r) => [...r, c.id]);
      setAviso("Gracias. Lo revisaremos.");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo reportar. Intenta de nuevo.");
    }
  }

  function responder(c: ComentarioPublicacion) {
    if (!token) return setAviso("Inicia sesión con tu cuenta de vecino para responder.");
    setRespondiendoA(c);
  }

  return {
    hilos,
    cargando: isLoading,
    conCuenta: Boolean(token),
    nombre: usuario?.nombre ?? "",
    tieneCorazon,
    corazon,
    reportar,
    reportando,
    setReportando,
    reportados,
    responder,
    respondiendoA,
    setRespondiendoA,
    texto,
    setTexto,
    enviar,
    enviando,
    aviso,
    setAviso,
  };
}

export type EstadoHilo = ReturnType<typeof useHiloComentarios>;

function Verificado({ tamano = 14 }: { tamano?: number }) {
  const colores = useColores();
  return <Ionicons name="checkmark-circle" size={tamano} color={colores.primario} accessibilityLabel="Cuenta oficial" />;
}

function FilaComentario({ c, h, respuesta = false }: { c: ComentarioPublicacion; h: EstadoHilo; respuesta?: boolean }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const av = c.oficial ? { iniciales: "EL", color: colores.primario } : avatarDe(c.autorNombre);
  const conCorazon = h.tieneCorazon(c.id);
  return (
    <View style={[styles.fila, respuesta && styles.filaRespuesta]}>
      <View style={[styles.avatar, respuesta && styles.avatarChico, { backgroundColor: av.color }]}>
        <Text style={[styles.avatarTexto, respuesta && { fontSize: 10 }]}>{av.iniciales}</Text>
      </View>
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <View style={styles.meta}>
          <Text style={styles.autor}>{c.autorNombre}</Text>
          {c.oficial ? <Verificado /> : null}
          <Text style={styles.tiempo}>· {tiempoPublicacion(c.creadoEn)}</Text>
        </View>
        <Text style={styles.texto}>{c.texto}</Text>
        <View style={styles.accionesFila}>
          <Pressable onPress={() => h.responder(c)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Responder a ${c.autorNombre}`}>
            <Text style={styles.accionTexto}>Responder</Text>
          </Pressable>
          {!c.oficial ? (
            h.reportados.includes(c.id) ? (
              <Text style={styles.accionTexto}>Reportado</Text>
            ) : (
              <Pressable
                onPress={() => h.setReportando(h.reportando === c.id ? null : c.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Reportar comentario de ${c.autorNombre}`}
              >
                <Text style={styles.accionTexto}>Reportar</Text>
              </Pressable>
            )
          ) : null}
        </View>
        {h.reportando === c.id ? (
          <View style={styles.motivos}>
            <Text style={styles.motivosTitulo}>¿Por qué lo reportas?</Text>
            <View style={styles.chips}>
              {MOTIVOS.map((m) => (
                <Pressable key={m} style={styles.chip} onPress={() => h.reportar(c, m)} accessibilityRole="button">
                  <Text style={styles.chipTexto}>{MOTIVOS_REPORTE[m]}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.chip, styles.chipCancelar]} onPress={() => h.setReportando(null)} accessibilityRole="button">
                <Text style={[styles.chipTexto, { color: colores.textoSuave }]}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={() => h.corazon(c)}
        style={styles.corazon}
        accessibilityRole="button"
        accessibilityLabel={conCorazon ? "Quitar corazón del comentario" : "Dar corazón al comentario"}
      >
        <Ionicons name={conCorazon ? "heart" : "heart-outline"} size={16} color={conCorazon ? colores.error : colores.textoTenue} />
        {c.corazones ? <Text style={[styles.corazonTexto, conCorazon && { color: colores.error }]}>{formatearConteo(c.corazones)}</Text> : null}
      </Pressable>
    </View>
  );
}

function HiloComentario({ hilo, h }: { hilo: Hilo; h: EstadoHilo }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [abierto, setAbierto] = useState(false);
  const visibles = abierto ? hilo.respuestas : hilo.respuestas.slice(0, 2);
  const contenido = (
    <>
      {hilo.principal.fijado ? (
        <View style={styles.fijado}>
          <Ionicons name="pin" size={13} color={colores.primarioFuerte} />
          <Text style={styles.fijadoTexto}>Fijado por ELISUR</Text>
        </View>
      ) : null}
      <FilaComentario c={hilo.principal} h={h} />
      {visibles.map((r) => (
        <FilaComentario key={r.id} c={r} h={h} respuesta />
      ))}
      {hilo.respuestas.length > 2 ? (
        <Pressable onPress={() => setAbierto(!abierto)} style={styles.verRespuestas} accessibilityRole="button">
          <View style={styles.rayita} />
          <Text style={styles.accionTexto}>{abierto ? "Ocultar respuestas" : `Ver ${hilo.respuestas.length - 2} respuestas más`}</Text>
        </Pressable>
      ) : null}
    </>
  );
  return hilo.principal.fijado ? <View style={styles.hiloFijado}>{contenido}</View> : <View style={styles.hilo}>{contenido}</View>;
}

/** La lista de hilos. */
export function ListaComentarios({ h }: { h: EstadoHilo }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  if (h.cargando) return <ActivityIndicator color={colores.primario} style={{ marginVertical: espaciado.lg }} />;
  if (!h.hilos.length) return <Text style={styles.vacio}>Todavía no hay comentarios. Sé el primero.</Text>;
  return (
    <View style={{ gap: espaciado.lg }}>
      {h.hilos.map((hilo) => (
        <HiloComentario key={hilo.principal.id} hilo={hilo} h={h} />
      ))}
    </View>
  );
}

/** Caja para escribir (o responder). En modo invitado invita a iniciar sesión. */
export function CajaComentario({ h, onIniciarSesion }: { h: EstadoHilo; onIniciarSesion: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const entrada = useRef<TextInput>(null);
  useEffect(() => {
    if (h.respondiendoA) entrada.current?.focus();
  }, [h.respondiendoA]);

  if (!h.conCuenta) {
    return (
      <Pressable onPress={onIniciarSesion} style={styles.iniciar} accessibilityRole="button">
        <Text style={styles.iniciarTexto}>Inicia sesión con tu cuenta de vecino para comentar</Text>
      </Pressable>
    );
  }
  const av = avatarDe(h.nombre || "Vecino");
  const listo = Boolean(h.texto.trim()) && !h.enviando;
  return (
    <View style={{ gap: 8 }}>
      {h.respondiendoA ? (
        <View style={styles.respondiendo}>
          <Text style={styles.respondiendoTexto} numberOfLines={1}>
            Respondiendo a <Text style={{ fontFamily: "SchibstedGrotesk_700Bold" }}>{h.respondiendoA.autorNombre}</Text>
          </Text>
          <Pressable onPress={() => h.setRespondiendoA(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancelar respuesta">
            <Ionicons name="close" size={18} color={colores.textoSuave} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.caja}>
        <View style={[styles.avatar, { backgroundColor: av.color }]}>
          <Text style={styles.avatarTexto}>{av.iniciales}</Text>
        </View>
        <TextInput
          ref={entrada}
          value={h.texto}
          onChangeText={h.setTexto}
          placeholder={h.nombre ? `Comenta como ${h.nombre.split(" ")[0]}…` : "Escribe un comentario…"}
          placeholderTextColor={colores.textoTenue}
          style={styles.entrada}
          maxLength={500}
          multiline
          numberOfLines={1}
          accessibilityLabel="Escribe un comentario"
        />
        <Pressable
          onPress={h.enviar}
          disabled={!listo}
          style={[styles.enviar, !listo && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentario"
        >
          <Ionicons name="arrow-up" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

/** Comentarios en una hoja que sube desde abajo, sobre el muro o el video (decisión 0092). */
export function HojaComentarios({ p, visible, onCerrar, onIniciarSesion }: { p: Publicacion | null; visible: boolean; onCerrar: () => void; onIniciarSesion: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducido = useMovimientoReducido();
  const h = useHiloComentarios(visible ? p : null);
  const alto = Math.round(height * 0.72);
  const subida = useRef(new Animated.Value(alto)).current;

  useEffect(() => {
    if (!visible) return;
    subida.setValue(reducido ? 0 : alto);
    Animated.timing(subida, { toValue: 0, duration: reducido ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start();
  }, [visible, reducido, alto, subida]);

  function cerrar() {
    Animated.timing(subida, { toValue: alto, duration: reducido ? 0 : 200, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(() => {
      h.setRespondiendoA(null);
      onCerrar();
    });
  }

  if (!p) return null;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrar} statusBarTranslucent>
      <Pressable style={styles.fondo} onPress={cerrar} accessibilityLabel="Cerrar comentarios" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.contenedorHoja} pointerEvents="box-none">
        <Animated.View style={[styles.hoja, { height: alto, transform: [{ translateY: subida }] }]} accessibilityViewIsModal>
          <View style={styles.asa} />
          <View style={styles.cabeceraHoja}>
            <Text style={styles.tituloHoja} accessibilityRole="header">
              {p.comentarios === 1 ? "1 comentario" : `${formatearConteo(p.comentarios)} comentarios`}
            </Text>
            <Pressable onPress={cerrar} style={styles.cerrar} accessibilityRole="button" accessibilityLabel="Cerrar comentarios">
              <Ionicons name="close" size={22} color={colores.texto} />
            </Pressable>
          </View>
          {p.permiteComentarios ? (
            <>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: espaciado.lg }} keyboardShouldPersistTaps="handled">
                <ListaComentarios h={h} />
              </ScrollView>
              <View style={[styles.pieHoja, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <CajaComentario h={h} onIniciarSesion={onIniciarSesion} />
              </View>
            </>
          ) : (
            <View style={styles.cerradosHoja}>
              <Ionicons name="lock-closed-outline" size={18} color={colores.textoSuave} />
              <Text style={styles.vacio}>Los comentarios están desactivados en esta publicación.</Text>
            </View>
          )}
          <Aviso texto={h.aviso} onTerminar={() => h.setAviso(null)} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    hilo: { gap: 12 },
    hiloFijado: { gap: 12, backgroundColor: colores.primarioSuave, borderRadius: radios.md, padding: 12 },
    fijado: { flexDirection: "row", alignItems: "center", gap: 5 },
    fijadoTexto: { ...tipografia.pie, fontFamily: "SchibstedGrotesk_700Bold", color: colores.primarioFuerte },
    fila: { flexDirection: "row", gap: 10 },
    filaRespuesta: { marginLeft: 44 },
    avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    avatarChico: { width: 26, height: 26, borderRadius: 13 },
    avatarTexto: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11.5 },
    meta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
    autor: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    tiempo: { ...tipografia.pie, fontSize: 12.5, color: colores.textoTenue },
    texto: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 20, color: colores.texto },
    accionesFila: { flexDirection: "row", gap: 18, marginTop: 2 },
    accionTexto: { ...tipografia.pie, fontSize: 12.5, fontFamily: "SchibstedGrotesk_700Bold", color: colores.textoSuave, paddingVertical: 2 },
    corazon: { width: 40, alignItems: "center", gap: 1, paddingTop: 4 },
    corazonTexto: { ...tipografia.pie, fontSize: 11.5, color: colores.textoTenue },
    verRespuestas: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 44, minHeight: 32 },
    rayita: { width: 24, height: 1, backgroundColor: colores.bordeFuerte },
    motivos: { marginTop: 6, padding: 10, borderRadius: radios.md, backgroundColor: colores.superficieHundida, gap: 8 },
    motivosTitulo: { ...tipografia.pie, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { minHeight: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.bordeFuerte, justifyContent: "center" },
    chipCancelar: { borderColor: "transparent", backgroundColor: "transparent" },
    chipTexto: { ...tipografia.pie, fontSize: 12.5, fontFamily: "SchibstedGrotesk_600SemiBold", color: colores.texto },
    vacio: { ...tipografia.cuerpo, color: colores.textoSuave, flex: 1 },
    caja: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    entrada: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1.5,
      borderColor: colores.bordeFuerte,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      backgroundColor: colores.superficieHundida,
      ...tipografia.cuerpo,
      color: colores.texto,
    },
    enviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center" },
    respondiendo: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radios.md, backgroundColor: colores.superficieHundida },
    respondiendoTexto: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave, flex: 1 },
    iniciar: { minHeight: 44, borderRadius: 22, backgroundColor: colores.superficieHundida, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
    iniciarTexto: { ...tipografia.cuerpoDestacado, fontSize: 13.5, color: colores.primarioFuerte, textAlign: "center" },
    fondo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.45)" },
    contenedorHoja: { flex: 1, justifyContent: "flex-end" },
    hoja: { backgroundColor: colores.fondo, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
    asa: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colores.bordeFuerte, marginTop: 8 },
    cabeceraHoja: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: espaciado.lg, paddingRight: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    tituloHoja: { ...tipografia.subtitulo, fontSize: 16, color: colores.texto },
    cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    pieHoja: { paddingHorizontal: espaciado.md, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, backgroundColor: colores.fondo },
    cerradosHoja: { flexDirection: "row", alignItems: "center", gap: 8, margin: espaciado.lg, padding: espaciado.md, borderRadius: radios.md, backgroundColor: colores.superficieHundida },
  });
}
