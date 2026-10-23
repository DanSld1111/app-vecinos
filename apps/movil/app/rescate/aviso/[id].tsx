import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvisoMascotaConPistas, ETIQUETA_TAMANO } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { agregarPista, cerrarAviso, reportarAviso, useAvisoMascota, useRefrescarRescate } from "../../../src/datos/hooks/useRescate";
import { useSesion } from "../../../src/estado/useSesion";
import { useUbicacionUsuario } from "../../../src/estado/useUbicacionUsuario";
import { urlCompleta } from "../../../src/utilidades/media";
import { abrirWhatsapp } from "../../../src/utilidades/whatsapp";
import { GaleriaFotos } from "../../../src/componentes/fichasRubro/GaleriaFotos";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";
import { MiniMapaNegocio } from "../../../src/componentes/MiniMapaNegocio";
import { AZUL_AVISO, BotonRescate, Chip, PedirSesion, ROJO_AVISO, hace } from "../../../src/componentes/rescate/comun";
import { mensajePista } from "../../../src/componentes/rescate/mensajes";

const ANCHO_MAXIMO = 640;
const VOLVER = () => (router.canGoBack() ? router.back() : router.replace("/rescate/perdidos"));

/** Detalle de un aviso de mascota perdida o encontrada (decisión 0097). */
export default function DetalleAviso() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, ANCHO_MAXIMO);
  const token = useSesion((e) => e.token);
  const { data: a, isLoading, refetch } = useAvisoMascota(id);
  const refrescar = useRefrescarRescate();
  const [hoja, setHoja] = useState<"lo_vi" | "es_mio" | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [reportado, setReportado] = useState(false);

  if (isLoading) return <ActivityIndicator style={{ marginTop: insets.top + 80 }} color={colores.primario} />;
  if (!a)
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40, backgroundColor: colores.fondo }}>
        <EstadoVacio titulo="Este aviso ya no está publicado." accionTexto="Ver Perdidos" onAccion={() => router.replace("/rescate/perdidos")} />
      </View>
    );

  const perdido = a.tipo === "perdido";
  const cerrado = a.estado === "cerrado";
  const fotos = a.fotos.map((f) => urlCompleta(f)!).filter(Boolean);
  const titulo = a.nombre || (perdido ? "Se busca" : "Mascota encontrada");

  async function alternarCerrado() {
    if (!token || !a) return;
    setTrabajando(true);
    try {
      await cerrarAviso(a.id, token, cerrado);
      refrescar();
      refetch();
    } finally {
      setTrabajando(false);
    }
  }

  async function reportar() {
    if (!token || !a) return;
    await reportarAviso(a.id, "Aviso falso o que no corresponde", token).catch(() => undefined);
    setReportado(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, width: ancho, alignSelf: "center" }}>
        <View style={{ paddingTop: insets.top }}>
          <GaleriaFotos fotos={fotos} alto={Math.round(ancho * 0.85)} ancho={ancho} icono="paw-outline" />
          <Pressable onPress={VOLVER} style={[styles.botonFoto, { top: insets.top + 12 }]} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color="#141a16" />
          </Pressable>
          <Text style={[styles.etiqueta, { backgroundColor: cerrado ? colores.primario : perdido ? ROJO_AVISO : AZUL_AVISO }]}>
            {cerrado ? "Ya volvió a casa" : `${perdido ? "Se busca" : "Encontrado"} · ${hace(a.creadoEn)}`}
          </Text>
        </View>

        <View style={styles.cuerpo}>
          <View style={{ gap: 6 }}>
            <Text style={styles.nombre}>{titulo}</Text>
            <Text style={styles.texto}>
              {a.senas}
              {a.tamano ? ` · ${ETIQUETA_TAMANO[a.tamano]}` : ""}
            </Text>
            {a.recompensa ? <Text style={styles.recompensa}>Recompensa: {a.recompensa}</Text> : null}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.subtitulo}>{perdido ? "Visto por última vez" : "Dónde lo encontraron"}</Text>
            {a.lat !== null && a.lng !== null ? <MiniMapaNegocio coordenada={{ lat: a.lat, lng: a.lng }} direccion={a.lugar} /> : null}
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Ionicons name="location-outline" size={16} color={colores.textoSuave} />
              <Text style={styles.nota}>
                {a.cuando ? `${a.cuando} · ` : ""}
                {a.lugar}
              </Text>
            </View>
            <Text style={styles.nota}>Publicado por {a.autorNombre}</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.subtitulo}>
              Pistas de vecinos <Text style={styles.nota}>· {a.listaPistas.length}</Text>
            </Text>
            {a.listaPistas.length ? (
              a.listaPistas.map((p, i) => (
                <View key={p.id} style={styles.pista}>
                  <Text style={styles.pistaNumero}>{a.listaPistas.length - i}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.pistaAutor}>
                      {p.autorNombre} · {hace(p.creadoEn)}
                      {p.esMio ? " · dice que es su mascota" : ""}
                    </Text>
                    <Text style={styles.texto}>«{p.texto}»</Text>
                    {p.cuando || p.lugar ? <Text style={styles.nota}>{[p.cuando, p.lugar].filter(Boolean).join(" · ")}</Text> : null}
                    {p.fotoUrl ? <Image source={{ uri: urlCompleta(p.fotoUrl) }} style={styles.pistaFoto} /> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.nota}>Todavía nadie dejó una pista. {a.esMio ? "Compártelo en tus grupos para que lo vean más vecinos." : "Si lo viste, cuéntale a su familia."}</Text>
            )}
          </View>

          {a.esMio ? (
            <View style={{ gap: 8 }}>
              {cerrado ? (
                <View style={styles.enCasa}>
                  <Text style={styles.enCasaTitulo}>{perdido ? `¡${a.nombre || "Tu mascota"} volvió a casa!` : "Aviso cerrado"}</Text>
                  <Text style={[styles.nota, { textAlign: "center" }]}>El aviso ya no se muestra a los vecinos.</Text>
                </View>
              ) : null}
              <BotonRescate texto={trabajando ? "Guardando…" : cerrado ? "Volver a publicar" : perdido ? "Ya volvió a casa" : "Ya encontré a su familia"} deshabilitado={trabajando} tipo={cerrado ? "secundario" : "principal"} onPress={alternarCerrado} />
              <BotonRescate texto="Compartir" tipo="secundario" icono="share-outline" onPress={() => Share.share({ message: `${perdido ? "Se busca" : "Encontrado"}: ${titulo}. ${a.lugar}. Míralo en ELISUR.` })} />
              {!cerrado ? <Text style={[styles.nota, { textAlign: "center" }]}>Vence {new Date(a.venceEn).toLocaleDateString("es-PE", { day: "numeric", month: "long" })} si no lo cierras.</Text> : null}
            </View>
          ) : cerrado ? null : (
            <View style={{ gap: 8 }}>
              {token ? (
                <>
                  <BotonRescate texto={perdido ? "Lo vi" : "Es mío"} icono={perdido ? "eye-outline" : "heart"} onPress={() => setHoja(perdido ? "lo_vi" : "es_mio")} />
                  {a.telefono ? (
                    <>
                      <BotonRescate texto={perdido ? "Escribir a su familia por WhatsApp" : "Escribir a quien lo encontró"} tipo="secundario" icono="logo-whatsapp" onPress={() => abrirWhatsapp(a.telefono, mensajePista(a, "", !perdido))} />
                      <Text style={[styles.nota, { textAlign: "center" }]}>Este botón aparece porque eligieron mostrar su WhatsApp.</Text>
                    </>
                  ) : null}
                </>
              ) : (
                <PedirSesion texto="Inicia sesión para dejar una pista o escribirle a su familia." />
              )}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <BotonRescate texto="Compartir" tipo="secundario" style={{ flex: 1, minHeight: 44 }} onPress={() => Share.share({ message: `${perdido ? "Se busca" : "Encontrado"}: ${titulo}. ${a.lugar}. Míralo en ELISUR.` })} />
                {token ? (
                  <BotonRescate texto={reportado ? "Reportado" : "Reportar aviso falso"} tipo="secundario" deshabilitado={reportado} style={{ flex: 1, minHeight: 44 }} onPress={reportar} />
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {hoja && token ? (
        <HojaPista
          aviso={a}
          esMio={hoja === "es_mio"}
          token={token}
          onCerrar={() => setHoja(null)}
          onEnviada={() => {
            refrescar();
            refetch();
          }}
        />
      ) : null}
    </View>
  );
}

/** «Lo vi» / «Es mío»: la pista se guarda en el aviso y, si se puede, se sigue por WhatsApp. */
function HojaPista({ aviso, esMio, token, onCerrar, onEnviada }: { aviso: AvisoMascotaConPistas; esMio: boolean; token: string; onCerrar: () => void; onEnviada: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const asegurarUbicacion = useUbicacionUsuario((e) => e.asegurarUbicacion);
  const [cuando, setCuando] = useState("Ahora mismo");
  const [lugar, setLugar] = useState("");
  const [coordenada, setCoordenada] = useState<{ lat: number; lng: number } | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombre = aviso.nombre || "esta mascota";

  async function usarUbicacion() {
    await asegurarUbicacion({ forzar: true });
    const c = useUbicacionUsuario.getState().coordenada;
    if (c) setCoordenada(c);
  }

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      await agregarPista(aviso.id, { cuando: esMio ? "" : cuando, lugar: lugar.trim(), lat: coordenada?.lat ?? null, lng: coordenada?.lng ?? null, texto: texto.trim(), fotoUrl: null, esMio }, token);
      setEnviada(true);
      onEnviada();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView style={styles.fondoHoja} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View style={[styles.hoja, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.agarre} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {aviso.fotos[0] ? <Image source={{ uri: urlCompleta(aviso.fotos[0]) }} style={styles.miniatura} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.subtitulo}>{esMio ? `¿${nombre} es tuya?` : `¿Viste a ${nombre}?`}</Text>
              <Text style={styles.nota}>{esMio ? "Cuéntale a quien la encontró cómo reconocerla." : "Tu pista le llega a su familia al instante."}</Text>
            </View>
            <Pressable onPress={onCerrar} style={styles.cerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={22} color={colores.texto} />
            </Pressable>
          </View>

          {enviada ? (
            <ScrollView contentContainerStyle={{ gap: 12, alignItems: "center", paddingVertical: 10 }}>
              <Ionicons name="checkmark-circle" size={56} color={colores.primario} />
              <Text style={[styles.subtitulo, { textAlign: "center" }]}>{esMio ? "¡Listo! Ya le avisamos" : `¡Gracias! La familia de ${nombre} ya lo sabe`}</Text>
              <Text style={[styles.nota, { textAlign: "center" }]}>Tu pista quedó en el aviso. Tu nombre se muestra; tu número no.</Text>
              {aviso.telefono ? (
                <BotonRescate texto="Escribir por WhatsApp" icono="logo-whatsapp" style={{ alignSelf: "stretch" }} onPress={() => abrirWhatsapp(aviso.telefono, mensajePista(aviso, lugar.trim(), esMio))} />
              ) : null}
              <BotonRescate texto="Volver al aviso" tipo="secundario" style={{ alignSelf: "stretch" }} onPress={onCerrar} />
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
              {!esMio ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.pregunta}>¿Cuándo?</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {["Ahora mismo", "Hace menos de 1 h", "Hoy", "Ayer"].map((c) => (
                      <Chip key={c} texto={c} activo={cuando === c} onPress={() => setCuando(c)} />
                    ))}
                  </View>
                </View>
              ) : null}
              {!esMio ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.pregunta}>¿Dónde?</Text>
                  <TextInput value={lugar} onChangeText={setLugar} maxLength={160} style={styles.entrada} placeholder="Ej.: Av. Aviación y Las Artes" placeholderTextColor={colores.textoTenue} />
                  <Pressable onPress={usarUbicacion} style={styles.ubicacion} accessibilityRole="button">
                    <Ionicons name={coordenada ? "checkmark-circle" : "locate-outline"} size={18} color={colores.primario} />
                    <Text style={styles.ubicacionTexto}>{coordenada ? "Ubicación agregada" : "Usar mi ubicación actual"}</Text>
                  </Pressable>
                </View>
              ) : null}
              <View style={{ gap: 6 }}>
                <Text style={styles.pregunta}>{esMio ? "¿Cómo la reconoces?" : "¿Qué viste?"}</Text>
                <TextInput
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  maxLength={500}
                  style={[styles.entrada, { minHeight: 84, textAlignVertical: "top", paddingTop: 12 }]}
                  placeholder={esMio ? "Ej.: Tiene una mancha blanca en el pecho y se llama Toby." : "Ej.: Iba solo, con collar azul, hacia la avenida…"}
                  placeholderTextColor={colores.textoTenue}
                />
              </View>
              {error ? <Text style={[styles.nota, { color: colores.error }]}>{error}</Text> : null}
              <BotonRescate texto={enviando ? "Enviando…" : esMio ? "Enviar" : "Enviar pista"} deshabilitado={texto.trim().length < 3 || enviando} onPress={enviar} />
              <Text style={[styles.nota, { textAlign: "center" }]}>Tu nombre se muestra en la pista; tu número no.</Text>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    botonFoto: { position: "absolute", left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
    etiqueta: { position: "absolute", left: 14, bottom: 14, color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, overflow: "hidden" },
    cuerpo: { padding: espaciado.lg, gap: espaciado.lg },
    nombre: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 28, color: colores.texto },
    texto: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 21, color: colores.textoSuave },
    recompensa: { alignSelf: "flex-start", backgroundColor: "#fdf0d9", color: "#6b4a0e", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
    subtitulo: { ...tipografia.subtitulo, fontSize: 16, color: colores.texto },
    nota: { ...tipografia.pie, fontSize: 13, lineHeight: 18, color: colores.textoSuave, fontFamily: "SchibstedGrotesk_400Regular" },
    pista: { flexDirection: "row", gap: 10, backgroundColor: colores.superficieHundida, borderRadius: 14, padding: 12 },
    pistaNumero: { width: 24, height: 24, borderRadius: 12, backgroundColor: AZUL_AVISO, color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, textAlign: "center", lineHeight: 24, overflow: "hidden" },
    pistaAutor: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 13.5, color: colores.texto },
    pistaFoto: { width: 110, height: 80, borderRadius: 8, marginTop: 4 },
    enCasa: { backgroundColor: colores.primarioSuave, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
    enCasaTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 17, color: colores.primarioFuerte },
    fondoHoja: { flex: 1, backgroundColor: "rgba(20,26,22,0.5)" },
    hoja: { backgroundColor: colores.fondo, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: espaciado.lg, paddingTop: 10, gap: 14, maxHeight: "88%", width: "100%", maxWidth: 640, alignSelf: "center" },
    agarre: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colores.bordeFuerte },
    miniatura: { width: 48, height: 48, borderRadius: 12 },
    cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    pregunta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    entrada: { ...tipografia.cuerpo, fontSize: 15, minHeight: 48, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 12, paddingHorizontal: 12, color: colores.texto, backgroundColor: colores.superficie },
    ubicacion: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40 },
    ubicacionTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.primario },
  });
}
