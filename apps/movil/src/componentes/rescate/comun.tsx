import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvisoMascota, Mascota, edadMascota, tamanoMascota } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { urlCompleta } from "../../utilidades/media";
import { useSesion } from "../../estado/useSesion";
import { SinFoto } from "../SinFoto";

/** Rescate animal (decisión 0097): piezas que comparten sus pantallas. */

export const ROJO_AVISO = "#b4361e";
export const AZUL_AVISO = "#2c5d8f";

export function volverARescate() {
  if (router.canGoBack()) router.back();
  else router.replace("/servicios/rescate-animal");
}

/** "hace 2 h", "hace 3 días". */
export function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 60) return min <= 1 ? "hace un momento" : `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** Barra de arriba con la flecha de volver (las pantallas de Rescate no usan header nativo). */
export function Cabecera({ titulo, subtitulo, derecha, onVolver = volverARescate }: { titulo: string; subtitulo?: string; derecha?: ReactNode; onVolver?: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={onVolver} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={26} color={colores.texto} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {derecha}
    </View>
  );
}

/** Para el invitado: adoptar, apadrinar y publicar avisos piden la cuenta de vecino. */
export function PedirSesion({ texto }: { texto: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  return (
    <View style={styles.pedirSesion}>
      <Ionicons name="person-circle-outline" size={40} color={colores.primario} />
      <Text style={styles.pedirTexto}>{texto}</Text>
      <BotonRescate texto="Iniciar sesión o crear cuenta" onPress={cerrarSesion} />
    </View>
  );
}

export function BotonRescate({
  texto,
  onPress,
  tipo = "principal",
  icono,
  deshabilitado,
  style,
}: {
  texto: string;
  onPress: () => void;
  tipo?: "principal" | "secundario" | "peligro";
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const fondo = tipo === "principal" ? colores.primario : tipo === "peligro" ? ROJO_AVISO : "transparent";
  const color = tipo === "secundario" ? colores.texto : "#ffffff";
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(deshabilitado) }}
      style={[styles.boton, { backgroundColor: fondo, opacity: deshabilitado ? 0.5 : 1 }, tipo === "secundario" && { borderWidth: 1.5, borderColor: colores.texto }, style]}
    >
      {icono ? <Ionicons name={icono} size={18} color={color} /> : null}
      <Text style={[styles.botonTexto, { color }]}>{texto}</Text>
    </Pressable>
  );
}

/** Botones de una sola elección (Perros / Gatos, Perdidos / Encontrados). */
export function Segmentos<T extends string>({ opciones, valor, onCambiar, etiqueta }: { opciones: { id: T; texto: string }[]; valor: T; onCambiar: (v: T) => void; etiqueta: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.segmentos} accessibilityRole="tablist" accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pressable key={o.id} onPress={() => onCambiar(o.id)} style={[styles.segmento, activo && styles.segmentoActivo]} accessibilityRole="tab" accessibilityState={{ selected: activo }}>
            <Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}>{o.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Chips de elección (también para varias: `activo` lo decide quien llama). */
export function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

export function TarjetaMascota({ m, onPress, style }: { m: Mascota; onPress: () => void; style?: ViewStyle }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const foto = urlCompleta(m.fotoUrl);
  const rasgo = m.salud.esterilizado ? (m.sexo === "hembra" ? "Esterilizada" : "Esterilizado") : m.personalidad[0] ?? (m.salud.vacunas ? "Vacunas al día" : null);
  return (
    <Pressable onPress={onPress} style={[styles.tarjeta, style]} accessibilityRole="button" accessibilityLabel={`${m.nombre}, ${m.sexo}, ${edadMascota(m)}`}>
      <View style={styles.fotoTarjeta}>
        {foto ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <SinFoto icono="paw-outline" style={StyleSheet.absoluteFill} />}
        {m.urgente ? <Text style={styles.urgente}>Urgente</Text> : null}
        {m.estado === "en_proceso" ? <Text style={styles.enProceso}>En proceso</Text> : null}
      </View>
      <View style={styles.infoTarjeta}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.nombre} numberOfLines={1}>
            {m.nombre}
          </Text>
          <Text style={[styles.sexo, { color: m.sexo === "hembra" ? "#9a3a68" : AZUL_AVISO }]}>{m.sexo === "hembra" ? "♀ Hembra" : "♂ Macho"}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {edadMascota(m)} · {tamanoMascota(m)}
        </Text>
        {rasgo ? (
          <Text style={styles.rasgo} numberOfLines={1}>
            {rasgo}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function TarjetaAviso({ a, onPress }: { a: AvisoMascota; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const perdido = a.tipo === "perdido";
  const foto = urlCompleta(a.fotos[0]);
  return (
    <Pressable onPress={onPress} style={styles.aviso} accessibilityRole="button" accessibilityLabel={`${perdido ? "Se busca" : "Encontrado"}: ${a.nombre || a.senas}`}>
      {foto ? <Image source={{ uri: foto }} style={styles.fotoAviso} resizeMode="cover" /> : <SinFoto icono="paw-outline" style={styles.fotoAviso} />}
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Text style={[styles.etiquetaAviso, { backgroundColor: perdido ? ROJO_AVISO : AZUL_AVISO }]}>
          {perdido ? "Se busca" : "Encontrado"} · {hace(a.creadoEn)}
        </Text>
        <Text style={styles.nombre} numberOfLines={1}>
          {a.nombre || (perdido ? "Sin nombre" : "Mascota encontrada")}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {a.senas}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={colores.textoSuave} />
          <Text style={styles.meta} numberOfLines={1}>
            {a.lugar}
          </Text>
        </View>
        {a.pistas ? <Text style={styles.pistas}>{a.pistas === 1 ? "1 pista de vecinos" : `${a.pistas} pistas de vecinos`}</Text> : null}
      </View>
    </Pressable>
  );
}

export function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    cabecera: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: espaciado.md, paddingBottom: 10, backgroundColor: colores.fondo, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    volver: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -6 },
    titulo: { ...tipografia.subtitulo, fontSize: 19, color: colores.texto },
    subtitulo: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave },
    pedirSesion: { alignItems: "center", gap: 10, padding: espaciado.lg, backgroundColor: colores.superficie, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    pedirTexto: { ...tipografia.cuerpo, color: colores.textoSuave, textAlign: "center" },
    boton: { minHeight: 50, borderRadius: 25, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    botonTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, textAlign: "center", flexShrink: 1 },
    segmentos: { flexDirection: "row", backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 4, gap: 4 },
    segmento: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    segmentoActivo: { backgroundColor: colores.superficie, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    segmentoTexto: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.textoSuave },
    segmentoTextoActivo: { color: colores.texto, fontFamily: "SchibstedGrotesk_800ExtraBold" },
    chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1.5, borderColor: colores.bordeFuerte, justifyContent: "center", backgroundColor: colores.superficie },
    chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
    chipTexto: { ...tipografia.pie, fontSize: 13.5, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chipTextoActivo: { color: colores.fondo },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    fotoTarjeta: { aspectRatio: 4 / 5, backgroundColor: colores.superficieHundida },
    urgente: { position: "absolute", top: 8, left: 8, backgroundColor: ROJO_AVISO, color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden" },
    enProceso: { position: "absolute", bottom: 8, left: 8, backgroundColor: "#ffffff", color: "#6b4a0e", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden" },
    infoTarjeta: { paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11, gap: 2 },
    nombre: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto, flexShrink: 1 },
    sexo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 12 },
    meta: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, flexShrink: 1 },
    rasgo: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: colores.primario },
    aviso: { flexDirection: "row", gap: 12, backgroundColor: colores.superficie, borderRadius: 18, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    fotoAviso: { width: 96, height: 112, borderRadius: 12, backgroundColor: colores.superficieHundida },
    etiquetaAviso: { alignSelf: "flex-start", color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11.5, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden" },
    pistas: { ...tipografia.pie, fontSize: 12, fontFamily: "SchibstedGrotesk_700Bold", color: AZUL_AVISO },
  });
}
