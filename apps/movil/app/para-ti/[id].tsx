import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { ComentarioPublicacion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, radios, tipografia, useColores } from "../../src/disenio";
import { useSesion } from "../../src/estado/useSesion";
import { comentar, reportarComentario, useComentarios, useModulos, usePublicacion, useActualizarPublicacionEnCache } from "../../src/datos/hooks/useParaTi";
import { AccionesPublicacion, CabeceraAutor, MediaPublicacion, tiempoPublicacion } from "../../src/componentes/paraTi/TarjetaPublicacion";
import { useAccionesPublicacion } from "../../src/componentes/paraTi/useAccionesPublicacion";
import { Aviso } from "../../src/componentes/Aviso";
import { EstadoVacio } from "../../src/componentes/EstadoVacio";

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Una publicación de Para ti completa (decisión 0091): reproductor, texto entero y comentarios. */
export default function PublicacionParaTi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const modulos = useModulos();
  const token = useSesion((e) => e.token);
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  const { data: p, isLoading } = usePublicacion(id);
  const { data: comentarios, isLoading: cargandoComentarios } = useComentarios(id, Boolean(p?.permiteComentarios));
  const acciones = useAccionesPublicacion();
  const actualizar = useActualizarPublicacionEnCache();
  const cliente = useQueryClient();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reportados, setReportados] = useState<string[]>([]);

  if (modulos.cargado && !modulos.paraTi) return <Redirect href="/" />;

  const volver = () => (router.canGoBack() ? router.back() : router.replace("/para-ti"));

  async function enviar() {
    if (!token || !p || !texto.trim()) return;
    setEnviando(true);
    try {
      const nuevo = await comentar(p.id, texto.trim(), token);
      cliente.setQueryData<ComentarioPublicacion[]>(["para-ti", "comentarios", p.id], (l) => [nuevo, ...(l ?? [])]);
      actualizar(p.id, (x) => ({ ...x, comentarios: x.comentarios + 1 }));
      setTexto("");
    } catch (e) {
      acciones.setAviso(e instanceof Error ? e.message : "No se pudo comentar. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  async function reportar(c: ComentarioPublicacion) {
    if (!token) return acciones.setAviso("Inicia sesión para reportar un comentario.");
    try {
      await reportarComentario(c.id, token);
      setReportados((r) => [...r, c.id]);
      acciones.setAviso("Gracias. Lo revisaremos.");
    } catch {
      acciones.setAviso("No se pudo reportar. Intenta de nuevo.");
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.raiz, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.barra}>
        <Pressable onPress={volver} style={styles.botonVolver} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colores.texto} />
        </Pressable>
        <Text style={styles.barraTitulo}>Para ti</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: espaciado.xl }} color={colores.primario} />
      ) : !p ? (
        <EstadoVacio titulo="Esta publicación ya no está disponible." accionTexto="Ir a Para ti" onAccion={() => router.replace("/para-ti")} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: espaciado.xxl }} keyboardShouldPersistTaps="handled">
            <View style={styles.bloque}>
              <CabeceraAutor p={p} />
            </View>
            <View style={styles.bloqueMedia}>
              <MediaPublicacion p={p} reproducir alto={p.tipo === "video" ? 420 : 340} />
            </View>
            <View style={styles.bloque}>
              <AccionesPublicacion
                p={p}
                tieneCorazon={acciones.tieneCorazon(p.id)}
                onCorazon={() => acciones.corazon(p)}
                onCompartir={() => acciones.compartir(p)}
              />
              {p.texto ? <Text style={styles.texto}>{p.texto}</Text> : null}
            </View>

            {p.permiteComentarios ? (
              <View style={styles.comentarios}>
                <Text style={styles.tituloComentarios}>
                  Comentarios <Text style={{ color: colores.textoSuave }}>· {p.comentarios}</Text>
                </Text>
                {cargandoComentarios ? <ActivityIndicator color={colores.primario} /> : null}
                {comentarios && comentarios.length === 0 ? <Text style={styles.sinComentarios}>Sé el primero en comentar.</Text> : null}
                {(comentarios ?? []).map((c) => (
                  <View style={styles.comentario} key={c.id}>
                    <View style={styles.avatarComentario}>
                      <Text style={styles.avatarComentarioTexto}>{iniciales(c.autorNombre)}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.metaComentario}>
                        <Text style={styles.autorComentario}>{c.autorNombre}</Text> · {tiempoPublicacion(c.creadoEn)}
                      </Text>
                      <Text style={styles.textoComentario}>{c.texto}</Text>
                      {reportados.includes(c.id) ? (
                        <Text style={styles.reportar}>Reportado</Text>
                      ) : (
                        <Pressable onPress={() => reportar(c)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Reportar comentario de ${c.autorNombre}`}>
                          <Text style={styles.reportar}>Reportar</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
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
              {token ? (
                <>
                  <TextInput
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escribe un comentario…"
                    placeholderTextColor={colores.textoTenue}
                    style={styles.entrada}
                    maxLength={500}
                    multiline
                    accessibilityLabel="Escribe un comentario"
                  />
                  <Pressable
                    onPress={enviar}
                    disabled={enviando || !texto.trim()}
                    style={[styles.enviar, (enviando || !texto.trim()) && { opacity: 0.45 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Enviar comentario"
                  >
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={cerrarSesion} style={styles.iniciar} accessibilityRole="button">
                  <Text style={styles.iniciarTexto}>Inicia sesión con tu cuenta de vecino para comentar</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </>
      )}
      <Aviso texto={acciones.aviso} onTerminar={() => acciones.setAviso(null)} />
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    barra: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: espaciado.sm, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    botonVolver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    barraTitulo: { ...tipografia.subtitulo, color: colores.texto },
    bloque: { paddingHorizontal: espaciado.lg, paddingTop: espaciado.md, gap: espaciado.sm },
    bloqueMedia: { paddingHorizontal: espaciado.lg, paddingTop: espaciado.md },
    texto: { ...tipografia.cuerpo, fontSize: 15, lineHeight: 22, color: colores.texto },
    comentarios: { marginTop: espaciado.lg, paddingHorizontal: espaciado.lg, paddingTop: espaciado.md, borderTopWidth: 6, borderTopColor: colores.superficieHundida, gap: espaciado.md },
    tituloComentarios: { ...tipografia.subtitulo, color: colores.texto },
    sinComentarios: { ...tipografia.cuerpo, color: colores.textoSuave },
    comentario: { flexDirection: "row", gap: 10 },
    avatarComentario: { width: 32, height: 32, borderRadius: 16, backgroundColor: colores.primarioSuave, alignItems: "center", justifyContent: "center" },
    avatarComentarioTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11.5, color: colores.primarioFuerte },
    metaComentario: { ...tipografia.pie, fontSize: 13, color: colores.textoTenue },
    autorComentario: { fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    textoComentario: { ...tipografia.cuerpo, color: colores.texto },
    reportar: { ...tipografia.pie, color: colores.textoTenue, paddingVertical: 2 },
    cerrados: { flexDirection: "row", alignItems: "center", gap: 8, margin: espaciado.lg, padding: espaciado.md, borderRadius: radios.md, backgroundColor: colores.superficieHundida },
    cerradosTexto: { ...tipografia.cuerpo, fontSize: 13, color: colores.textoSuave, flex: 1 },
    caja: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: espaciado.md, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, backgroundColor: colores.fondo },
    entrada: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colores.bordeFuerte,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      ...tipografia.cuerpo,
      color: colores.texto,
    },
    enviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.primario, alignItems: "center", justifyContent: "center" },
    iniciar: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: colores.superficieHundida, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
    iniciarTexto: { ...tipografia.cuerpoDestacado, fontSize: 13.5, color: colores.primarioFuerte, textAlign: "center" },
  });
}
