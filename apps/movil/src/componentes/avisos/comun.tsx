import { ReactNode, useState } from "react";
import { Image, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clasificado, ETIQUETA_SUBTIPO, SeccionClasificado, precioClasificado, resumenClasificado } from "@app-vecinos/tipos";
import { PaletaColores, espaciado, tipografia, useColores } from "../../disenio";
import { urlCompleta } from "../../utilidades/media";
import { enlaceWhatsapp } from "../../utilidades/whatsapp";
import { registrarContacto } from "../../datos/hooks/useClasificados";
import { useSesion } from "../../estado/useSesion";
import { SinFoto } from "../SinFoto";

/** Avisos de la comunidad (decisión 0098): piezas que comparten sus pantallas. */

export const ROJO_SE_BUSCA = "#b8361f";
export const AZUL_TURISMO = "#1d3f73";

export const ICONO_SECCION: Record<SeccionClasificado, keyof typeof Ionicons.glyphMap> = {
  inmuebles: "home-outline",
  mascotas: "paw-outline",
  turismo: "airplane-outline",
};

export function volver(destino = "/comunidad") {
  if (router.canGoBack()) router.back();
  else router.replace(destino as never);
}

/** "hace 2 h", "hace 3 días". */
export function hace(iso: string | null): string {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 60) return min <= 1 ? "hace un momento" : `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** "vence en 5 días", "vence hoy", "venció". */
export function vence(iso: string | null): string {
  if (!iso) return "";
  const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return "venció";
  if (dias === 0) return "vence hoy";
  return dias === 1 ? "vence mañana" : `vence en ${dias} días`;
}

/** Color de la etiqueta según el tipo de aviso. */
export function colorEtiqueta(c: Pick<Clasificado, "seccion" | "subtipo">, colores: PaletaColores): string {
  if (c.subtipo === "perdido") return ROJO_SE_BUSCA;
  if (c.seccion === "turismo") return AZUL_TURISMO;
  return colores.primario;
}

/** WhatsApp con el mensaje ya escrito, o la llamada. Cuenta el contacto para «Mis avisos». */
export function contactar(c: Clasificado, medio: "whatsapp" | "llamar") {
  void registrarContacto(c.id);
  if (medio === "llamar") {
    Linking.openURL(`tel:${c.contactoTelefono || c.contactoWhatsapp}`);
    return;
  }
  const mensaje =
    c.subtipo === "perdido"
      ? `Hola, vi el aviso en ELISUR. Creo que vi a ${c.datos.nombreMascota || "tu mascota"}: `
      : `Hola, vi tu aviso en ELISUR: «${c.titulo}». ¿Sigue disponible?`;
  const url = enlaceWhatsapp(c.contactoWhatsapp, mensaje);
  if (url) Linking.openURL(url);
}

/** Barra de arriba con la flecha de volver. */
export function Cabecera({ titulo, subtitulo, derecha, onVolver = () => volver() }: { titulo: string; subtitulo?: string; derecha?: ReactNode; onVolver?: () => void }) {
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

/** Para el invitado: enviar un aviso pide la cuenta de vecino. */
export function PedirSesion({ texto }: { texto: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const cerrarSesion = useSesion((e) => e.cerrarSesion);
  return (
    <View style={styles.pedirSesion}>
      <Ionicons name="person-circle-outline" size={40} color={colores.primario} />
      <Text style={styles.pedirTexto}>{texto}</Text>
      <Boton texto="Iniciar sesión o crear cuenta" onPress={cerrarSesion} />
    </View>
  );
}

export function Boton({
  texto,
  onPress,
  tipo = "principal",
  icono,
  deshabilitado,
  style,
}: {
  texto: string;
  onPress: () => void;
  tipo?: "principal" | "secundario" | "suave";
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
  style?: ViewStyle;
}) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const fondo = tipo === "principal" ? colores.primario : tipo === "suave" ? colores.superficieHundida : "transparent";
  const color = tipo === "principal" ? "#ffffff" : tipo === "secundario" ? colores.primario : colores.texto;
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(deshabilitado) }}
      style={[styles.boton, { backgroundColor: fondo, opacity: deshabilitado ? 0.5 : 1 }, tipo === "secundario" && { borderWidth: 1.5, borderColor: colores.primario }, style]}
    >
      {icono ? <Ionicons name={icono} size={18} color={color} /> : null}
      <Text style={[styles.botonTexto, { color }]}>{texto}</Text>
    </Pressable>
  );
}

/** Botones de una sola elección (Alquiler / Venta, Perdidos / Encontrados / Adopción). */
export function Segmentos<T extends string>({ opciones, valor, onCambiar, etiqueta }: { opciones: { id: T; texto: string }[]; valor: T; onCambiar: (v: T) => void; etiqueta: string }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <View style={styles.segmentos} accessibilityRole="tablist" accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pressable key={o.id} onPress={() => onCambiar(o.id)} style={[styles.segmento, activo && styles.segmentoActivo]} accessibilityRole="tab" accessibilityState={{ selected: activo }}>
            <Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]} numberOfLines={1}>
              {o.texto}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]} accessibilityRole="button" accessibilityState={{ selected: activo }}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

/** Fotos que se deslizan de a una, con «1 / 21». */
export function CarruselFotos({ fotos, ancho, alto, icono = "image-outline" }: { fotos: string[]; ancho: number; alto: number; icono?: keyof typeof Ionicons.glyphMap }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const [indice, setIndice] = useState(0);
  const urls = fotos.map((f) => urlCompleta(f)).filter((u): u is string => Boolean(u));
  if (!urls.length) return <SinFoto icono={icono} style={{ width: ancho, height: alto }} />;
  const alDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndice(Math.round(e.nativeEvent.contentOffset.x / ancho));
  return (
    <View style={{ width: ancho, height: alto }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={alDeslizar} onScroll={alDeslizar} scrollEventThrottle={64}>
        {urls.map((u, i) => (
          <Image key={`${u}-${i}`} source={{ uri: u }} style={{ width: ancho, height: alto, backgroundColor: colores.superficieHundida }} resizeMode="cover" accessibilityIgnoresInvertColors />
        ))}
      </ScrollView>
      {urls.length > 1 ? (
        <>
          <Text style={styles.contador}>
            {indice + 1} / {urls.length}
          </Text>
          <View style={styles.puntos} pointerEvents="none">
            {urls.slice(0, 6).map((u, i) => (
              <View key={`p-${u}-${i}`} style={[styles.punto, i === Math.min(indice, 5) && styles.puntoActivo]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Iniciales({ nombre, seccion }: { nombre: string; seccion: SeccionClasificado }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const letras = nombre
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const turismo = seccion === "turismo";
  return (
    <View style={[styles.iniciales, turismo && { backgroundColor: AZUL_TURISMO, borderRadius: 10 }]}>
      <Text style={[styles.inicialesTexto, turismo && { color: "#ffffff" }]}>{letras || "?"}</Text>
    </View>
  );
}

/** Un aviso en el listado de su sección: como un post, con todas sus fotos y el contacto a mano. */
export function TarjetaClasificado({ c, ancho }: { c: Clasificado; ancho: number }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const precio = precioClasificado(c);
  const datos = resumenClasificado(c);
  const abrir = () => router.push(`/avisos/aviso/${c.id}`);
  const quien = c.seccion === "turismo" ? `Organiza: ${c.contactoNombre}` : `${c.contactoNombre}${c.contactoRol ? ` · ${c.contactoRol}` : ""}`;
  return (
    <View style={styles.post}>
      <Pressable onPress={abrir} style={styles.postCabecera} accessibilityRole="button" accessibilityLabel={`Ver aviso: ${c.titulo}`}>
        <Iniciales nombre={c.contactoNombre} seccion={c.seccion} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.postQuien} numberOfLines={1}>
            {quien}
          </Text>
          <Text style={styles.meta}>Publicado {hace(c.publicadoEn)}</Text>
        </View>
        <Text style={[styles.etiqueta, { backgroundColor: colorEtiqueta(c, colores) }]}>{ETIQUETA_SUBTIPO[c.subtipo]}</Text>
      </Pressable>
      <CarruselFotos fotos={c.fotos} ancho={ancho} alto={Math.round(ancho * 0.68)} icono={ICONO_SECCION[c.seccion]} />
      <Pressable onPress={abrir} style={styles.postCuerpo} accessibilityRole="button" accessibilityLabel={`Ver aviso: ${c.titulo}`}>
        {precio ? <Text style={styles.precio}>{precio}</Text> : null}
        <Text style={styles.postTitulo} numberOfLines={2}>
          {c.titulo}
        </Text>
        {datos.length ? (
          <View style={styles.filaDatos}>
            {datos.map((d) => (
              <Text key={d} style={styles.dato}>
                {d}
              </Text>
            ))}
          </View>
        ) : null}
        {c.referencia ? (
          <View style={styles.filaLugar}>
            <Ionicons name="location-outline" size={14} color={colores.textoSuave} />
            <Text style={styles.meta} numberOfLines={1}>
              {c.referencia}
            </Text>
          </View>
        ) : null}
      </Pressable>
      <BotonesContacto c={c} />
    </View>
  );
}

/** WhatsApp y Llamar, lado a lado. «Lo vi: avisar» si es una mascota que se busca. */
export function BotonesContacto({ c, style }: { c: Clasificado; style?: ViewStyle }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  if (!c.contactoWhatsapp && !c.contactoTelefono) return null;
  const textoWhatsapp = c.subtipo === "perdido" ? "Lo vi: avisar" : c.seccion === "turismo" ? "Consultar por WhatsApp" : "WhatsApp";
  return (
    <View style={[styles.filaBotones, style]}>
      {c.contactoWhatsapp ? <Boton texto={textoWhatsapp} icono="logo-whatsapp" onPress={() => contactar(c, "whatsapp")} style={{ flex: 2 }} /> : null}
      {c.contactoTelefono || (c.contactoWhatsapp && c.seccion !== "turismo") ? <Boton texto="Llamar" tipo="secundario" icono="call-outline" onPress={() => contactar(c, "llamar")} style={{ flex: 1 }} /> : null}
    </View>
  );
}

/** Tarjeta chica para carruseles (Inicio). */
export function MiniClasificado({ c, style }: { c: Clasificado; style?: ViewStyle }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const foto = urlCompleta(c.fotos[0]);
  const precio = precioClasificado(c);
  const linea = resumenClasificado(c).slice(0, 3).join(" · ");
  return (
    <Pressable onPress={() => router.push(`/avisos/aviso/${c.id}`)} style={[styles.mini, style]} accessibilityRole="button" accessibilityLabel={`${ETIQUETA_SUBTIPO[c.subtipo]}: ${c.titulo}`}>
      <View style={styles.miniFoto}>
        {foto ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <SinFoto icono={ICONO_SECCION[c.seccion]} style={StyleSheet.absoluteFill} />}
        <Text style={[styles.miniEtiqueta, { color: colorEtiqueta(c, colores) }]}>{ETIQUETA_SUBTIPO[c.subtipo].toUpperCase()}</Text>
      </View>
      <Text style={styles.miniTitulo} numberOfLines={1}>
        {precio ?? (c.datos.nombreMascota || c.titulo)}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {linea || c.referencia}
      </Text>
    </Pressable>
  );
}

/** Fila compacta (resultados de búsqueda, Comunidad). */
export function FilaClasificado({ c }: { c: Clasificado }) {
  const colores = useColores();
  const styles = crearEstilos(colores);
  const foto = urlCompleta(c.fotos[0]);
  const precio = precioClasificado(c);
  return (
    <Pressable onPress={() => router.push(`/avisos/aviso/${c.id}`)} style={styles.fila} accessibilityRole="button" accessibilityLabel={`${ETIQUETA_SUBTIPO[c.subtipo]}: ${c.titulo}`}>
      {foto ? <Image source={{ uri: foto }} style={styles.filaFoto} resizeMode="cover" /> : <SinFoto icono={ICONO_SECCION[c.seccion]} style={styles.filaFoto} />}
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Text style={[styles.filaEtiqueta, { color: colorEtiqueta(c, colores) }]}>
          {ETIQUETA_SUBTIPO[c.subtipo].toUpperCase()} · {hace(c.publicadoEn)}
        </Text>
        {precio ? <Text style={styles.filaPrecio}>{precio}</Text> : null}
        <Text style={styles.filaTitulo} numberOfLines={2}>
          {c.titulo}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {resumenClasificado(c).slice(0, 3).join(" · ") || c.referencia}
        </Text>
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
    boton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
    botonTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 15, textAlign: "center", flexShrink: 1 },
    segmentos: { flexDirection: "row", backgroundColor: colores.superficieHundida, borderRadius: 12, padding: 4, gap: 4 },
    segmento: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    segmentoActivo: { backgroundColor: colores.superficie, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    segmentoTexto: { ...tipografia.cuerpoDestacado, fontSize: 14, color: colores.textoSuave },
    segmentoTextoActivo: { color: colores.texto, fontFamily: "SchibstedGrotesk_800ExtraBold" },
    chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: colores.bordeFuerte, justifyContent: "center", backgroundColor: colores.superficie },
    chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
    chipTexto: { ...tipografia.pie, fontSize: 13.5, fontFamily: "SchibstedGrotesk_700Bold", color: colores.texto },
    chipTextoActivo: { color: "#ffffff" },
    contador: { position: "absolute", right: 12, top: 12, backgroundColor: "rgba(20,26,22,.72)", color: "#ffffff", fontFamily: "SchibstedGrotesk_700Bold", fontSize: 12, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
    puntos: { position: "absolute", left: 0, right: 0, bottom: 10, flexDirection: "row", justifyContent: "center", gap: 5 },
    punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.6)" },
    puntoActivo: { width: 18, backgroundColor: "#ffffff" },
    iniciales: { width: 38, height: 38, borderRadius: 19, backgroundColor: colores.superficieHundida, alignItems: "center", justifyContent: "center" },
    inicialesTexto: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.primario },
    post: { backgroundColor: colores.superficie, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
    postCabecera: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: espaciado.md, paddingVertical: 12 },
    postQuien: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 14, color: colores.texto },
    postCuerpo: { paddingHorizontal: espaciado.md, paddingTop: 12, gap: 7 },
    postTitulo: { fontFamily: "SchibstedGrotesk_700Bold", fontSize: 16, lineHeight: 21, color: colores.texto },
    precio: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 21, color: colores.texto },
    etiqueta: { color: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden", letterSpacing: 0.3 },
    filaDatos: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    dato: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 13, color: colores.texto, backgroundColor: colores.superficieHundida, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden" },
    filaLugar: { flexDirection: "row", alignItems: "center", gap: 5 },
    filaBotones: { flexDirection: "row", gap: 8, padding: espaciado.md, paddingTop: 12 },
    meta: { ...tipografia.pie, fontSize: 12.5, color: colores.textoSuave, flexShrink: 1 },
    mini: { width: 168, gap: 4 },
    miniFoto: { width: 168, height: 118, borderRadius: 12, overflow: "hidden", backgroundColor: colores.superficieHundida },
    miniEtiqueta: { position: "absolute", left: 7, top: 7, backgroundColor: "#ffffff", fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 10, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
    miniTitulo: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 14, color: colores.texto },
    fila: { flexDirection: "row", gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    filaFoto: { width: 104, height: 88, borderRadius: 10, backgroundColor: colores.superficieHundida },
    filaEtiqueta: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 11, letterSpacing: 0.3 },
    filaPrecio: { fontFamily: "SchibstedGrotesk_800ExtraBold", fontSize: 16, color: colores.texto },
    filaTitulo: { fontFamily: "SchibstedGrotesk_600SemiBold", fontSize: 14, lineHeight: 18, color: colores.texto },
  });
}
