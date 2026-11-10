import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ESPECIES_CLASIFICADO,
  MAX_FOTOS_CLASIFICADO,
  SUBTIPOS_CLASIFICADO,
  SeccionClasificado,
  SubtipoClasificado,
  TIPOS_INMUEBLE,
  TipoInmueble,
  EspecieClasificado,
} from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../src/disenio";
import { enviarClasificado, subirFotoClasificado, useRefrescarClasificados } from "../../src/datos/hooks/useClasificados";
import { useSesion } from "../../src/estado/useSesion";
import { elegirImagen } from "../../src/utilidades/elegirImagen";
import { urlCompleta } from "../../src/utilidades/media";
import { Boton, Cabecera, Chip, ICONO_SECCION, PedirSesion, volver } from "../../src/componentes/avisos/comun";

const SECCIONES: { id: SeccionClasificado; texto: string }[] = [
  { id: "inmuebles", texto: "Inmueble" },
  { id: "mascotas", texto: "Mascota" },
  { id: "turismo", texto: "Turismo" },
];

const AYUDA: Record<SeccionClasificado, string> = {
  inmuebles: "Ej.: Alquilo depa amoblado, 3 dorm, 119 m², 2 cocheras, piso 3 con ascensor. Av. San Borja Sur. S/ 3,200.",
  mascotas: "Ej.: Se perdió Toby, perro marrón claro con collar rojo, el domingo 7:30 p. m. en el parque de la Felicidad.",
  turismo: "Ej.: Full day a Paracas y Huacachina el sábado 15. S/ 129 por persona, incluye bus y guía. Agencia Rutas del Pacífico.",
};

/** El vecino envía su aviso (decisión 0098). Queda en revisión; el equipo ordena los datos y lo publica. */
export default function EnviarAviso() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const token = useSesion((e) => e.token);
  const usuario = useSesion((e) => e.usuario);
  const refrescar = useRefrescarClasificados();
  const params = useLocalSearchParams<{ seccion?: string }>();
  const inicial = SECCIONES.some((s) => s.id === params.seccion) ? (params.seccion as SeccionClasificado) : "inmuebles";
  const [seccion, setSeccion] = useState<SeccionClasificado>(inicial);
  const [subtipo, setSubtipo] = useState<SubtipoClasificado>(SUBTIPOS_CLASIFICADO[inicial][0].id);
  const [tipoInmueble, setTipoInmueble] = useState<TipoInmueble | null>(null);
  const [especie, setEspecie] = useState<EspecieClasificado | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [whatsapp, setWhatsapp] = useState(usuario?.telefono ?? "");
  const [autoriza, setAutoriza] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <Cabecera titulo="Envíanos tu aviso" />
        <View style={{ padding: espaciado.lg }}>
          <PedirSesion texto="Para enviar un aviso necesitas tu cuenta de vecino: así sabemos a quién avisar cuando esté publicado." />
        </View>
      </View>
    );

  function cambiarSeccion(s: SeccionClasificado) {
    setSeccion(s);
    setSubtipo(SUBTIPOS_CLASIFICADO[s][0].id);
  }

  async function agregarFoto() {
    const archivo = await elegirImagen();
    if (!archivo || !token) return;
    setSubiendo(true);
    setError(null);
    try {
      const { url } = await subirFotoClasificado(archivo, token);
      setFotos((l) => [...l, url].slice(0, MAX_FOTOS_CLASIFICADO));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
    }
  }

  const falta = !fotos.length ? "Agrega al menos una foto." : texto.trim().length < 10 ? "Cuéntanos un poco más del aviso." : whatsapp.replace(/\D/g, "").length < 9 ? "Escribe tu WhatsApp." : null;

  async function enviar() {
    if (!token || falta) return;
    setEnviando(true);
    setError(null);
    try {
      await enviarClasificado(
        {
          seccion,
          subtipo,
          texto: texto.trim(),
          fotos,
          whatsapp,
          autorizaContacto: autoriza,
          datos: { ...(seccion === "inmuebles" && tipoInmueble ? { tipoInmueble } : {}), ...(seccion === "mascotas" && especie ? { especie } : {}) },
        },
        token,
      );
      refrescar();
      router.replace("/avisos/mios?enviado=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Cabecera titulo="Envíanos tu aviso" subtitulo="Lo revisamos y lo publicamos gratis" />
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 110 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.bloque}>
          <Text style={styles.etiqueta}>¿Qué quieres publicar?</Text>
          <View style={styles.secciones}>
            {SECCIONES.map((s) => {
              const activo = s.id === seccion;
              return (
                <Pressable key={s.id} onPress={() => cambiarSeccion(s.id)} style={[styles.seccion, activo && styles.seccionActiva]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
                  <Ionicons name={ICONO_SECCION[s.id]} size={20} color={activo ? colores.primario : colores.textoSuave} />
                  <Text style={[styles.seccionTexto, activo && { color: colores.primario }]}>{s.texto}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chips}>
            {SUBTIPOS_CLASIFICADO[seccion].map((s) => (
              <Chip key={s.id} texto={s.id === "perdido" ? "Se perdió" : s.id === "encontrado" ? "La encontré" : s.etiqueta} activo={subtipo === s.id} onPress={() => setSubtipo(s.id)} />
            ))}
          </View>
          {seccion === "inmuebles" ? (
            <View style={styles.chips}>
              {TIPOS_INMUEBLE.slice(0, 4).map((t) => (
                <Chip key={t.id} texto={t.etiqueta} activo={tipoInmueble === t.id} onPress={() => setTipoInmueble(tipoInmueble === t.id ? null : t.id)} />
              ))}
            </View>
          ) : seccion === "mascotas" ? (
            <View style={styles.chips}>
              {ESPECIES_CLASIFICADO.map((e) => (
                <Chip key={e.id} texto={e.etiqueta} activo={especie === e.id} onPress={() => setEspecie(especie === e.id ? null : e.id)} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.bloque}>
          <Text style={styles.etiqueta}>
            Fotos <Text style={styles.ayuda}>(hasta {MAX_FOTOS_CLASIFICADO})</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {fotos.map((f, i) => (
              <View key={f}>
                <Image source={{ uri: urlCompleta(f) ?? f }} style={styles.foto} />
                <Pressable onPress={() => setFotos((l) => l.filter((x) => x !== f))} style={styles.quitarFoto} accessibilityRole="button" accessibilityLabel={`Quitar foto ${i + 1}`}>
                  <Ionicons name="close" size={14} color="#ffffff" />
                </Pressable>
              </View>
            ))}
            {fotos.length < MAX_FOTOS_CLASIFICADO ? (
              <Pressable onPress={agregarFoto} disabled={subiendo} style={styles.agregarFoto} accessibilityRole="button" accessibilityLabel="Agregar foto">
                {subiendo ? <ActivityIndicator color={colores.primario} /> : <Ionicons name="add" size={26} color={colores.primario} />}
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.bloque}>
          <Text style={styles.etiqueta}>Cuéntanos del aviso</Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={3000}
            placeholder={AYUDA[seccion]}
            placeholderTextColor={colores.textoTenue}
            style={[styles.campo, styles.campoLargo]}
            accessibilityLabel="Texto del aviso"
          />
          <Text style={styles.ayuda}>Escríbelo como quieras: nosotros ordenamos el precio, los metros y los demás datos.</Text>
        </View>

        <View style={styles.bloque}>
          <Text style={styles.etiqueta}>{seccion === "turismo" ? "WhatsApp de la agencia o del organizador" : "Tu WhatsApp para que te contacten"}</Text>
          <TextInput value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" maxLength={20} placeholder="987 654 321" placeholderTextColor={colores.textoTenue} style={styles.campo} accessibilityLabel="WhatsApp" />
          <Pressable onPress={() => setAutoriza(!autoriza)} style={styles.autoriza} accessibilityRole="checkbox" accessibilityState={{ checked: autoriza }}>
            <Ionicons name={autoriza ? "checkbox" : "square-outline"} size={22} color={autoriza ? colores.primario : colores.textoSuave} />
            <Text style={styles.autorizaTexto}>Autorizo que este número se muestre en el aviso para que los vecinos escriban o llamen.</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: insets.bottom + 10 }]}>
        <Boton texto={enviando ? "Enviando…" : "Enviar para revisión"} onPress={enviar} deshabilitado={Boolean(falta) || enviando || subiendo} />
        {falta ? <Text style={styles.falta}>{falta}</Text> : null}
        <Pressable onPress={() => volver()} accessibilityRole="button" style={{ alignSelf: "center", padding: 4 }}>
          <Text style={styles.ayuda}>Cancelar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenido: { padding: espaciado.md, gap: espaciado.lg, width: "100%", maxWidth: 640, alignSelf: "center" },
    bloque: { gap: 10 },
    etiqueta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    ayuda: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, fontFamily: "SchibstedGrotesk_500Medium" },
    secciones: { flexDirection: "row", gap: 8 },
    seccion: { flex: 1, minHeight: 64, borderRadius: 12, borderWidth: 1.5, borderColor: colores.borde, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colores.superficie },
    seccionActiva: { borderColor: colores.primario, borderWidth: 2, backgroundColor: colores.superficieHundida },
    seccionTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.texto },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    foto: { width: 76, height: 76, borderRadius: 10, backgroundColor: colores.superficieHundida },
    quitarFoto: { position: "absolute", right: 4, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(20,26,22,.75)", alignItems: "center", justifyContent: "center" },
    agregarFoto: { width: 76, height: 76, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: colores.bordeFuerte, alignItems: "center", justifyContent: "center", backgroundColor: colores.superficieHundida },
    campo: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colores.bordeFuerte, paddingHorizontal: 12, fontFamily: "SchibstedGrotesk_500Medium", fontSize: 15, color: colores.texto, backgroundColor: colores.superficie },
    campoLargo: { minHeight: 120, paddingTop: 10, textAlignVertical: "top" },
    autoriza: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    autorizaTexto: { ...tipografia.cuerpo, fontSize: 13.5, color: colores.texto, flex: 1 },
    error: { ...tipografia.cuerpo, color: colores.error, textAlign: "center" },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: espaciado.md, paddingTop: 10, gap: 6, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    falta: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, textAlign: "center" },
  });
}
