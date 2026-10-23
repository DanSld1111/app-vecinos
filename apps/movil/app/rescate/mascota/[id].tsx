import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Convive, ETIQUETA_ESTADO_MASCOTA, edadMascota, tamanoMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../../src/disenio";
import { useMascota } from "../../../src/datos/hooks/useRescate";
import { urlCompleta } from "../../../src/utilidades/media";
import { GaleriaFotos } from "../../../src/componentes/fichasRubro/GaleriaFotos";
import { EstadoVacio } from "../../../src/componentes/EstadoVacio";
import { BotonRescate, ROJO_AVISO, volverARescate } from "../../../src/componentes/rescate/comun";

const ANCHO_MAXIMO = 640;

const CONVIVE: { clave: "ninos" | "perros" | "gatos"; texto: string }[] = [
  { clave: "ninos", texto: "Con niños" },
  { clave: "perros", texto: "Con perros" },
  { clave: "gatos", texto: "Con gatos" },
];

/** Perfil de una mascota en adopción (decisión 0097). */
export default function PerfilMascota() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ancho = Math.min(width, ANCHO_MAXIMO);
  const { data: m, isLoading } = useMascota(id);

  if (isLoading) return <ActivityIndicator style={{ marginTop: insets.top + 80 }} color={colores.primario} />;
  if (!m)
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40, backgroundColor: colores.fondo }}>
        <EstadoVacio titulo="Esta mascota ya no está publicada. Quizás ya encontró hogar." accionTexto="Ver otras" onAccion={volverARescate} />
      </View>
    );

  const hembra = m.sexo === "hembra";
  const fotos = [m.fotoUrl, ...m.fotos].filter((f): f is string => Boolean(f)).map((f) => urlCompleta(f)!);
  const salud = [
    { si: m.salud.vacunas, texto: "Vacunas al día" },
    { si: m.salud.esterilizado, texto: hembra ? "Esterilizada" : "Esterilizado" },
    { si: m.salud.desparasitado, texto: hembra ? "Desparasitada" : "Desparasitado" },
    { si: m.salud.microchip, texto: m.salud.microchip ? "Con microchip" : "Sin microchip" },
  ];
  const convivencias = CONVIVE.map((c) => ({ ...c, valor: (m.convivencia[c.clave] ?? "nose") as Convive })).filter((c) => c.valor !== "nose");
  const compartir = () => Share.share({ message: `${m.nombre} busca hogar en ${m.albergue.nombre}. Míralo en ELISUR.` });

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130, width: ancho, alignSelf: "center" }}>
        <View style={{ paddingTop: insets.top }}>
          <GaleriaFotos fotos={fotos} alto={Math.round(ancho * 1.0)} ancho={ancho} icono="paw-outline" />
          <Pressable onPress={volverARescate} style={[styles.botonFoto, { top: insets.top + 12, left: 14 }]} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color="#141a16" />
          </Pressable>
          <Pressable onPress={compartir} style={[styles.botonFoto, { top: insets.top + 12, right: 14 }]} accessibilityRole="button" accessibilityLabel="Compartir">
            <Ionicons name="share-outline" size={20} color="#141a16" />
          </Pressable>
        </View>

        <View style={styles.cuerpo}>
          <View style={{ gap: 4 }}>
            <Text style={[styles.estado, m.estado === "en_proceso" && { backgroundColor: "#fdf0d9", color: "#6b4a0e" }]}>{ETIQUETA_ESTADO_MASCOTA[m.estado]}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text style={styles.nombre}>{m.nombre}</Text>
              {m.urgente ? <Text style={styles.urgente}>Urgente</Text> : null}
            </View>
          </View>

          <View style={styles.cuadros}>
            {[
              { valor: hembra ? "Hembra" : "Macho", etiqueta: "Sexo" },
              { valor: edadMascota(m), etiqueta: "Edad" },
              { valor: tamanoMascota(m), etiqueta: "Tamaño" },
              ...(m.pesoKg ? [{ valor: `${m.pesoKg} kg`, etiqueta: "Peso" }] : []),
            ].map((c) => (
              <View key={c.etiqueta} style={styles.cuadro}>
                <Text style={styles.cuadroValor}>{c.valor}</Text>
                <Text style={styles.cuadroEtiqueta}>{c.etiqueta}</Text>
              </View>
            ))}
          </View>

          {m.personalidad.length ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.subtitulo}>Su personalidad</Text>
              <View style={styles.chips}>
                {m.personalidad.map((p) => (
                  <Text key={p} style={styles.chip}>
                    {p}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {convivencias.length ? (
            <View style={styles.convive}>
              {convivencias.map((c) => {
                const si = c.valor === "si";
                return (
                  <View key={c.clave} style={[styles.conviveCaja, { backgroundColor: si ? colores.primarioSuave : "#fdeee8" }]}>
                    <Ionicons name={si ? "checkmark" : "close"} size={20} color={si ? colores.primarioFuerte : "#8f2a16"} />
                    <Text style={[styles.conviveTexto, { color: si ? colores.primarioFuerte : "#8f2a16" }]}>{c.texto}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={styles.subtitulo}>Salud</Text>
            <View style={styles.salud}>
              {salud.map((s) => (
                <View key={s.texto} style={styles.saludFila}>
                  <Ionicons name={s.si ? "checkmark-circle" : "ellipse-outline"} size={20} color={s.si ? colores.primario : colores.textoTenue} />
                  <Text style={[styles.saludTexto, !s.si && { color: colores.textoSuave }]}>{s.si || s.texto.startsWith("Sin") ? s.texto : `${s.texto}: por confirmar`}</Text>
                </View>
              ))}
            </View>
            {m.salud.cuidadosEspeciales ? <Text style={styles.nota}>Necesita cuidados especiales: el albergue te cuenta cuáles.</Text> : null}
          </View>

          {m.historia ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.subtitulo}>Su historia</Text>
              <Text style={styles.historia}>{m.historia}</Text>
            </View>
          ) : null}

          <Pressable style={styles.albergue} onPress={() => router.push(`/negocio/${m.albergue.id}`)} accessibilityRole="button">
            {m.albergue.fotoPrincipalUrl ? <Image source={{ uri: urlCompleta(m.albergue.fotoPrincipalUrl) }} style={styles.albergueFoto} /> : <View style={[styles.albergueFoto, { backgroundColor: colores.superficieHundida }]} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.albergueNombre}>{m.albergue.nombre}</Text>
              <Text style={styles.nota} numberOfLines={1}>
                {m.albergue.direccion}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colores.texto} />
          </Pressable>

          <View style={styles.requisitos}>
            <Text style={[styles.subtitulo, { fontSize: 15 }]}>Para adoptar a {m.nombre}</Text>
            <Text style={styles.nota}>
              {m.datosAlbergue.requisitos?.trim() ||
                "Ser mayor de edad, DNI y compromiso de cuidarla toda su vida. El albergue te cuenta el resto en la entrevista. La adopción es gratuita."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {m.estado !== "adoptada" ? (
        <View style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {m.apadrinable ? (
            <BotonRescate texto="Apadrinar" tipo="secundario" style={{ flex: 1 }} onPress={() => router.push(`/rescate/apadrinar/${m.id}`)} />
          ) : null}
          <BotonRescate texto={hembra ? "Quiero adoptarla" : "Quiero adoptarlo"} icono="heart" style={{ flex: 1.4 }} onPress={() => router.push(`/rescate/adoptar/${m.id}`)} />
        </View>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    botonFoto: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
    cuerpo: { padding: espaciado.lg, gap: espaciado.lg },
    estado: { alignSelf: "flex-start", backgroundColor: colores.primarioSuave, color: colores.primarioFuerte, fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
    nombre: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 30, color: colores.texto },
    urgente: { backgroundColor: ROJO_AVISO, color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
    cuadros: { flexDirection: "row", gap: 8 },
    cuadro: { flex: 1, backgroundColor: colores.superficieHundida, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center", gap: 2 },
    cuadroValor: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto, textAlign: "center" },
    cuadroEtiqueta: { ...tipografia.pie, fontSize: 11.5, color: colores.textoSuave },
    subtitulo: { ...tipografia.subtitulo, fontSize: 17, color: colores.texto },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { ...tipografia.pie, fontSize: 13, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, overflow: "hidden" },
    convive: { flexDirection: "row", gap: 8 },
    conviveCaja: { flex: 1, borderRadius: 14, padding: 10, gap: 4 },
    conviveTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12.5 },
    salud: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
    saludFila: { width: "50%", flexDirection: "row", alignItems: "center", gap: 8 },
    saludTexto: { ...tipografia.cuerpo, fontSize: 14, color: colores.texto, flexShrink: 1 },
    nota: { ...tipografia.pie, fontSize: 13, lineHeight: 19, color: colores.textoSuave },
    historia: { ...tipografia.cuerpo, fontSize: 14.5, lineHeight: 22, color: colores.textoSuave },
    albergue: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colores.borde, borderRadius: 18, padding: 12 },
    albergueFoto: { width: 52, height: 52, borderRadius: 26 },
    albergueNombre: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, color: colores.texto },
    requisitos: { backgroundColor: colores.superficieHundida, borderRadius: 18, padding: 14, gap: 6 },
    pie: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 8, paddingHorizontal: espaciado.lg, paddingTop: 12, backgroundColor: colores.fondo, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
  });
}
