import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PREGUNTAS_ADOPCION, SolicitudAdopcion } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { solicitarAdopcion, useMascota, useRefrescarRescate } from "../../../src/datos/hooks/useRescate";
import { useSesion } from "../../../src/estado/useSesion";
import { urlCompleta } from "../../../src/utilidades/media";
import { abrirWhatsapp } from "../../../src/utilidades/whatsapp";
import { BotonRescate, Cabecera, Chip, PedirSesion } from "../../../src/componentes/rescate/comun";
import { mensajeSolicitud } from "../../../src/componentes/rescate/mensajes";

const PASOS = ["Solicitud enviada", "Entrevista con el albergue", "Conoces a la mascota", "Visita al hogar y entrega"];

/** Solicitud de adopción (decisión 0097): 5 preguntas, se guarda y se sigue por WhatsApp. */
export default function SolicitudAdopcionPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const { data: m, isLoading } = useMascota(id);
  const refrescar = useRefrescarRescate();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<SolicitudAdopcion | null>(null);

  if (isLoading || !m) return <ActivityIndicator style={{ marginTop: insets.top + 80 }} color={colores.primario} />;
  const hembra = m.sexo === "hembra";
  const respondidas = PREGUNTAS_ADOPCION.filter((p) => respuestas[p.id]).length;
  const completo = respondidas === PREGUNTAS_ADOPCION.length;

  async function enviar() {
    if (!token || !completo) return;
    setEnviando(true);
    setError(null);
    try {
      const s = await solicitarAdopcion(m!.id, respuestas, motivo.trim(), token);
      setEnviada(s);
      refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const cabecera = (
    <Cabecera
      titulo={`Adoptar a ${m.nombre}`}
      subtitulo={m.albergue.nombre}
      derecha={m.fotoUrl ? <Image source={{ uri: urlCompleta(m.fotoUrl) }} style={styles.avatar} /> : null}
      onVolver={() => (router.canGoBack() ? router.back() : router.replace(`/rescate/mascota/${m.id}`))}
    />
  );

  if (!token)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        {cabecera}
        <View style={{ padding: espaciado.lg }}>
          <PedirSesion texto={`Para pedir adoptar a ${m.nombre} necesitas tu cuenta de vecino: así el albergue sabe quién eres y puedes seguir tu solicitud.`} />
        </View>
      </View>
    );

  if (enviada)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        {cabecera}
        <ScrollView contentContainerStyle={styles.enviada}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={40} color={colores.primario} />
          </View>
          <Text style={styles.tituloEnviada}>¡Solicitud enviada!</Text>
          <Text style={styles.textoEnviada}>
            Quedó guardada con el N.º {enviada.numero} y el albergue ya la ve en su panel. Ahora escríbeles por WhatsApp: el mensaje ya va con tus respuestas.
          </Text>
          <View style={{ alignSelf: "stretch", gap: 8, marginTop: 8 }}>
            {PASOS.map((p, i) => (
              <View key={p} style={styles.pasoFila}>
                <Text style={[styles.pasoNumero, i === 0 ? styles.pasoHecho : null]}>{i + 1}</Text>
                <Text style={[styles.pasoTexto, i > 0 && { color: colores.textoSuave }]}>{p}</Text>
              </View>
            ))}
          </View>
          {enviada.albergueWhatsapp ? (
            <BotonRescate texto="Enviar por WhatsApp al albergue" icono="logo-whatsapp" style={{ alignSelf: "stretch", marginTop: 12 }} onPress={() => abrirWhatsapp(enviada.albergueWhatsapp, mensajeSolicitud(enviada))} />
          ) : (
            <Text style={styles.textoEnviada}>Este albergue no tiene WhatsApp publicado: te contactarán a tu número.</Text>
          )}
          <BotonRescate texto="Ver «Mi actividad»" tipo="secundario" style={{ alignSelf: "stretch" }} onPress={() => router.replace("/rescate/actividad")} />
        </ScrollView>
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {cabecera}
      <ScrollView contentContainerStyle={{ padding: espaciado.lg, gap: 18, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Son 5 preguntas rápidas. Ayudan al albergue a saber si {m.nombre} encaja en tu casa; no es un examen.</Text>
        {PREGUNTAS_ADOPCION.map((p) => (
          <View key={p.id} style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={p.titulo}>
            <Text style={styles.pregunta}>{p.titulo}</Text>
            <View style={styles.opciones}>
              {p.opciones.map((o) => (
                <Chip key={o} texto={o} activo={respuestas[p.id] === o} onPress={() => setRespuestas((r) => ({ ...r, [p.id]: o }))} />
              ))}
            </View>
          </View>
        ))}
        <View style={{ gap: 8 }}>
          <Text style={styles.pregunta}>Cuéntale al albergue por qué quieres adoptar</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            multiline
            maxLength={800}
            placeholder="Ej.: Vivo con mi pareja, tenemos un patio y trabajamos desde casa…"
            placeholderTextColor={colores.textoTenue}
            style={styles.motivo}
          />
        </View>
        <View style={styles.privacidad}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colores.primario} />
          <Text style={styles.privacidadTexto}>Tu nombre y tu WhatsApp se comparten solo con este albergue.</Text>
        </View>
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.faltan}>{completo ? "Listo, ya puedes enviarla" : `Respondiste ${respondidas} de ${PREGUNTAS_ADOPCION.length}`}</Text>}
        <BotonRescate texto={enviando ? "Enviando…" : "Enviar solicitud"} deshabilitado={!completo || enviando} onPress={enviar} />
      </View>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    avatar: { width: 40, height: 40, borderRadius: 20 },
    intro: { ...tipografia.cuerpo, color: colores.textoSuave },
    pregunta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    opciones: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    motivo: { ...tipografia.cuerpo, minHeight: 100, textAlignVertical: "top", borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 14, padding: 12, color: colores.texto, backgroundColor: colores.superficie },
    privacidad: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    privacidadTexto: { ...tipografia.pie, fontSize: 13, color: colores.textoSuave, flex: 1 },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 6, paddingHorizontal: espaciado.lg, paddingTop: 10, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    faltan: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, textAlign: "center" },
    error: { ...tipografia.pie, fontSize: 13, color: colores.error, textAlign: "center" },
    enviada: { padding: espaciado.lg, alignItems: "center", gap: 12, paddingTop: 36 },
    check: { width: 84, height: 84, borderRadius: 42, backgroundColor: colores.primarioSuave, alignItems: "center", justifyContent: "center" },
    tituloEnviada: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 24, color: colores.texto },
    textoEnviada: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 21, color: colores.textoSuave, textAlign: "center" },
    pasoFila: { flexDirection: "row", alignItems: "center", gap: 10 },
    pasoNumero: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colores.bordeFuerte, textAlign: "center", lineHeight: 22, fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, color: colores.textoSuave, overflow: "hidden" },
    pasoHecho: { backgroundColor: colores.primario, borderColor: colores.primario, color: "#ffffff" },
    pasoTexto: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.texto },
  });
}
