import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ESPECIES_CLASIFICADO, ETIQUETA_SUBTIPO, SECCIONES_CLASIFICADO, TIPOS_INMUEBLE, precioClasificado } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { reportarClasificado, useClasificado } from "../../../src/datos/hooks/useClasificados";
import { useSesion } from "../../../src/estado/useSesion";
import { BotonesContacto, Cabecera, CarruselFotos, ICONO_SECCION, colorEtiqueta, hace, vence } from "../../../src/componentes/avisos/comun";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";

const fecha = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });

/** La ficha completa de un aviso: todas las fotos, el texto y el contacto del anunciante. */
export default function FichaAviso() {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, 640);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading } = useClasificado(id);
  const token = useSesion((e) => e.token);
  const [completo, setCompleto] = useState(false);
  const [reportado, setReportado] = useState(false);

  if (isLoading)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <Cabecera titulo="Aviso" />
        <ActivityIndicator color={colores.primario} style={{ marginTop: espaciado.xl }} />
      </View>
    );
  if (!c)
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo }}>
        <Cabecera titulo="Aviso" />
        <View style={{ padding: espaciado.lg }}>
          <EstadoVacio titulo="Este aviso ya no está disponible." />
        </View>
      </View>
    );

  const d = c.datos;
  const precio = precioClasificado(c);
  const largo = c.texto.length > 280;
  const cifras =
    c.seccion === "inmuebles"
      ? [
          { valor: d.dormitorios, texto: "Dorm." },
          { valor: d.banos, texto: "Baños" },
          { valor: d.area, texto: "m²" },
          { valor: d.cocheras, texto: "Cocheras" },
        ].filter((x) => x.valor != null)
      : [];
  const etiquetas = [
    c.seccion === "inmuebles" ? TIPOS_INMUEBLE.find((t) => t.id === d.tipoInmueble)?.etiqueta : null,
    c.seccion === "mascotas" ? ESPECIES_CLASIFICADO.find((e) => e.id === d.especie)?.etiqueta : null,
    d.amoblado ? "Amoblado" : null,
    d.aceptaMascotas ? "Pet friendly" : null,
    d.duracion ?? null,
  ].filter((x): x is string => Boolean(x));

  function compartir() {
    const enlace = Platform.OS === "web" ? window.location.href : `https://dawan.dev/avisos/aviso/${c!.id}`;
    void Share.share({ message: `${c!.titulo} — ${enlace}` });
  }

  function reportar() {
    if (!token) {
      Alert.alert("Reportar aviso", "Para reportar un aviso necesitas tu cuenta de vecino.");
      return;
    }
    void reportarClasificado(c!.id, "", token).then(() => setReportado(true));
  }

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Cabecera
        titulo={SECCIONES_CLASIFICADO[c.seccion]}
        derecha={
          <Pressable onPress={compartir} style={styles.icono} accessibilityRole="button" accessibilityLabel="Compartir aviso">
            <Ionicons name="share-outline" size={22} color={colores.texto} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ alignSelf: "center" }}>
          <CarruselFotos fotos={c.fotos} ancho={ancho} alto={Math.round(ancho * 0.72)} icono={ICONO_SECCION[c.seccion]} />
        </View>
        <View style={styles.cuerpo}>
          <View style={styles.filaEtiquetas}>
            <Text style={[styles.etiqueta, { backgroundColor: colorEtiqueta(c, colores) }]}>{ETIQUETA_SUBTIPO[c.subtipo].toUpperCase()}</Text>
            {etiquetas.map((e) => (
              <Text key={e} style={styles.etiquetaSuave}>
                {e}
              </Text>
            ))}
          </View>
          {precio ? (
            <Text style={styles.precio}>
              {precio}
              {d.mantenimiento ? <Text style={styles.meta}>{`  · mant. S/ ${d.mantenimiento}`}</Text> : null}
            </Text>
          ) : null}
          <Text style={styles.titulo}>{c.titulo}</Text>

          {cifras.length ? (
            <View style={styles.cifras}>
              {cifras.map((x) => (
                <View key={x.texto} style={styles.cifra}>
                  <Text style={styles.cifraValor}>{x.valor}</Text>
                  <Text style={styles.cifraTexto}>{x.texto}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {c.seccion === "mascotas" && (d.lugar || d.cuando) ? (
            <View style={styles.recuadro}>
              {d.lugar ? <Linea icono="location-outline" texto={`${c.subtipo === "encontrado" ? "Encontrado en" : "Visto por última vez"}: ${d.lugar}`} /> : null}
              {d.cuando ? <Linea icono="time-outline" texto={d.cuando} /> : null}
            </View>
          ) : null}

          {c.seccion === "turismo" && d.salidas?.length ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.subtitulo}>Próximas salidas</Text>
              <View style={styles.filaEtiquetas}>
                {d.salidas.map((s) => (
                  <Text key={s} style={styles.salida}>
                    {fecha(s)}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
          {c.seccion === "turismo" && d.incluye?.length ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.subtitulo}>Incluye</Text>
              {d.incluye.map((i) => (
                <Linea key={i} icono="checkmark-circle-outline" texto={i} />
              ))}
            </View>
          ) : null}

          {c.texto ? (
            <Text style={styles.texto} numberOfLines={completo || !largo ? undefined : 6}>
              {c.texto}
            </Text>
          ) : null}
          {largo && !completo ? (
            <Pressable onPress={() => setCompleto(true)} accessibilityRole="button">
              <Text style={styles.verMas}>Ver más</Text>
            </Pressable>
          ) : null}
          {c.referencia ? <Linea icono="map-outline" texto={c.referencia} /> : null}

          <View style={styles.anunciante}>
            <View style={styles.inicial}>
              <Ionicons name={c.seccion === "turismo" ? "business-outline" : "person-outline"} size={18} color={colores.primario} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.anuncianteNombre} numberOfLines={1}>
                {c.seccion === "turismo" ? `Organiza: ${c.contactoNombre}` : `${c.contactoNombre}${c.contactoRol ? ` · ${c.contactoRol}` : ""}`}
              </Text>
              <Text style={styles.meta}>
                {c.seccion === "turismo" ? "ELISUR difunde · tratas directo con ellos" : `Revisado por ELISUR · publicado ${hace(c.publicadoEn)} · ${vence(c.venceEn)}`}
              </Text>
            </View>
          </View>
          {!c.contactoWhatsapp && !c.contactoTelefono ? <Text style={styles.meta}>Quien publicó prefirió no mostrar su número.</Text> : null}

          <Pressable onPress={reportar} disabled={reportado} style={{ alignSelf: "center", padding: 8 }} accessibilityRole="button">
            <Text style={styles.reportar}>{reportado ? "Gracias, lo revisaremos." : "¿Algo no cuadra? Reportar aviso"}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: insets.bottom + 10 }]}>
        <BotonesContacto c={c} style={{ padding: 0, paddingTop: 0 }} />
      </View>
    </View>
  );
}

function Linea({ icono, texto }: { icono: keyof typeof Ionicons.glyphMap; texto: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.linea}>
      <Ionicons name={icono} size={16} color={colores.textoSuave} />
      <Text style={styles.lineaTexto}>{texto}</Text>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    icono: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    cuerpo: { padding: espaciado.md, gap: 12, width: "100%", maxWidth: 640, alignSelf: "center" },
    filaEtiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    etiqueta: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden", letterSpacing: 0.3 },
    etiquetaSuave: { color: colores.texto, fontFamily: "SchibstedGrotesk_700Bold", fontSize: 11.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden", backgroundColor: colores.superficieHundida },
    precio: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 26, color: colores.texto },
    titulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 19, lineHeight: 24, color: colores.texto },
    subtitulo: { ...tipografia.subtitulo, fontSize: 16, color: colores.texto },
    cifras: { flexDirection: "row", gap: 6 },
    cifra: { flex: 1, backgroundColor: colores.superficieHundida, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
    cifraValor: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 17, color: colores.texto },
    cifraTexto: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave },
    recuadro: { backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 12, gap: 8 },
    salida: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 13, color: colores.primario, borderWidth: 1.5, borderColor: colores.primario, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, overflow: "hidden" },
    texto: { ...tipografia.cuerpo, fontSize: 15, lineHeight: 22, color: colores.texto },
    verMas: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.primario },
    linea: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    lineaTexto: { ...tipografia.cuerpo, fontSize: 14, color: colores.texto, flex: 1 },
    anunciante: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: colores.superficieHundida },
    inicial: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.superficie, alignItems: "center", justifyContent: "center" },
    anuncianteNombre: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.texto },
    meta: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave },
    reportar: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, textDecorationLine: "underline" },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: espaciado.md, paddingTop: 10, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
  });
}
